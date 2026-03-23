import type { WeeklyGridResponse } from '../types/api'

const previewGrid: WeeklyGridResponse = {
  start_date: '2026-03-16',
  end_date: '2026-03-22',
  week_total: '860.00',
  business_settings: {
    default_distribution_method: 'weight_hours',
  },
  days: [
    {
      daily_tip_id: 1,
      date: '2026-03-16',
      total_amount: '120.00',
      distribution_method: 'weight_hours',
      is_closed: true,
      distributed_total: '120.00',
    },
    {
      daily_tip_id: 2,
      date: '2026-03-17',
      total_amount: '95.00',
      distribution_method: 'hours',
      is_closed: false,
      distributed_total: '95.00',
    },
  ],
  workers: [
    {
      user_id: 1,
      username: 'ana',
      first_name: 'Ana',
      last_name: 'Lopez',
      display_name: 'Ana Lopez',
      role: 'waiter',
      weekly_total: '235.00',
      days: {
        '2026-03-16': {
          daily_tip_id: 1,
          hours_worked: '8.00',
          amount: '68.00',
          role_at_time: 'waiter',
          weight_at_time: '1.00',
        },
        '2026-03-17': {
          daily_tip_id: 2,
          hours_worked: '5.00',
          amount: '42.00',
          role_at_time: 'waiter',
          weight_at_time: '1.00',
        },
      },
    },
    {
      user_id: 2,
      username: 'luis',
      first_name: 'Luis',
      last_name: 'Soto',
      display_name: 'Luis Soto',
      role: 'kitchen',
      weekly_total: '70.00',
      days: {
        '2026-03-16': {
          daily_tip_id: 1,
          hours_worked: '4.00',
          amount: '27.00',
          role_at_time: 'kitchen',
          weight_at_time: '0.80',
        },
        '2026-03-17': {
          daily_tip_id: 2,
          hours_worked: '4.00',
          amount: '20.00',
          role_at_time: 'kitchen',
          weight_at_time: '0.80',
        },
      },
    },
  ],
}

export function WeeklyGridPage() {
  return (
    <section className="page">
      <header className="page-header-block">
        <div>
          <p className="eyebrow">Pantalla 1</p>
          <h2 className="page-title">Vista semanal</h2>
          <p className="muted">
            Esta página ya está preparada para consumir <code>weekly-grid</code> y pintar la grilla
            comparativa.
          </p>
        </div>

        <div className="summary-pill">
          <span>Método actual</span>
          <strong>{previewGrid.business_settings.default_distribution_method}</strong>
        </div>
      </header>

      <section className="card">
        <div className="stats-row">
          <div className="stat">
            <span className="stat-label">Semana</span>
            <strong>
              {previewGrid.start_date} - {previewGrid.end_date}
            </strong>
          </div>
          <div className="stat">
            <span className="stat-label">Total semanal</span>
            <strong>{previewGrid.week_total} EUR</strong>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="table-wrapper">
          <table className="table weekly-table">
            <thead>
              <tr>
                <th>Trabajador</th>
                {previewGrid.days.map((day) => (
                  <th key={day.date}>
                    <div className="day-head">
                      <span>{day.date}</span>
                      <strong>{day.total_amount} EUR</strong>
                      <small>{day.is_closed ? 'Cerrado' : 'Abierto'}</small>
                    </div>
                  </th>
                ))}
                <th>Total semana</th>
              </tr>
            </thead>
            <tbody>
              {previewGrid.workers.map((worker) => (
                <tr key={worker.user_id}>
                  <td>
                    <div className="worker-cell">
                      <strong>{worker.display_name}</strong>
                      <span>{worker.role}</span>
                    </div>
                  </td>
                  {previewGrid.days.map((day) => {
                    const cell = worker.days[day.date]

                    return (
                      <td key={`${worker.user_id}-${day.date}`}>
                        {cell ? (
                          <div className="weekly-value">
                            <strong>{cell.amount} EUR</strong>
                            <span>{cell.hours_worked} h</span>
                          </div>
                        ) : (
                          <div className="weekly-value weekly-value--empty">
                            <strong>0.00 EUR</strong>
                            <span>0.00 h</span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td>
                    <strong>{worker.weekly_total} EUR</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
