import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UnauthorizedError } from '../services/auth'
import { fetchWeeklyGrid } from '../services/tips'
import { useAuthStore } from '../store/authStore'
import type { WeeklyGridResponse } from '../types/api'

type UseWeeklyGridPageResult = {
  weeklyGrid: WeeklyGridResponse | null
  error: string | null
  isLoading: boolean
}

export function useWeeklyGridPage(): UseWeeklyGridPageResult {
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
  }, [location.pathname, logout, navigate])

  return {
    weeklyGrid,
    error,
    isLoading,
  }
}
