import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UnauthorizedError } from '../services/auth'
import { useAuthStore } from '../store/authStore'
import type { WeeklyGridResponse } from '../types/api'

const navigateMock = vi.fn()
const fetchWeeklyGridMock = vi.fn()
const logoutMock = vi.fn()

vi.mock('react-router-dom', () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode
    to: string
    className?: string
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
  useLocation: () => ({
    pathname: '/dashboard/weekly',
  }),
}))

vi.mock('../services/tips', () => ({
  fetchWeeklyGrid: (...args: unknown[]) => fetchWeeklyGridMock(...args),
}))

import { WeeklyGridPage } from './WeeklyGridPage'

const weeklyGridFixture: WeeklyGridResponse = {
  start_date: '2026-03-16',
  end_date: '2026-03-22',
  week_total: '120.00',
  business_settings: {
    default_distribution_method: 'weight_hours',
  },
  days: [
    {
      daily_tip_id: 12,
      date: '2026-03-16',
      total_amount: '120.00',
      distribution_method: 'weight_hours',
      is_closed: true,
      distributed_total: '120.00',
    },
  ],
  workers: [
    {
      user_id: 1,
      username: 'ana',
      first_name: 'Ana',
      last_name: 'Lopez',
      display_name: 'Ana Lopez',
      role: 'waiter',
      weekly_total: '68.00',
      days: {
        '2026-03-16': {
          daily_tip_id: 12,
          hours_worked: '8.00',
          amount: '68.00',
          role_at_time: 'waiter',
          weight_at_time: '1.00',
        },
      },
    },
  ],
}

const emptyWeeklyGridFixture: WeeklyGridResponse = {
  ...weeklyGridFixture,
  days: [],
  workers: [],
}

describe('WeeklyGridPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    fetchWeeklyGridMock.mockReset()
    logoutMock.mockReset()
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
      logout: logoutMock,
    })
  })

  it('muestra estado de carga inicial', () => {
    fetchWeeklyGridMock.mockImplementation(() => new Promise(() => {}))

    render(<WeeklyGridPage />)

    expect(screen.getByText('Cargando vista semanal...')).toBeInTheDocument()
  })

  it('muestra error si la carga falla', async () => {
    fetchWeeklyGridMock.mockRejectedValue(new Error('Fallo al cargar semana'))

    render(<WeeklyGridPage />)

    expect(await screen.findByText('Fallo al cargar semana')).toBeInTheDocument()
  })

  it('redirige al login si la API devuelve UnauthorizedError', async () => {
    fetchWeeklyGridMock.mockRejectedValue(new UnauthorizedError())

    render(<WeeklyGridPage />)

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled()
      expect(navigateMock).toHaveBeenCalledWith('/login', {
        replace: true,
        state: { from: '/dashboard/weekly' },
      })
    })
  })

  it('pinta los datos de la semana cuando la carga funciona', async () => {
    fetchWeeklyGridMock.mockResolvedValue(weeklyGridFixture)

    render(<WeeklyGridPage />)

    expect(await screen.findByText('Ana Lopez')).toBeInTheDocument()
    expect(screen.getByText('weight_hours')).toBeInTheDocument()
    expect(screen.getByText('2026-03-16 - 2026-03-22')).toBeInTheDocument()
    expect(screen.getByText('Días con detalle')).toBeInTheDocument()
    expect(screen.getByText('Días cerrados')).toBeInTheDocument()
    expect(screen.getByText('Trabajadores')).toBeInTheDocument()
    expect(screen.getAllByText('68.00 EUR')).toHaveLength(2)
    expect(screen.getByText('8.00 h')).toBeInTheDocument()
  })

  it('muestra estado vacío cuando faltan días y trabajadores', async () => {
    fetchWeeklyGridMock.mockResolvedValue(emptyWeeklyGridFixture)

    render(<WeeklyGridPage />)

    expect(
      await screen.findByText('No hay datos suficientes para construir la tabla semanal.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('La tabla aparecerá cuando existan días y trabajadores en la respuesta semanal.'),
    ).toBeInTheDocument()
  })
})
