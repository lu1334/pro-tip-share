import { Link } from 'react-router-dom'
import type { DailyDetailResponse } from '../../types/api'

type DailyDetailHeaderProps = {
  dailyDetail: DailyDetailResponse
}

export function DailyDetailHeader({ dailyDetail }: DailyDetailHeaderProps) {
  const workerCount = dailyDetail.worker_rows.length
  const historyCount = dailyDetail.history.length
  const statusLabel = dailyDetail.is_closed ? 'Cerrado' : 'Abierto'
  const statusDescription = dailyDetail.is_closed
    ? 'El día está bloqueado y cualquier cambio debe quedar trazado.'
    : 'El día sigue abierto y se puede ajustar antes del cierre.'

  return (
    <>
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
    </>
  )
}
