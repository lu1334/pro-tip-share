import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../store/authStore'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    state: null,
  }),
}))

vi.mock('../services/auth', async () => {
  const actual = await vi.importActual<typeof import('../services/auth')>('../services/auth')
  return {
    ...actual,
    getAccessToken: vi.fn(() => null),
    loginUser: vi.fn(),
    saveAuthTokens: vi.fn(),
  }
})

import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isBootstrapping: false,
    })
  })

  it('muestra error si se envia el formulario vacio', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(
      screen.getByText('Usuario y contraseña son obligatorios.'),
    ).toBeInTheDocument()
  })
})
