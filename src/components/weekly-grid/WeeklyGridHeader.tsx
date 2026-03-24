import type { WeeklyGridResponse } from '../../types/api'

type WeeklyGridHeaderProps = {
  weeklyGrid: WeeklyGridResponse
}

export function WeeklyGridHeader({ weeklyGrid }: WeeklyGridHeaderProps) {
  const closedDaysCount = weeklyGrid.days.filter((day) => day.is_closed).length
  const linkedDaysCount = weeklyGrid.days.filter((day) => day.daily_tip_id).length
  const workerCount = weeklyGrid.workers.length

  return (
    <>
      <header className="page-header-block">
        <div>
          <p className="eyebrow">Pantalla 1</p>
          <h2 className="page-title">Vista semanal</h2>
          <p className="muted">
            Revisa la semana completa, detecta cierres y entra al detalle de cada día desde una
            sola tabla.
          </p>
        </div>

        <div className="summary-pill">
          <span>Método actual</span>
          <strong>{weeklyGrid.business_settings.default_distribution_method}</strong>
        </div>
      </header>

      <section className="card weekly-overview">
        <div className="stats-row">
          <div className="stat">
            <span className="stat-label">Semana</span>
            <strong>
              {weeklyGrid.start_date} - {weeklyGrid.end_date}
            </strong>
          </div>
          <div className="stat">
            <span className="stat-label">Total semanal</span>
            <strong>{weeklyGrid.week_total} EUR</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Días con detalle</span>
            <strong>{linkedDaysCount}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Días cerrados</span>
            <strong>{closedDaysCount}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Trabajadores</span>
            <strong>{workerCount}</strong>
          </div>
        </div>
      </section>
    </>
  )
}
