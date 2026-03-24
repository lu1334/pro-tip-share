import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UnauthorizedError } from '../services/auth'
import { useAuthStore } from '../store/authStore'
import type { DailyDetailResponse } from '../types/api'

const navigateMock = vi.fn()
const fetchDailyDetailMock = vi.fn()
const logoutMock = vi.fn()
const updateDailyTipMock = vi.fn()
const closeDailyTipMock = vi.fn()
const reopenDailyTipMock = vi.fn()
const fetchAvailableWorkersMock = vi.fn()
const createDailyParticipationMock = vi.fn()
const updateDailyParticipationMock = vi.fn()
const deleteDailyParticipationMock = vi.fn()

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
    pathname: '/daily/12',
  }),
  useParams: () => ({
    dailyTipId: '12',
  }),
}))

vi.mock('../services/tips', () => ({
  fetchDailyDetail: (...args: unknown[]) => fetchDailyDetailMock(...args),
  closeDailyTip: (...args: unknown[]) => closeDailyTipMock(...args),
  createDailyParticipation: (...args: unknown[]) => createDailyParticipationMock(...args),
  deleteDailyParticipation: (...args: unknown[]) => deleteDailyParticipationMock(...args),
  fetchAvailableWorkers: (...args: unknown[]) => fetchAvailableWorkersMock(...args),
  reopenDailyTip: (...args: unknown[]) => reopenDailyTipMock(...args),
  updateDailyParticipation: (...args: unknown[]) => updateDailyParticipationMock(...args),
  updateDailyTip: (...args: unknown[]) => updateDailyTipMock(...args),
}))

import { DailyDetailPage } from './DailyDetailPage'

const dailyDetailFixture: DailyDetailResponse = {
  id: 12,
  date: '2026-03-17',
  total_amount: '100.00',
  distribution_method: 'hours',
  created_by: {
    id: 1,
    username: 'admin_test',
    first_name: 'Admin',
    last_name: 'Test',
    email: null,
    role: 'manager',
  },
  created_at: '2026-03-17T19:00:00Z',
  is_closed: false,
  closed_at: null,
  closed_by: null,
  participations: [
    {
      id: 30,
      daily_tip: 12,
      user: {
        id: 2,
        username: 'ana',
        first_name: 'Ana',
        last_name: 'Lopez',
        email: null,
        role: 'waiter',
      },
      hours_worked: '8.00',
      role_at_time: 'waiter',
      weight_at_time: '1.00',
    },
  ],
  distributions: [],
  worker_rows: [
    {
      user_id: 2,
      username: 'ana',
      first_name: 'Ana',
      last_name: 'Lopez',
      display_name: 'Ana Lopez',
      role: 'waiter',
      hours_worked: '8.00',
      weight_at_time: '1.00',
      amount: '75.00',
    },
  ],
  history: [
    {
      id: 100,
      event_type: 'created',
      message: 'Se creó el bote diario con un total de 100.00 EUR.',
      reason: '',
      old_value: null,
      new_value: null,
      happened_after_closure: false,
      changed_by: {
        id: 1,
        username: 'admin_test',
        first_name: 'Admin',
        last_name: 'Test',
        email: null,
        role: 'manager',
      },
      created_at: '2026-03-17T19:10:00Z',
    },
  ],
}

const closedDailyDetailFixture: DailyDetailResponse = {
  ...dailyDetailFixture,
  is_closed: true,
  closed_at: '2026-03-17T21:00:00Z',
  closed_by: {
    id: 1,
    username: 'admin_test',
    first_name: 'Admin',
    last_name: 'Test',
    email: null,
    role: 'manager',
  },
}

