import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAuthTokens,
  fetchWithAuth,
  getAccessToken,
  refreshAccessToken,
  saveAuthTokens,
  UnauthorizedError,
} from './auth'

describe('auth service', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value)
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key)
      }),
    })
    vi.stubGlobal('fetch', vi.fn())
    clearAuthTokens()
  })

  afterEach(() => {
    clearAuthTokens()
    vi.unstubAllGlobals()
  })

  it('renueva el access token cuando el backend responde 401', async () => {
    saveAuthTokens('expired-access', 'valid-refresh')

    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'token_not_valid' }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access: 'new-access' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      )

    const response = await fetchWithAuth('http://127.0.0.1:8000/protected/')

    expect(response.ok).toBe(true)
    expect(getAccessToken()).toBe('new-access')
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:8000/api/users/refresh/',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://127.0.0.1:8000/protected/',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )

    const retryHeaders = fetchMock.mock.calls[2]?.[1]
    expect(retryHeaders && retryHeaders.headers instanceof Headers).toBe(true)
    expect((retryHeaders?.headers as Headers).get('Authorization')).toBe(
      'Bearer new-access',
    )
  })

  it('limpia tokens y lanza UnauthorizedError si el refresh falla', async () => {
    saveAuthTokens('expired-access', 'bad-refresh')

    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'token_not_valid' }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'refresh_invalid' }), { status: 401 }),
      )

    await expect(fetchWithAuth('http://127.0.0.1:8000/protected/')).rejects.toBeInstanceOf(
      UnauthorizedError,
    )

    expect(getAccessToken()).toBeNull()
  })

  it('comparte la misma petición de refresh si hay varias llamadas simultáneas', async () => {
    saveAuthTokens('expired-access', 'valid-refresh')

    let resolveRefresh: ((value: Response) => void) | null = null
    const refreshResponsePromise = new Promise<Response>((resolve) => {
      resolveRefresh = resolve
    })

    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'token_not_valid' }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'token_not_valid' }), { status: 401 }),
      )
      .mockImplementationOnce(() => refreshResponsePromise)
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    const requestOne = fetchWithAuth('http://127.0.0.1:8000/protected/a')
    const requestTwo = fetchWithAuth('http://127.0.0.1:8000/protected/b')

    if (!resolveRefresh) {
      throw new Error('La promesa de refresh no se inicializó.')
    }

    const resolveRefreshFn: (value: Response) => void = resolveRefresh

    resolveRefreshFn(
      new Response(JSON.stringify({ access: 'shared-access' }), { status: 200 }),
    )

    await Promise.all([requestOne, requestTwo])

    expect(
      fetchMock.mock.calls.filter(
        ([url]) => url === 'http://127.0.0.1:8000/api/users/refresh/',
      ),
    ).toHaveLength(1)
  })

  it('refreshAccessToken falla si no existe refresh token', async () => {
    clearAuthTokens()

    await expect(refreshAccessToken()).rejects.toBeInstanceOf(UnauthorizedError)
  })
})
