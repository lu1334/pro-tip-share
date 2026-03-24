import { Link } from 'react-router-dom'
import type { WeeklyGridResponse } from '../../types/api'

type WeeklyGridTableProps = {
  weeklyGrid: WeeklyGridResponse
}

export function WeeklyGridTable({ weeklyGrid }: WeeklyGridTableProps) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Comparativa</p>
          <h3 className="section-title">Reparto por trabajador y día</h3>
          <p className="muted">
            Cada columna representa un día; si existe detalle navegable, puedes entrar desde la
            propia cabecera o celda.
          </p>
        </div>
      </div>

      {weeklyGrid.days.length && weeklyGrid.workers.length ? (
        <div className="table-wrapper">
          <table className="table weekly-table">
            <thead>
              <tr>
                <th>Trabajador</th>
                {weeklyGrid.days.map((day) => (
                  <th key={day.date}>
                    {day.daily_tip_id ? (
                      <Link className="day-head" to={`/daily/${day.daily_tip_id}`}>
                        <span>{day.date}</span>
                        <strong>{day.total_amount} EUR</strong>
                        <small>{day.is_closed ? 'Cerrado' : 'Abierto'}</small>
                      </Link>
                    ) : (
                      <div className="day-head">
                        <span>{day.date}</span>
                        <strong>{day.total_amount} EUR</strong>
                        <small>{day.is_closed ? 'Cerrado' : 'Abierto'}</small>
                      </div>
                    )}
                  </th>
                ))}
                <th>Total semana</th>
              </tr>
            </thead>
            <tbody>
              {weeklyGrid.workers.map((worker) => (
                <tr key={worker.user_id}>
                  <td>
                    <div className="worker-cell">
                      <strong>{worker.display_name}</strong>
                      <span>{worker.role}</span>
                    </div>
                  </td>
                  {weeklyGrid.days.map((day) => {
                    const cell = worker.days[day.date]

                    return (
                      <td key={`${worker.user_id}-${day.date}`}>
                        {cell && cell.daily_tip_id ? (
                          <Link className="weekly-value" to={`/daily/${cell.daily_tip_id}`}>
                            <strong>{cell.amount} EUR</strong>
                            <span>{cell.hours_worked} h</span>
                          </Link>
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
      ) : (
        <div className="empty-state">
          <strong>No hay datos suficientes para construir la tabla semanal.</strong>
          <p className="muted">
            La tabla aparecerá cuando existan días y trabajadores en la respuesta semanal.
          </p>
        </div>
      )}
    </section>
  )
}