describe('DailyDetailPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    fetchDailyDetailMock.mockReset()
    logoutMock.mockReset()
    updateDailyTipMock.mockReset()
    closeDailyTipMock.mockReset()
    reopenDailyTipMock.mockReset()
    fetchAvailableWorkersMock.mockReset()
    createDailyParticipationMock.mockReset()
    updateDailyParticipationMock.mockReset()
    deleteDailyParticipationMock.mockReset()
    vi.restoreAllMocks()
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
    fetchDailyDetailMock.mockImplementation(() => new Promise(() => {}))

    render(<DailyDetailPage />)

    expect(screen.getByText('Cargando detalle del día...')).toBeInTheDocument()
  })

  it('muestra error si la carga falla', async () => {
    fetchDailyDetailMock.mockRejectedValue(new Error('No se pudo cargar el día'))

    render(<DailyDetailPage />)

    expect(await screen.findByText('No se pudo cargar el día')).toBeInTheDocument()
  })

  it('redirige al login si la API devuelve UnauthorizedError', async () => {
    fetchDailyDetailMock.mockRejectedValue(new UnauthorizedError())

    render(<DailyDetailPage />)

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled()
      expect(navigateMock).toHaveBeenCalledWith('/login', {
        replace: true,
        state: { from: '/daily/12' },
      })
    })
  })

  it('pinta el detalle del día cuando la carga funciona', async () => {
    fetchDailyDetailMock.mockResolvedValue(dailyDetailFixture)

    render(<DailyDetailPage />)

    expect(await screen.findByText('Ana Lopez')).toBeInTheDocument()
    expect(screen.getByText('2026-03-17')).toBeInTheDocument()
    expect(screen.getByText('100.00 EUR')).toBeInTheDocument()
    expect(screen.getByText('hours')).toBeInTheDocument()
    expect(screen.getAllByText('Abierto')).not.toHaveLength(0)
    expect(screen.getByText('8.00 h')).toBeInTheDocument()
    expect(screen.getByText('75.00 EUR')).toBeInTheDocument()
    expect(screen.getByText('Se creó el bote diario con un total de 100.00 EUR.')).toBeInTheDocument()
  })

  it('actualiza el bote y recarga el detalle', async () => {
    const user = userEvent.setup()
    fetchDailyDetailMock
      .mockResolvedValueOnce(dailyDetailFixture)
      .mockResolvedValueOnce({
        ...dailyDetailFixture,
        total_amount: '120.50',
      })
    updateDailyTipMock.mockResolvedValue({})

    render(<DailyDetailPage />)

    await screen.findByText('Ana Lopez')
    await user.click(screen.getByRole('button', { name: 'Editar bote' }))
    await user.clear(screen.getByLabelText('Nuevo bote total'))
    await user.type(screen.getByLabelText('Nuevo bote total'), '120.50')
    await user.click(screen.getByRole('button', { name: 'Guardar bote' }))

    await waitFor(() => {
      expect(updateDailyTipMock).toHaveBeenCalledWith(12, {
        total_amount: '120.50',
        change_reason: '',
      })
    })

    expect(fetchDailyDetailMock).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('120.50 EUR')).toBeInTheDocument()
  })

  it('mantiene el detalle visible si falla una acción', async () => {
    const user = userEvent.setup()
    fetchDailyDetailMock.mockResolvedValue(dailyDetailFixture)
    updateDailyTipMock.mockRejectedValue(new Error('No se pudo actualizar el bote'))

    render(<DailyDetailPage />)

    await screen.findByText('Ana Lopez')
    await user.click(screen.getByRole('button', { name: 'Editar bote' }))
    await user.clear(screen.getByLabelText('Nuevo bote total'))
    await user.type(screen.getByLabelText('Nuevo bote total'), '120.50')
    await user.click(screen.getByRole('button', { name: 'Guardar bote' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo actualizar el bote')
    expect(screen.getByText('Ana Lopez')).toBeInTheDocument()
    expect(screen.getByText('100.00 EUR')).toBeInTheDocument()
  })

  it('cierra el día y recarga el detalle', async () => {
    const user = userEvent.setup()
    fetchDailyDetailMock
      .mockResolvedValueOnce(dailyDetailFixture)
      .mockResolvedValueOnce(closedDailyDetailFixture)
    closeDailyTipMock.mockResolvedValue({})

    render(<DailyDetailPage />)

    await screen.findByText('Ana Lopez')
    await user.click(screen.getByRole('button', { name: 'Cerrar día' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar cierre' }))

    await waitFor(() => {
      expect(closeDailyTipMock).toHaveBeenCalledWith(12)
    })

    expect(fetchDailyDetailMock).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('Reabrir día')).toBeInTheDocument()
    expect(screen.getAllByText('Cerrado')).not.toHaveLength(0)
  })

  it('reabre el día y recarga el detalle', async () => {
    const user = userEvent.setup()
    fetchDailyDetailMock
      .mockResolvedValueOnce(closedDailyDetailFixture)
      .mockResolvedValueOnce(dailyDetailFixture)
    reopenDailyTipMock.mockResolvedValue({})

    render(<DailyDetailPage />)

    await screen.findByText('Ana Lopez')
    await user.click(screen.getByRole('button', { name: 'Reabrir día' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar reapertura' }))

    await waitFor(() => {
      expect(reopenDailyTipMock).toHaveBeenCalledWith(12)
    })

    expect(fetchDailyDetailMock).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('Cerrar día')).toBeInTheDocument()
    expect(screen.getAllByText('Abierto')).not.toHaveLength(0)
  })

  it('añade un trabajador y recarga el detalle', async () => {
    const user = userEvent.setup()
    fetchDailyDetailMock
      .mockResolvedValueOnce(dailyDetailFixture)
      .mockResolvedValueOnce({
        ...dailyDetailFixture,
        participations: [
          ...dailyDetailFixture.participations,
          {
            id: 31,
            daily_tip: 12,
            user: {
              id: 3,
              username: 'rosa',
              first_name: 'Rosa',
              last_name: 'Gil',
              email: null,
              role: 'kitchen',
            },
            hours_worked: '4.00',
            role_at_time: 'kitchen',
            weight_at_time: '0.80',
          },
        ],
        worker_rows: [
          ...dailyDetailFixture.worker_rows,
          {
            user_id: 3,
            username: 'rosa',
            first_name: 'Rosa',
            last_name: 'Gil',
            display_name: 'Rosa Gil',
            role: 'kitchen',
            hours_worked: '4.00',
            weight_at_time: '0.80',
            amount: '25.00',
          },
        ],
      })
    fetchAvailableWorkersMock.mockResolvedValue([
      {
        id: 3,
        username: 'rosa',
        first_name: 'Rosa',
        last_name: 'Gil',
        display_name: 'Rosa Gil',
        role: 'kitchen',
      },
    ])
    createDailyParticipationMock.mockResolvedValue({})

    render(<DailyDetailPage />)

    await screen.findByText('Ana Lopez')
    await user.click(screen.getByRole('button', { name: 'Añadir trabajador' }))
    await user.selectOptions(screen.getByLabelText('Trabajador'), '3')
    await user.clear(screen.getByLabelText('Horas trabajadas'))
    await user.type(screen.getByLabelText('Horas trabajadas'), '4')
    await user.click(screen.getByRole('button', { name: 'Guardar trabajador' }))

    await waitFor(() => {
      expect(fetchAvailableWorkersMock).toHaveBeenCalledWith(12)
      expect(createDailyParticipationMock).toHaveBeenCalledWith({
        daily_tip: 12,
        user_id: 3,
        hours_worked: '4.00',
        change_reason: '',
      })
    })

    expect(fetchDailyDetailMock).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('Rosa Gil')).toBeInTheDocument()
  })

  it('edita horas y recarga el detalle', async () => {
    const user = userEvent.setup()
    fetchDailyDetailMock
      .mockResolvedValueOnce(dailyDetailFixture)
      .mockResolvedValueOnce({
        ...dailyDetailFixture,
        participations: [
          {
            ...dailyDetailFixture.participations[0],
            hours_worked: '9.00',
          },
        ],
        worker_rows: [
          {
            ...dailyDetailFixture.worker_rows[0],
            hours_worked: '9.00',
            amount: '80.00',
          },
        ],
      })
    updateDailyParticipationMock.mockResolvedValue({})

    render(<DailyDetailPage />)

    await screen.findByText('Ana Lopez')
    await user.click(screen.getByRole('button', { name: 'Editar horas' }))
    await user.clear(screen.getByLabelText('Horas de Ana Lopez'))
    await user.type(screen.getByLabelText('Horas de Ana Lopez'), '9')
    await user.click(screen.getByRole('button', { name: 'Guardar horas' }))

    await waitFor(() => {
      expect(updateDailyParticipationMock).toHaveBeenCalledWith(30, {
        hours_worked: '9.00',
        change_reason: '',
      })
    })

    expect(fetchDailyDetailMock).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('9.00 h')).toBeInTheDocument()
    expect(screen.getByText('80.00 EUR')).toBeInTheDocument()
  })

  it('elimina una participación y recarga el detalle', async () => {
    const user = userEvent.setup()
    fetchDailyDetailMock
      .mockResolvedValueOnce(dailyDetailFixture)
      .mockResolvedValueOnce({
        ...dailyDetailFixture,
        participations: [],
        worker_rows: [],
      })
    deleteDailyParticipationMock.mockResolvedValue(undefined)

    render(<DailyDetailPage />)

    await screen.findByText('Ana Lopez')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))

    await waitFor(() => {
      expect(deleteDailyParticipationMock).toHaveBeenCalledWith(30, '')
    })

    expect(fetchDailyDetailMock).toHaveBeenCalledTimes(2)
    await waitFor(() => {
      expect(screen.queryByText('Ana Lopez')).not.toBeInTheDocument()
    })
  })
})
