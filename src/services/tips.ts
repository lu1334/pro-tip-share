import { getApiBaseUrl } from './api'
import { clearAuthTokens, getAccessToken, UnauthorizedError } from './auth'
import type {
  AvailableWorker,
  DailyDetailResponse,
  DailyParticipation,
  WeeklyGridResponse,
} from '../types/api'

function getAuthorizedHeaders() {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error('No hay sesión activa.')
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

async function parseResponseData<T>(response: Response) {
  let data: T | { detail?: string }
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (response.status === 401) {
    clearAuthTokens()
    throw new UnauthorizedError()
  }

  return data
}

export async function fetchWeeklyGrid(startDate?: string) {
  const query = startDate ? `?start_date=${encodeURIComponent(startDate)}` : ''
  const response = await fetch(`${getApiBaseUrl()}/tips/api/daily-tips/weekly-grid/${query}`, {
    headers: getAuthorizedHeaders(),
  })

  const data = await parseResponseData<WeeklyGridResponse>(response)

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
  const response = await fetch(`${getApiBaseUrl()}/tips/api/daily-tips/${dailyTipId}/detail/`, {
    headers: getAuthorizedHeaders(),
  })

  const data = await parseResponseData<DailyDetailResponse>(response)

  if (!response.ok) {
    const errorDetail =
      'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : 'No se pudo cargar el detalle del día.'
    throw new Error(errorDetail)
  }

  return data as DailyDetailResponse
}

export async function updateDailyTip(
  dailyTipId: number,
  payload: { total_amount: string; change_reason?: string },
) {
  const response = await fetch(`${getApiBaseUrl()}/tips/api/daily-tips/${dailyTipId}/`, {
    method: 'PATCH',
    headers: {
      ...getAuthorizedHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await parseResponseData<DailyDetailResponse>(response)

  if (!response.ok) {
    const errorDetail =
      'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : 'No se pudo actualizar el bote del día.'
    throw new Error(errorDetail)
  }

  return data
}

export async function closeDailyTip(dailyTipId: number) {
  const response = await fetch(`${getApiBaseUrl()}/tips/api/daily-tips/${dailyTipId}/close/`, {
    method: 'POST',
    headers: getAuthorizedHeaders(),
  })

  const data = await parseResponseData<DailyDetailResponse>(response)

  if (!response.ok) {
    const errorDetail =
      'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : 'No se pudo cerrar el día.'
    throw new Error(errorDetail)
  }

  return data
}

export async function reopenDailyTip(dailyTipId: number) {
  const response = await fetch(`${getApiBaseUrl()}/tips/api/daily-tips/${dailyTipId}/reopen/`, {
    method: 'POST',
    headers: getAuthorizedHeaders(),
  })

  const data = await parseResponseData<DailyDetailResponse>(response)

  if (!response.ok) {
    const errorDetail =
      'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : 'No se pudo reabrir el día.'
    throw new Error(errorDetail)
  }

  return data
}

export async function fetchAvailableWorkers(dailyTipId: number) {
  const response = await fetch(
    `${getApiBaseUrl()}/tips/api/daily-tips/${dailyTipId}/available-workers/`,
    {
      headers: getAuthorizedHeaders(),
    },
  )

  const data = await parseResponseData<AvailableWorker[]>(response)

  if (!response.ok) {
    const errorDetail =
      'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : 'No se pudo cargar la lista de trabajadores disponibles.'
    throw new Error(errorDetail)
  }

  return data as AvailableWorker[]
}

export async function createDailyParticipation(payload: {
  daily_tip: number
  user_id: number
  hours_worked: string
  change_reason?: string
}) {
  const response = await fetch(`${getApiBaseUrl()}/tips/api/daily-participations/`, {
    method: 'POST',
    headers: {
      ...getAuthorizedHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await parseResponseData<DailyParticipation>(response)

  if (!response.ok) {
    const errorDetail =
      'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : 'No se pudo añadir el trabajador al día.'
    throw new Error(errorDetail)
  }

  return data as DailyParticipation
}

export async function updateDailyParticipation(
  participationId: number,
  payload: { hours_worked: string; change_reason?: string },
) {
  const response = await fetch(
    `${getApiBaseUrl()}/tips/api/daily-participations/${participationId}/`,
    {
      method: 'PATCH',
      headers: {
        ...getAuthorizedHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )

  const data = await parseResponseData<DailyParticipation>(response)

  if (!response.ok) {
    const errorDetail =
      'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : 'No se pudieron actualizar las horas.'
    throw new Error(errorDetail)
  }

  return data as DailyParticipation
}

export async function deleteDailyParticipation(participationId: number, changeReason?: string) {
  const query = changeReason ? `?change_reason=${encodeURIComponent(changeReason)}` : ''
  const response = await fetch(
    `${getApiBaseUrl()}/tips/api/daily-participations/${participationId}/${query}`,
    {
      method: 'DELETE',
      headers: getAuthorizedHeaders(),
    },
  )

  if (response.status === 401) {
    clearAuthTokens()
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    let data: { detail?: string }
    try {
      data = await response.json()
    } catch {
      data = {}
    }

    throw new Error(data.detail ?? 'No se pudo eliminar la participación.')
  }
}
