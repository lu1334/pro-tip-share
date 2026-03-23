import { getApiBaseUrl } from './api'
import type { ApiUser, LoginResponse } from '../types/api'

const ACCESS_TOKEN_KEY = 'fairtip_access_token'
const REFRESH_TOKEN_KEY = 'fairtip_refresh_token'

export function saveAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
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

export async function fetchCurrentUser() {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error('No hay sesión activa.')
  }

  const response = await fetch(`${getApiBaseUrl()}/api/users/me/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

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
