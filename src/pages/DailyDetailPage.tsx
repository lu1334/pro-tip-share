import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchDailyDetail } from '../services/tips'
import type { DailyDetailResponse } from '../types/api'

export function DailyDetailPage() {
  const { dailyTipId } = useParams()
  const [dailyDetail, setDailyDetail] = useState<DailyDetailResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const parsedDailyTipId = Number(dailyTipId)

    if (!dailyTipId || Number.isNaN(parsedDailyTipId) || parsedDailyTipId <= 0) {
      setError('El identificador del día no es válido.')
      setIsLoading(false)
      return
    }

    let ignore = false

    async function loadDailyDetail() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchDailyDetail(parsedDailyTipId)
        if (!ignore) {
          setDailyDetail(response)
        }
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudo cargar el detalle del día.',
          )
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadDailyDetail()

    return () => {
      ignore = true
    }
  }, [dailyTipId])

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
          <button className="btn ghost" type="button">
            Editar bote
          </button>
          <button className="btn primary" type="button">
            Añadir trabajador
          </button>
          <button className="btn ghost" type="button">
            Cerrar día
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
              </tr>
            </thead>
            <tbody>
              {dailyDetail.worker_rows.map((worker) => (
                <tr key={worker.user_id}>
                  <td>{worker.display_name}</td>
                  <td>{worker.role}</td>
                  <td>{worker.hours_worked} h</td>
                  <td>{worker.weight_at_time ?? '-'}</td>
                  <td>{worker.amount} EUR</td>
                </tr>
              ))}
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
