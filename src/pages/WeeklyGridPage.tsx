import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UnauthorizedError } from '../services/auth'
import { fetchWeeklyGrid } from '../services/tips'
import { useAuthStore } from '../store/authStore'
import type { WeeklyGridResponse } from '../types/api'

export function WeeklyGridPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const [weeklyGrid, setWeeklyGrid] = useState<WeeklyGridResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadWeeklyGrid() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchWeeklyGrid()
        if (!ignore) {
          setWeeklyGrid(response)
        }
      } catch (loadError) {
        if (loadError instanceof UnauthorizedError) {
          logout()
          navigate('/login', { replace: true, state: { from: location.pathname } })
          return
        }

        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudo cargar la vista semanal.',
          )
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadWeeklyGrid()

    return () => {
      ignore = true
    }
  }, [])

  if (isLoading) {
    return (
      <section className="page">
        <header className="page-header-block">
          <div>
            <p className="eyebrow">Pantalla 1</p>
            <h2 className="page-title">Vista semanal</h2>
          </div>
        </header>

        <section className="card">
          <p className="muted">Cargando vista semanal...</p>
        </section>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <header className="page-header-block">
          <div>
            <p className="eyebrow">Pantalla 1</p>
            <h2 className="page-title">Vista semanal</h2>
          </div>
        </header>

        <section className="card">
          <p className="muted">{error}</p>
        </section>
      </section>
    )
  }

  if (!weeklyGrid) {
    return null
  }

  const closedDaysCount = weeklyGrid.days.filter((day) => day.is_closed).length
  const linkedDaysCount = weeklyGrid.days.filter((day) => day.daily_tip_id).length
  const workerCount = weeklyGrid.workers.length

  return (
    <section className="page">
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
    </section>
  )
}
