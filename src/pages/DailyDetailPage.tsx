import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { UnauthorizedError } from '../services/auth'
import {
  closeDailyTip,
  createDailyParticipation,
  deleteDailyParticipation,
  fetchAvailableWorkers,
  fetchDailyDetail,
  reopenDailyTip,
  updateDailyParticipation,
  updateDailyTip,
} from '../services/tips'
import { useAuthStore } from '../store/authStore'
import type { AvailableWorker, DailyDetailResponse, DailyParticipation } from '../types/api'

type LoadDailyDetailOptions = {
  preserveViewOnError?: boolean
}

export function DailyDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const { dailyTipId } = useParams()
  const [dailyDetail, setDailyDetail] = useState<DailyDetailResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [isEditingTotalAmount, setIsEditingTotalAmount] = useState(false)
  const [draftTotalAmount, setDraftTotalAmount] = useState('')
  const [draftTotalAmountReason, setDraftTotalAmountReason] = useState('')
  const [isConfirmingClosedState, setIsConfirmingClosedState] = useState(false)
  const [isAddingWorker, setIsAddingWorker] = useState(false)
  const [availableWorkers, setAvailableWorkers] = useState<AvailableWorker[]>([])
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [draftWorkerHours, setDraftWorkerHours] = useState('0.00')
  const [draftWorkerReason, setDraftWorkerReason] = useState('')
  const [editingParticipationId, setEditingParticipationId] = useState<number | null>(null)
  const [draftEditHours, setDraftEditHours] = useState('')
  const [draftEditReason, setDraftEditReason] = useState('')
  const [deletingParticipationId, setDeletingParticipationId] = useState<number | null>(null)
  const [draftDeleteReason, setDraftDeleteReason] = useState('')
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadDailyDetail = useCallback(
    async ({ preserveViewOnError = false }: LoadDailyDetailOptions = {}) => {
      if (!isMountedRef.current) {
        return false
      }

      const parsedDailyTipId = Number(dailyTipId)

      if (!dailyTipId || Number.isNaN(parsedDailyTipId) || parsedDailyTipId <= 0) {
        if (isMountedRef.current) {
          setLoadError('El identificador del día no es válido.')
          setIsLoading(false)
        }
        return false
      }

      if (isMountedRef.current) {
        if (!preserveViewOnError) {
          setIsLoading(true)
          setLoadError(null)
        }
        setActionError(null)
      }

      try {
        const response = await fetchDailyDetail(parsedDailyTipId)
        if (isMountedRef.current) {
          setDailyDetail(response)
          setLoadError(null)
        }
        return true
      } catch (loadError) {
        if (loadError instanceof UnauthorizedError) {
          logout()
          navigate('/login', { replace: true, state: { from: location.pathname } })
          return false
        }

        if (isMountedRef.current) {
          const message =
            loadError instanceof Error ? loadError.message : 'No se pudo cargar el detalle del día.'

          if (preserveViewOnError) {
            setActionError(message)
          } else {
            setLoadError(message)
          }
        }
        return false
      } finally {
        if (isMountedRef.current && !preserveViewOnError) {
          setIsLoading(false)
        }
      }
    },
    [dailyTipId, location.pathname, logout, navigate],
  )

  useEffect(() => {
    void loadDailyDetail()
  }, [loadDailyDetail])

  useEffect(() => {
    if (!dailyDetail) {
      return
    }

    setDraftTotalAmount(dailyDetail.total_amount)
    setDraftTotalAmountReason('')
    setIsEditingTotalAmount(false)
    setIsConfirmingClosedState(false)
    setIsAddingWorker(false)
    setAvailableWorkers([])
    setSelectedWorkerId('')
    setDraftWorkerHours('0.00')
    setDraftWorkerReason('')
    setEditingParticipationId(null)
    setDraftEditHours('')
    setDraftEditReason('')
    setDeletingParticipationId(null)
    setDraftDeleteReason('')
    setActionError(null)
  }, [dailyDetail])

  function getParticipationByUserId(userId: number) {
    return dailyDetail?.participations.find((participation) => participation.user.id === userId)
  }

  async function handleSubmitTotalAmount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!dailyDetail) {
      return
    }

    const trimmedAmount = draftTotalAmount.trim()
    if (!trimmedAmount) {
      setActionError('El bote total no puede quedar vacío.')
      return
    }

    const parsedAmount = Number(trimmedAmount.replace(',', '.'))
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setActionError('El bote total debe ser un número válido mayor que 0.')
      return
    }

    const normalizedAmount = parsedAmount.toFixed(2)
    const changeReason = dailyDetail.is_closed ? draftTotalAmountReason.trim() : ''

    try {
      setIsSubmittingAction(true)
      setActionError(null)
      await updateDailyTip(dailyDetail.id, {
        total_amount: normalizedAmount,
        change_reason: changeReason,
      })
      const didReload = await loadDailyDetail({ preserveViewOnError: true })
      if (didReload && isMountedRef.current) {
        setIsEditingTotalAmount(false)
      }
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return
      }

      setActionError(
        actionError instanceof Error ? actionError.message : 'No se pudo actualizar el bote.',
      )
    } finally {
      if (isMountedRef.current) {
        setIsSubmittingAction(false)
      }
    }
  }

  async function handleConfirmClosedState() {
    if (!dailyDetail) {
      return
    }

    try {
      setIsSubmittingAction(true)
      setActionError(null)

      if (dailyDetail.is_closed) {
        await reopenDailyTip(dailyDetail.id)
      } else {
        await closeDailyTip(dailyDetail.id)
      }

      const didReload = await loadDailyDetail({ preserveViewOnError: true })
      if (didReload && isMountedRef.current) {
        setIsConfirmingClosedState(false)
      }
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return
      }

      setActionError(
        actionError instanceof Error
          ? actionError.message
          : 'No se pudo actualizar el estado del día.',
      )
    } finally {
      if (isMountedRef.current) {
        setIsSubmittingAction(false)
      }
    }
  }

  async function handleOpenAddWorkerForm() {
    if (!dailyDetail) {
      return
    }

    try {
      setIsSubmittingAction(true)
      setActionError(null)

      const availableWorkers = await fetchAvailableWorkers(dailyDetail.id)

      if (!availableWorkers.length) {
        setActionError('No hay trabajadores disponibles para añadir a este día.')
        return
      }

      if (isMountedRef.current) {
        setAvailableWorkers(availableWorkers)
        setSelectedWorkerId(String(availableWorkers[0]?.id ?? ''))
        setDraftWorkerHours('0.00')
        setDraftWorkerReason('')
        setIsAddingWorker(true)
        setIsEditingTotalAmount(false)
        setIsConfirmingClosedState(false)
      }
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return
      }

      setActionError(
        actionError instanceof Error
          ? actionError.message
          : 'No se pudo añadir el trabajador al día.',
      )
    } finally {
      if (isMountedRef.current) {
        setIsSubmittingAction(false)
      }
    }
  }

  async function handleSubmitAddWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!dailyDetail) {
      return
    }

    const parsedSelectedWorkerId = Number(selectedWorkerId)
    const selectedWorker = availableWorkers.find((worker) => worker.id === parsedSelectedWorkerId)
    if (!selectedWorker) {
      setActionError('Debes elegir un trabajador válido de la lista.')
      return
    }

    const parsedHours = Number(draftWorkerHours.trim().replace(',', '.'))
    if (Number.isNaN(parsedHours) || parsedHours < 0) {
      setActionError('Las horas deben ser un número válido igual o mayor que 0.')
      return
    }

    try {
      setIsSubmittingAction(true)
      setActionError(null)
      await createDailyParticipation({
        daily_tip: dailyDetail.id,
        user_id: selectedWorker.id,
        hours_worked: parsedHours.toFixed(2),
        change_reason: dailyDetail.is_closed ? draftWorkerReason.trim() : '',
      })
      const didReload = await loadDailyDetail({ preserveViewOnError: true })
      if (didReload && isMountedRef.current) {
        setIsAddingWorker(false)
      }
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return
      }

      setActionError(
        actionError instanceof Error
          ? actionError.message
          : 'No se pudo añadir el trabajador al día.',
      )
    } finally {
      if (isMountedRef.current) {
        setIsSubmittingAction(false)
      }
    }
  }

  function handleStartEditHours(participation: DailyParticipation) {
    if (editingParticipationId === participation.id) {
      setEditingParticipationId(null)
      setDraftEditHours('')
      setDraftEditReason('')
      return
    }

    setActionError(null)
    setDeletingParticipationId(null)
    setEditingParticipationId(participation.id)
    setDraftEditHours(participation.hours_worked)
    setDraftEditReason('')
  }

  async function handleSubmitEditHours(
    event: FormEvent<HTMLFormElement>,
    participation: DailyParticipation,
  ) {
    event.preventDefault()

    const parsedHours = Number(draftEditHours.trim().replace(',', '.'))
    if (Number.isNaN(parsedHours) || parsedHours < 0) {
      setActionError('Las horas deben ser un número válido igual o mayor que 0.')
      return
    }

    try {
      setIsSubmittingAction(true)
      setActionError(null)
      await updateDailyParticipation(participation.id, {
        hours_worked: parsedHours.toFixed(2),
        change_reason: dailyDetail?.is_closed ? draftEditReason.trim() : '',
      })
      const didReload = await loadDailyDetail({ preserveViewOnError: true })
      if (didReload && isMountedRef.current) {
        setEditingParticipationId(null)
      }
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return
      }

      setActionError(
        actionError instanceof Error ? actionError.message : 'No se pudieron actualizar las horas.',
      )
    } finally {
      if (isMountedRef.current) {
        setIsSubmittingAction(false)
      }
    }
  }

  function handleStartDeleteParticipation(participationId: number) {
    if (deletingParticipationId === participationId) {
      setDeletingParticipationId(null)
      setDraftDeleteReason('')
      return
    }

    setActionError(null)
    setEditingParticipationId(null)
    setDeletingParticipationId(participationId)
    setDraftDeleteReason('')
  }

  async function handleConfirmDeleteParticipation(participation: DailyParticipation) {
    try {
      setIsSubmittingAction(true)
      setActionError(null)
      await deleteDailyParticipation(
        participation.id,
        dailyDetail?.is_closed ? draftDeleteReason.trim() : '',
      )
      const didReload = await loadDailyDetail({ preserveViewOnError: true })
      if (didReload && isMountedRef.current) {
        setDeletingParticipationId(null)
      }
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return
      }

      setActionError(
        actionError instanceof Error
          ? actionError.message
          : 'No se pudo eliminar la participación.',
      )
    } finally {
      if (isMountedRef.current) {
        setIsSubmittingAction(false)
      }
    }
  }

  if (isLoading) {
    return (
      <section className="page">
        <header className="page-header-block">
          <div>
            <p className="eyebrow">Pantalla 2</p>
            <h2 className="page-title">Detalle del día {dailyTipId}</h2>
          </div>

          <Link className="btn ghost" to="/dashboard/weekly">
            Volver a semana
          </Link>
        </header>

        <section className="card">
          <p className="muted">Cargando detalle del día...</p>
        </section>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="page">
        <header className="page-header-block">
          <div>
            <p className="eyebrow">Pantalla 2</p>
            <h2 className="page-title">Detalle del día {dailyTipId}</h2>
          </div>

          <Link className="btn ghost" to="/dashboard/weekly">
            Volver a semana
          </Link>
        </header>

        <section className="card">
          <p className="muted">{loadError}</p>
        </section>
      </section>
    )
  }

  if (!dailyDetail) {
    return null
  }

  const workerCount = dailyDetail.worker_rows.length
  const historyCount = dailyDetail.history.length
  const statusLabel = dailyDetail.is_closed ? 'Cerrado' : 'Abierto'
  const statusDescription = dailyDetail.is_closed
    ? 'El día está bloqueado y cualquier cambio debe quedar trazado.'
    : 'El día sigue abierto y se puede ajustar antes del cierre.'

  return (
    <section className="page">
      <header className="page-header-block">
        <div>
          <p className="eyebrow">Pantalla 2</p>
          <h2 className="page-title">Detalle del día {dailyDetail.date}</h2>
          <p className="muted">
            Gestiona el bote, el reparto y el historial del día sin salir de esta pantalla.
          </p>
        </div>

        <div className="detail-header-side">
          <div className="summary-pill">
            <span>Estado del día</span>
            <strong>{statusLabel}</strong>
          </div>

          <Link className="btn ghost" to="/dashboard/weekly">
            Volver a semana
          </Link>
        </div>
      </header>

      {actionError ? (
        <section className="alert-banner" role="alert">
          <strong>Revisa la acción</strong>
          <p>{actionError}</p>
        </section>
      ) : null}

      <section className="card detail-hero">
        <div className="detail-hero-top">
          <div>
            <p className="eyebrow">Resumen</p>
            <h3 className="section-title">Estado general del día</h3>
            <p className="muted">{statusDescription}</p>
          </div>
          <span
            className={`status-chip ${dailyDetail.is_closed ? 'status-chip--closed' : 'status-chip--open'}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="stats-row">
          <div className="stat">
            <span className="stat-label">Fecha</span>
            <strong>{dailyDetail.date}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Bote total</span>
            <strong>{dailyDetail.total_amount} EUR</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Método</span>
            <strong>{dailyDetail.distribution_method}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Trabajadores</span>
            <strong>{workerCount}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Eventos</span>
            <strong>{historyCount}</strong>
          </div>
        </div>
      </section>

      <section className="detail-main-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Acciones</p>
              <h3 className="section-title">Cambios del día</h3>
              <p className="muted">Las acciones mantienen la trazabilidad actual del backend.</p>
            </div>
          </div>

          <div className="actions-bar">
            <button
              className="btn primary"
              type="button"
              onClick={handleOpenAddWorkerForm}
              disabled={isSubmittingAction}
            >
              {isAddingWorker ? 'Recargar trabajadores' : 'Añadir trabajador'}
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                setActionError(null)
                setIsEditingTotalAmount((current) => !current)
                setIsConfirmingClosedState(false)
                setIsAddingWorker(false)
              }}
              disabled={isSubmittingAction}
            >
              {isEditingTotalAmount ? 'Cancelar edición' : 'Editar bote'}
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                setActionError(null)
                setIsConfirmingClosedState((current) => !current)
                setIsEditingTotalAmount(false)
                setIsAddingWorker(false)
              }}
              disabled={isSubmittingAction}
            >
              {isConfirmingClosedState
                ? 'Cancelar cambio de estado'
                : dailyDetail.is_closed
                  ? 'Reabrir día'
                  : 'Cerrar día'}
            </button>
          </div>

          <div className="detail-side-stack">
            {isEditingTotalAmount ? (
              <form className="panel-card stack gap-md" onSubmit={handleSubmitTotalAmount}>
                <div className="panel-card-header">
                  <div>
                    <p className="eyebrow">Bote</p>
                    <h4 className="section-title">Editar total del día</h4>
                  </div>
                </div>

                <div className="field">
                  <label className="label" htmlFor="total-amount">
                    Nuevo bote total
                  </label>
                  <input
                    id="total-amount"
                    className="input"
                    value={draftTotalAmount}
                    onChange={(event) => setDraftTotalAmount(event.target.value)}
                    disabled={isSubmittingAction}
                  />
                </div>

                {dailyDetail.is_closed ? (
                  <div className="field">
                    <label className="label" htmlFor="total-amount-reason">
                      Motivo del cambio
                    </label>
                    <input
                      id="total-amount-reason"
                      className="input"
                      value={draftTotalAmountReason}
                      onChange={(event) => setDraftTotalAmountReason(event.target.value)}
                      disabled={isSubmittingAction}
                    />
                  </div>
                ) : null}

                <div className="actions-bar">
                  <button className="btn primary" type="submit" disabled={isSubmittingAction}>
                    Guardar bote
                  </button>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => {
                      setDraftTotalAmount(dailyDetail.total_amount)
                      setDraftTotalAmountReason('')
                      setIsEditingTotalAmount(false)
                      setActionError(null)
                    }}
                    disabled={isSubmittingAction}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : null}

            {isConfirmingClosedState ? (
              <div className="panel-card stack gap-md">
                <div className="panel-card-header">
                  <div>
                    <p className="eyebrow">Estado</p>
                    <h4 className="section-title">
                      {dailyDetail.is_closed ? 'Confirmar reapertura' : 'Confirmar cierre'}
                    </h4>
                  </div>
                </div>

                <p className="muted">
                  {dailyDetail.is_closed
                    ? 'Confirma si quieres reabrir este día.'
                    : 'Confirma si quieres cerrar este día.'}
                </p>
                <div className="actions-bar">
                  <button
                    className="btn primary"
                    type="button"
                    onClick={handleConfirmClosedState}
                    disabled={isSubmittingAction}
                  >
                    {dailyDetail.is_closed ? 'Confirmar reapertura' : 'Confirmar cierre'}
                  </button>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => {
                      setIsConfirmingClosedState(false)
                      setActionError(null)
                    }}
                    disabled={isSubmittingAction}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}

            {isAddingWorker ? (
              <form className="panel-card stack gap-md" onSubmit={handleSubmitAddWorker}>
                <div className="panel-card-header">
                  <div>
                    <p className="eyebrow">Participación</p>
                    <h4 className="section-title">Añadir trabajador</h4>
                  </div>
                </div>

                <div className="field">
                  <label className="label" htmlFor="add-worker-select">
                    Trabajador
                  </label>
                  <select
                    id="add-worker-select"
                    className="input"
                    value={selectedWorkerId}
                    onChange={(event) => setSelectedWorkerId(event.target.value)}
                    disabled={isSubmittingAction}
                  >
                    {availableWorkers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.display_name} ({worker.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="label" htmlFor="add-worker-hours">
                    Horas trabajadas
                  </label>
                  <input
                    id="add-worker-hours"
                    className="input"
                    value={draftWorkerHours}
                    onChange={(event) => setDraftWorkerHours(event.target.value)}
                    disabled={isSubmittingAction}
                  />
                </div>

                {dailyDetail.is_closed ? (
                  <div className="field">
                    <label className="label" htmlFor="add-worker-reason">
                      Motivo del cambio
                    </label>
                    <input
                      id="add-worker-reason"
                      className="input"
                      value={draftWorkerReason}
                      onChange={(event) => setDraftWorkerReason(event.target.value)}
                      disabled={isSubmittingAction}
                    />
                  </div>
                ) : null}

                <div className="actions-bar">
                  <button className="btn primary" type="submit" disabled={isSubmittingAction}>
                    Guardar trabajador
                  </button>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => {
                      setIsAddingWorker(false)
                      setActionError(null)
                    }}
                    disabled={isSubmittingAction}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : null}

            {!isEditingTotalAmount && !isConfirmingClosedState && !isAddingWorker ? (
              <div className="note">
                <strong>Acción activa: ninguna</strong>
                <p className="muted">
                  Selecciona una acción para editar el bote, cambiar el estado o añadir un
                  trabajador.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Reparto</p>
              <h3 className="section-title">Trabajadores del día</h3>
              <p className="muted">Las horas y cantidades se muestran con el reparto ya calculado.</p>
            </div>
          </div>

          {workerCount ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Trabajador</th>
                    <th>Rol</th>
                    <th>Horas</th>
                    <th>Peso</th>
                    <th>Cantidad</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyDetail.worker_rows.map((worker) => {
                    const participation = getParticipationByUserId(worker.user_id)

                    return (
                      <tr key={worker.user_id}>
                        <td>{worker.display_name}</td>
                        <td>{worker.role}</td>
                        <td>{worker.hours_worked} h</td>
                        <td>{worker.weight_at_time ?? '-'}</td>
                        <td>{worker.amount} EUR</td>
                        <td>
                          {participation ? (
                            <div className="stack gap-md">
                              <div className="actions-bar">
                                <button
                                  className="btn ghost"
                                  type="button"
                                  onClick={() => handleStartEditHours(participation)}
                                  disabled={isSubmittingAction}
                                >
                                  {editingParticipationId === participation.id
                                    ? 'Cancelar edición'
                                    : 'Editar horas'}
                                </button>
                                <button
                                  className="btn ghost"
                                  type="button"
                                  onClick={() => handleStartDeleteParticipation(participation.id)}
                                  disabled={isSubmittingAction}
                                >
                                  {deletingParticipationId === participation.id
                                    ? 'Cancelar eliminación'
                                    : 'Eliminar'}
                                </button>
                              </div>

                              {editingParticipationId === participation.id ? (
                                <form
                                  className="panel-card stack gap-md"
                                  onSubmit={(event) => handleSubmitEditHours(event, participation)}
                                >
                                  <div className="panel-card-header">
                                    <div>
                                      <p className="eyebrow">Horas</p>
                                      <h4 className="section-title">Editar participación</h4>
                                    </div>
                                  </div>

                                  <div className="field">
                                    <label className="label" htmlFor={`edit-hours-${participation.id}`}>
                                      Horas de {worker.display_name}
                                    </label>
                                    <input
                                      id={`edit-hours-${participation.id}`}
                                      className="input"
                                      value={draftEditHours}
                                      onChange={(event) => setDraftEditHours(event.target.value)}
                                      disabled={isSubmittingAction}
                                    />
                                  </div>

                                  {dailyDetail.is_closed ? (
                                    <div className="field">
                                      <label
                                        className="label"
                                        htmlFor={`edit-reason-${participation.id}`}
                                      >
                                        Motivo del cambio
                                      </label>
                                      <input
                                        id={`edit-reason-${participation.id}`}
                                        className="input"
                                        value={draftEditReason}
                                        onChange={(event) => setDraftEditReason(event.target.value)}
                                        disabled={isSubmittingAction}
                                      />
                                    </div>
                                  ) : null}

                                  <div className="actions-bar">
                                    <button
                                      className="btn primary"
                                      type="submit"
                                      disabled={isSubmittingAction}
                                    >
                                      Guardar horas
                                    </button>
                                  </div>
                                </form>
                              ) : null}

                              {deletingParticipationId === participation.id ? (
                                <div className="panel-card stack gap-md">
                                  <div className="panel-card-header">
                                    <div>
                                      <p className="eyebrow">Eliminar</p>
                                      <h4 className="section-title">Quitar participación</h4>
                                    </div>
                                  </div>

                                  <p className="muted">
                                    Confirma si quieres eliminar a {worker.display_name} de este día.
                                  </p>

                                  {dailyDetail.is_closed ? (
                                    <div className="field">
                                      <label
                                        className="label"
                                        htmlFor={`delete-reason-${participation.id}`}
                                      >
                                        Motivo del cambio
                                      </label>
                                      <input
                                        id={`delete-reason-${participation.id}`}
                                        className="input"
                                        value={draftDeleteReason}
                                        onChange={(event) => setDraftDeleteReason(event.target.value)}
                                        disabled={isSubmittingAction}
                                      />
                                    </div>
                                  ) : null}

                                  <div className="actions-bar">
                                    <button
                                      className="btn primary"
                                      type="button"
                                      onClick={() => handleConfirmDeleteParticipation(participation)}
                                      disabled={isSubmittingAction}
                                    >
                                      Confirmar eliminación
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <span className="muted">Sin acciones</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <strong>No hay trabajadores cargados para este día.</strong>
              <p className="muted">Añade una participación para empezar a repartir el bote.</p>
            </div>
          )}
        </section>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Auditoría</p>
            <h3 className="section-title">Historial del día</h3>
            <p className="muted">Cada cambio queda reflejado con usuario, fecha y motivo.</p>
          </div>
        </div>

        {historyCount ? (
          <div className="history-list">
            {dailyDetail.history.map((entry) => (
              <article className="history-item" key={entry.id}>
                <div className="history-meta">
                  <strong>{entry.changed_by?.username ?? 'Sistema'}</strong>
                  <span>{new Date(entry.created_at).toLocaleString('es-ES')}</span>
                </div>
                <p>{entry.message}</p>
                {entry.reason ? <p className="history-reason">Motivo: {entry.reason}</p> : null}
                {entry.happened_after_closure ? (
                  <span className="status-badge">Posterior al cierre</span>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>Todavía no hay eventos en el historial.</strong>
            <p className="muted">Cuando se registren cambios, aparecerán aquí.</p>
          </div>
        )}
      </section>
    </section>
  )
}
