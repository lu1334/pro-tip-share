import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WeeklyGridHeader } from './WeeklyGridHeader'
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
      days: {},
    },
    {
      user_id: 2,
      username: 'rosa',
      first_name: 'Rosa',
      last_name: 'Gil',
      display_name: 'Rosa Gil',
      role: 'kitchen',
      weekly_total: '52.00',
      days: {},
    },
  ],
}

describe('WeeklyGridHeader', () => {
  it('muestra el resumen semanal con los contadores derivados', () => {
    render(<WeeklyGridHeader weeklyGrid={weeklyGridFixture} />)

    expect(screen.getByText('Vista semanal')).toBeInTheDocument()
    expect(screen.getByText('weight_hours')).toBeInTheDocument()
    expect(screen.getByText('2026-03-16 - 2026-03-22')).toBeInTheDocument()
    expect(screen.getByText('120.00 EUR')).toBeInTheDocument()
    expect(screen.getByText('Días con detalle').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Días cerrados').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Trabajadores').nextElementSibling).toHaveTextContent('2')
  })
})
