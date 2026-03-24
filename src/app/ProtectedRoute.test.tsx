import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../store/authStore'

const navigateMock = vi.fn()

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div>redirect:{to}</div>,
  Outlet: () => <div>protected-content</div>,
  useLocation: () => ({
    pathname: '/dashboard/weekly',
  }),
}))

import { ProtectedRoute } from './ProtectedRoute'

describe('ProtectedRoute', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    useAuthStore.setState({
      user: null,
      isBootstrapping: false,
    })
  })

  it('redirige al login cuando no hay usuario autenticado', () => {
    render(<ProtectedRoute />)

    expect(screen.getByText('redirect:/login')).toBeInTheDocument()
  })

  it('muestra el contenido protegido cuando hay usuario autenticado', () => {
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'admin_test',
        first_name: 'Admin',
        last_name: 'Test',
        email: null,
        role: 'manager',
      },
      isBootstrapping: false,
    })

    render(<ProtectedRoute />)

    expect(screen.getByText('protected-content')).toBeInTheDocument()
  })
})
