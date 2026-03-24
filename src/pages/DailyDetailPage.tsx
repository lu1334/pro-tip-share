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

export function DailyDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const { dailyTipId } = useParams()
  const [dailyDetail, setDailyDetail] = useState<DailyDetailResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
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

  const loadDailyDetail = useCallback(async () => {
    if (!isMountedRef.current) {
      return false
    }

    const parsedDailyTipId = Number(dailyTipId)

    if (!dailyTipId || Number.isNaN(parsedDailyTipId) || parsedDailyTipId <= 0) {
      if (isMountedRef.current) {
        setError('El identificador del día no es válido.')
        setIsLoading(false)
      }
      return false
    }

    if (isMountedRef.current) {
      setIsLoading(true)
      setError(null)
    }

    try {
      const response = await fetchDailyDetail(parsedDailyTipId)
      if (isMountedRef.current) {
        setDailyDetail(response)
      }
      return true
    } catch (loadError) {
      if (loadError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return false
      }

      if (isMountedRef.current) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar el detalle del día.',
        )
      }
      return false
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [dailyTipId, location.pathname, logout, navigate])

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
  }, [dailyDetail])

  async function handleSubmitTotalAmount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!dailyDetail) {
      return
    }

    const trimmedAmount = draftTotalAmount.trim()
    if (!trimmedAmount) {
      setError('El bote total no puede quedar vacío.')
      return
    }

    const parsedAmount = Number(trimmedAmount.replace(',', '.'))
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('El bote total debe ser un número válido mayor que 0.')
      return
    }

    const normalizedAmount = parsedAmount.toFixed(2)
    const changeReason = dailyDetail.is_closed ? draftTotalAmountReason.trim() : ''

    try {
      setIsSubmittingAction(true)
      setError(null)
      await updateDailyTip(dailyDetail.id, {
        total_amount: normalizedAmount,
        change_reason: changeReason,
      })
      const didReload = await loadDailyDetail()
      if (didReload && isMountedRef.current) {
        setIsEditingTotalAmount(false)
      }
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return
      }

      setError(
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
      setError(null)

      if (dailyDetail.is_closed) {
        await reopenDailyTip(dailyDetail.id)
      } else {
        await closeDailyTip(dailyDetail.id)
      }

      const didReload = await loadDailyDetail()
      if (didReload && isMountedRef.current) {
        setIsConfirmingClosedState(false)
      }
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return
      }

      setError(
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

  function getParticipationByUserId(userId: number) {
    return dailyDetail?.participations.find((participation) => participation.user.id === userId)
  }

  async function handleOpenAddWorkerForm() {
    if (!dailyDetail) {
      return
    }

    try {
      setIsSubmittingAction(true)
      setError(null)

      const availableWorkers = await fetchAvailableWorkers(dailyDetail.id)

      if (!availableWorkers.length) {
        setError('No hay trabajadores disponibles para añadir a este día.')
        setIsSubmittingAction(false)
        return
      }

      if (isMountedRef.current) {
        setAvailableWorkers(availableWorkers)
        setSelectedWorkerId(String(availableWorkers[0]?.id ?? ''))
        setDraftWorkerHours('0.00')
        setDraftWorkerReason('')
        setIsAddingWorker(true)
      }
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return
      }

      setError(
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
      setError('Debes elegir un trabajador válido de la lista.')
      return
    }

    const parsedHours = Number(draftWorkerHours.trim().replace(',', '.'))
    if (Number.isNaN(parsedHours) || parsedHours < 0) {
      setError('Las horas deben ser un número válido igual o mayor que 0.')
      return
    }

    try {
      setIsSubmittingAction(true)
      setError(null)
      await createDailyParticipation({
        daily_tip: dailyDetail.id,
        user_id: selectedWorker.id,
        hours_worked: parsedHours.toFixed(2),
        change_reason: dailyDetail.is_closed ? draftWorkerReason.trim() : '',
      })
      const didReload = await loadDailyDetail()
      if (didReload && isMountedRef.current) {
        setIsAddingWorker(false)
      }
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return
      }

      setError(
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

    setError(null)
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
      setError('Las horas deben ser un número válido igual o mayor que 0.')
      return
    }

    try {
      setIsSubmittingAction(true)
      setError(null)
      await updateDailyParticipation(participation.id, {
        hours_worked: parsedHours.toFixed(2),
        change_reason: dailyDetail?.is_closed ? draftEditReason.trim() : '',
      })
      const didReload = await loadDailyDetail()
      if (didReload && isMountedRef.current) {
        setEditingParticipationId(null)
      }
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return
      }

      setError(
        actionError instanceof Error
          ? actionError.message
          : 'No se pudieron actualizar las horas.',
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

    setError(null)
    setEditingParticipationId(null)
    setDeletingParticipationId(participationId)
    setDraftDeleteReason('')
  }

  async function handleConfirmDeleteParticipation(participation: DailyParticipation) {
    try {
      setIsSubmittingAction(true)
      setError(null)
      await deleteDailyParticipation(
        participation.id,
        dailyDetail?.is_closed ? draftDeleteReason.trim() : '',
      )
      const didReload = await loadDailyDetail()
      if (didReload && isMountedRef.current) {
        setDeletingParticipationId(null)
      }
    } catch (actionError) {
      if (actionError instanceof UnauthorizedError) {
        logout()
        navigate('/login', { replace: true, state: { from: location.pathname } })
        return
      }

      setError(
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

  if (error) {
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
          <p className="muted">{error}</p>
        </section>
      </section>
    )
  }

  if (!dailyDetail) {
    return null
  }

  return (
    <section className="page">
      <header className="page-header-block">
        <div>
          <p className="eyebrow">Pantalla 2</p>
          <h2 className="page-title">Detalle del día {dailyTipId}</h2>
          <p className="muted">
            Esta página ya consume <code>daily-detail</code> y muestra el reparto real, junto con
            el historial del día.
          </p>
        </div>

        <Link className="btn ghost" to="/dashboard/weekly">
          Volver a semana
        </Link>
      </header>

      <section className="card detail-hero">
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
            <span className="stat-label">Estado</span>
            <strong>{dailyDetail.is_closed ? 'Cerrado' : 'Abierto'}</strong>
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
              setError(null)
              setIsEditingTotalAmount((current) => !current)
              setIsConfirmingClosedState(false)
            }}
            disabled={isSubmittingAction}
          >
            {isEditingTotalAmount ? 'Cancelar edición' : 'Editar bote'}
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              setError(null)
              setIsConfirmingClosedState((current) => !current)
              setIsEditingTotalAmount(false)
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

        {isEditingTotalAmount ? (
          <form className="stack gap-md" onSubmit={handleSubmitTotalAmount}>
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
                  setError(null)
                }}
                disabled={isSubmittingAction}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        {isConfirmingClosedState ? (
          <div className="stack gap-md">
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
                onClick={() => setIsConfirmingClosedState(false)}
                disabled={isSubmittingAction}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        {isAddingWorker ? (
          <form className="stack gap-md" onSubmit={handleSubmitAddWorker}>
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
                  setError(null)
                }}
                disabled={isSubmittingAction}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Reparto</p>
            <h3 className="section-title">Trabajadores del día</h3>
          </div>
        </div>

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
                              className="stack gap-md"
                              onSubmit={(event) => handleSubmitEditHours(event, participation)}
                            >
                              <div className="field">
                                <label
                                  className="label"
                                  htmlFor={`edit-hours-${participation.id}`}
                                >
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
                            <div className="stack gap-md">
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
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Auditoría</p>
            <h3 className="section-title">Historial del día</h3>
          </div>
        </div>

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
      </section>
    </section>
  )
}
