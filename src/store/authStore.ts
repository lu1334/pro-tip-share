import { create } from 'zustand'
import type { ApiUser } from '../types/api'
import { clearAuthTokens, fetchCurrentUser, getAccessToken } from '../services/auth'

interface AuthState {
  user: ApiUser | null
  isBootstrapping: boolean
  bootstrapSession: () => Promise<void>
  setAuthenticatedUser: (user: ApiUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isBootstrapping: true,

  bootstrapSession: async () => {
    const accessToken = getAccessToken()

    if (!accessToken) {
      set({ user: null, isBootstrapping: false })
      return
    }

    try {
      const currentUser = await fetchCurrentUser()
      set({ user: currentUser, isBootstrapping: false })
    } catch {
      clearAuthTokens()
      set({ user: null, isBootstrapping: false })
    }
  },

  setAuthenticatedUser: (user) => {
    set({ user })
  },

  logout: () => {
    clearAuthTokens()
    set({ user: null })
  },
}))
