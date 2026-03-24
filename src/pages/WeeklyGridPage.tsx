import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { WeeklyGridHeader } from '../components/weekly-grid/WeeklyGridHeader'
import { WeeklyGridTable } from '../components/weekly-grid/WeeklyGridTable'
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

  return (
    <section className="page">
      <WeeklyGridHeader weeklyGrid={weeklyGrid} />
      <WeeklyGridTable weeklyGrid={weeklyGrid} />
    </section>
  )
}
