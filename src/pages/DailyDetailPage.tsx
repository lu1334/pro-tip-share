import { useCallback, useEffect, useRef, useState } from 'react'
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

  async function handleEditTotalAmount() {
    if (!dailyDetail) {
      return
    }

    const nextAmount = window.prompt('Nuevo bote total del día', dailyDetail.total_amount)
    if (nextAmount === null) {
      return
    }

    const trimmedAmount = nextAmount.trim()
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
    const changeReason = dailyDetail.is_closed
      ? (window.prompt('Motivo del cambio (opcional)') ?? '').trim()
      : ''

    try {
      setIsSubmittingAction(true)
      setError(null)
      await updateDailyTip(dailyDetail.id, {
        total_amount: normalizedAmount,
        change_reason: changeReason,
      })
      await loadDailyDetail()
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

  async function handleToggleClosedState() {
    if (!dailyDetail) {
      return
    }

    const shouldProceed = window.confirm(
      dailyDetail.is_closed
        ? '¿Quieres reabrir este día?'
        : '¿Quieres cerrar este día?',
    )

    if (!shouldProceed) {
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

      await loadDailyDetail()
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

  function requestChangeReasonIfClosed() {
    if (!dailyDetail?.is_closed) {
      return ''
    }

    return (window.prompt('Motivo del cambio (opcional)') ?? '').trim()
  }

  async function handleAddWorker() {
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

      const workersMessage = availableWorkers
        .map(
          (worker: AvailableWorker) =>
            `${worker.id} - ${worker.display_name} (${worker.role})`,
        )
        .join('\n')

      const workerIdInput = window.prompt(
        `Trabajadores disponibles:\n${workersMessage}\n\nEscribe el ID del trabajador a añadir`,
      )

      if (workerIdInput === null) {
        return
      }

      const selectedWorkerId = Number(workerIdInput.trim())
      const selectedWorker = availableWorkers.find((worker) => worker.id === selectedWorkerId)

      if (!selectedWorker) {
        setError('Debes elegir un trabajador válido de la lista.')
        return
      }

      const hoursInput = window.prompt(
        `Horas trabajadas por ${selectedWorker.display_name}`,
        '0.00',
      )

      if (hoursInput === null) {
        return
      }

      const parsedHours = Number(hoursInput.trim().replace(',', '.'))
      if (Number.isNaN(parsedHours) || parsedHours < 0) {
        setError('Las horas deben ser un número válido igual o mayor que 0.')
        return
      }

      await createDailyParticipation({
        daily_tip: dailyDetail.id,
        user_id: selectedWorker.id,
        hours_worked: parsedHours.toFixed(2),
        change_reason: requestChangeReasonIfClosed(),
      })

      await loadDailyDetail()
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

  async function handleEditHours(workerName: string, participation: DailyParticipation) {
    const nextHours = window.prompt(
      `Nuevas horas para ${workerName}`,
      participation.hours_worked,
    )

    if (nextHours === null) {
      return
    }

    const parsedHours = Number(nextHours.trim().replace(',', '.'))
    if (Number.isNaN(parsedHours) || parsedHours < 0) {
      setError('Las horas deben ser un número válido igual o mayor que 0.')
      return
    }

    try {
      setIsSubmittingAction(true)
      setError(null)
      await updateDailyParticipation(participation.id, {
        hours_worked: parsedHours.toFixed(2),
        change_reason: requestChangeReasonIfClosed(),
      })
      await loadDailyDetail()
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

  async function handleDeleteParticipation(workerName: string, participation: DailyParticipation) {
    const shouldProceed = window.confirm(`¿Quieres eliminar a ${workerName} de este día?`)

    if (!shouldProceed) {
      return
    }

    try {
      setIsSubmittingAction(true)
      setError(null)
      await deleteDailyParticipation(participation.id, requestChangeReasonIfClosed())
      await loadDailyDetail()
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
            onClick={handleAddWorker}
            disabled={isSubmittingAction}
          >
            Añadir trabajador
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={handleEditTotalAmount}
            disabled={isSubmittingAction}
          >
            Editar bote
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={handleToggleClosedState}
            disabled={isSubmittingAction}
          >
            {dailyDetail.is_closed ? 'Reabrir día' : 'Cerrar día'}
          </button>
        </div>
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
                        <div className="actions-bar">
                          <button
                            className="btn ghost"
                            type="button"
                            onClick={() => handleEditHours(worker.display_name, participation)}
                            disabled={isSubmittingAction}
                          >
                            Editar horas
                          </button>
                          <button
                            className="btn ghost"
                            type="button"
                            onClick={() =>
                              handleDeleteParticipation(worker.display_name, participation)
                            }
                            disabled={isSubmittingAction}
                          >
                            Eliminar
                          </button>
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
