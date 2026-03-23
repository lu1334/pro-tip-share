import { getApiBaseUrl } from './api'
import { getAccessToken } from './auth'
import type { DailyDetailResponse, WeeklyGridResponse } from '../types/api'

export async function fetchWeeklyGrid(startDate?: string) {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error('No hay sesión activa.')
  }

  const query = startDate ? `?start_date=${encodeURIComponent(startDate)}` : ''
  const response = await fetch(`${getApiBaseUrl()}/tips/api/daily-tips/weekly-grid/${query}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  let data: WeeklyGridResponse | { detail?: string }
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    const errorDetail =
      'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : 'No se pudo cargar la vista semanal.'
    throw new Error(errorDetail)
  }

  return data as WeeklyGridResponse
}

export async function fetchDailyDetail(dailyTipId: number) {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error('No hay sesión activa.')
  }

  const response = await fetch(`${getApiBaseUrl()}/tips/api/daily-tips/${dailyTipId}/detail/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  let data: DailyDetailResponse | { detail?: string }
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    const errorDetail =
      'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : 'No se pudo cargar el detalle del día.'
    throw new Error(errorDetail)
  }

  return data as DailyDetailResponse
}
