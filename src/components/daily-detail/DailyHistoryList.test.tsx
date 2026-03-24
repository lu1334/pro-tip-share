import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DailyHistoryList } from './DailyHistoryList'
import type { DailyTipHistoryEntry } from '../../types/api'

const historyFixture: DailyTipHistoryEntry[] = [
  {
    id: 100,
    event_type: 'updated',
    message: 'Se actualizó el bote diario.',
    reason: 'Ajuste manual',
    old_value: '100.00',
    new_value: '120.00',
    happened_after_closure: true,
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
]

describe('DailyHistoryList', () => {
  it('muestra los eventos con usuario, motivo y badge posterior al cierre', () => {
    const expectedTimestamp = new Date(historyFixture[0].created_at).toLocaleString('es-ES')

    render(<DailyHistoryList history={historyFixture} />)

    expect(screen.getByText('Historial del día')).toBeInTheDocument()
    expect(screen.getByText('admin_test')).toBeInTheDocument()
    expect(screen.getByText('Se actualizó el bote diario.')).toBeInTheDocument()
    expect(screen.getByText('Motivo: Ajuste manual')).toBeInTheDocument()
    expect(screen.getByText('Posterior al cierre')).toBeInTheDocument()
    expect(screen.getByText(expectedTimestamp)).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay historial', () => {
    render(<DailyHistoryList history={[]} />)

    expect(screen.getByText('Todavía no hay eventos en el historial.')).toBeInTheDocument()
    expect(screen.getByText('Cuando se registren cambios, aparecerán aquí.')).toBeInTheDocument()
  })
})
