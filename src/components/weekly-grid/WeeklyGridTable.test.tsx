import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { WeeklyGridTable } from './WeeklyGridTable'
import type { WeeklyGridResponse } from '../../types/api'

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
    {
      daily_tip_id: null,
      date: '2026-03-17',
      total_amount: '0.00',
      distribution_method: 'weight_hours',
      is_closed: false,
      distributed_total: '0.00',
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

describe('WeeklyGridTable', () => {
  it('muestra enlaces solo para los días y celdas con detalle navegable', () => {
    render(
      <MemoryRouter>
        <WeeklyGridTable weeklyGrid={weeklyGridFixture} />
      </MemoryRouter>,
    )

    const dayLink = screen.getByRole('link', { name: /2026-03-16 120.00 EUR Cerrado/i })
    const amountLink = screen.getByRole('link', { name: /68.00 EUR 8.00 h/i })

    expect(dayLink).toHaveAttribute('href', '/daily/12')
    expect(amountLink).toHaveAttribute('href', '/daily/12')
    expect(screen.queryByRole('link', { name: /2026-03-17 0.00 EUR Abierto/i })).not.toBeInTheDocument()
    expect(screen.getAllByText('0.00 EUR')).not.toHaveLength(0)
    expect(screen.getByText('0.00 h')).toBeInTheDocument()
  })

  it('muestra estado vacío cuando faltan días o trabajadores', () => {
    render(
      <MemoryRouter>
        <WeeklyGridTable
          weeklyGrid={{
            ...weeklyGridFixture,
            days: [],
            workers: [],
          }}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('No hay datos suficientes para construir la tabla semanal.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('La tabla aparecerá cuando existan días y trabajadores en la respuesta semanal.'),
    ).toBeInTheDocument()
  })
})
