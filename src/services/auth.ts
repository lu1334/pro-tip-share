import { getApiBaseUrl } from './api'
import type { ApiUser, LoginResponse, RefreshTokenResponse } from '../types/api'

const ACCESS_TOKEN_KEY = 'fairtip_access_token'
const REFRESH_TOKEN_KEY = 'fairtip_refresh_token'

export class UnauthorizedError extends Error {
  constructor(message = 'La sesión ha expirado. Inicia sesión de nuevo.') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export function saveAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function saveAccessToken(accessToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

let refreshPromise: Promise<string> | null = null

async function performRefreshAccessToken() {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    clearAuthTokens()
    throw new UnauthorizedError()
  }

  const response = await fetch(`${getApiBaseUrl()}/api/users/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  })

  let data: RefreshTokenResponse | { detail?: string }
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok || !('access' in data) || typeof data.access !== 'string') {
    clearAuthTokens()
    throw new UnauthorizedError()
  }

  saveAccessToken(data.access)

  if ('refresh' in data && typeof data.refresh === 'string') {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh)
  }

  return data.access
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performRefreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export async function fetchWithAuth(
  input: string,
  init: RequestInit = {},
  retryOnUnauthorized = true,
) {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new UnauthorizedError('No hay sesión activa.')
  }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(input, {
    ...init,
    headers,
  })

  if (response.status !== 401) {
    return response
  }

  if (!retryOnUnauthorized) {
    clearAuthTokens()
    throw new UnauthorizedError()
  }

  const refreshedAccessToken = await refreshAccessToken()
  const retryHeaders = new Headers(init.headers)
  retryHeaders.set('Authorization', `Bearer ${refreshedAccessToken}`)

  const retryResponse = await fetch(input, {
    ...init,
    headers: retryHeaders,
  })

  if (retryResponse.status === 401) {
    clearAuthTokens()
    throw new UnauthorizedError()
  }

  return retryResponse
}

export async function fetchCurrentUser() {
  const response = await fetchWithAuth(`${getApiBaseUrl()}/api/users/me/`)

  let data: ApiUser | { detail?: string }
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    const errorDetail =
      'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : 'No se pudo recuperar la sesión.'
    throw new Error(errorDetail)
  }

  return data as ApiUser
}

export async function loginUser(username: string, password: string) {
  const response = await fetch(`${getApiBaseUrl()}/api/users/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  let data: LoginResponse | { detail?: string }
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    const errorDetail =
      'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : 'No se pudo iniciar sesión.'
    throw new Error(errorDetail)
  }

  return data as LoginResponse
}
