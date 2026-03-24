import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DailyDetailHeader } from './DailyDetailHeader'
import type { DailyDetailResponse } from '../../types/api'

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
  participations: [],
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

describe('DailyDetailHeader', () => {
  it('muestra el resumen principal del día abierto', () => {
    render(
      <MemoryRouter>
        <DailyDetailHeader dailyDetail={dailyDetailFixture} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Detalle del día 2026-03-17')).toBeInTheDocument()
    expect(screen.getAllByText('Abierto')).not.toHaveLength(0)
    expect(
      screen.getByText('El día sigue abierto y se puede ajustar antes del cierre.'),
    ).toBeInTheDocument()
    expect(screen.getByText('100.00 EUR')).toBeInTheDocument()
    expect(screen.getByText('hours')).toBeInTheDocument()
    expect(screen.getByText('Trabajadores').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Eventos').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByRole('link', { name: 'Volver a semana' })).toHaveAttribute(
      'href',
      '/dashboard/weekly',
    )
  })

  it('muestra el estado y mensaje de un día cerrado', () => {
    render(
      <MemoryRouter>
        <DailyDetailHeader
          dailyDetail={{
            ...dailyDetailFixture,
            is_closed: true,
            closed_at: '2026-03-17T21:00:00Z',
            closed_by: dailyDetailFixture.created_by,
          }}
        />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('Cerrado')).not.toHaveLength(0)
    expect(
      screen.getByText('El día está bloqueado y cualquier cambio debe quedar trazado.'),
    ).toBeInTheDocument()
  })
})
