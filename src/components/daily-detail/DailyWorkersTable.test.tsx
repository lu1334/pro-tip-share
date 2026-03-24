import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DailyWorkersTable } from './DailyWorkersTable'
import type { DailyParticipation, DailyWorkerRow } from '../../types/api'

const participationFixture: DailyParticipation = {
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
}

const workerRowsFixture: DailyWorkerRow[] = [
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
  {
    user_id: 3,
    username: 'rosa',
    first_name: 'Rosa',
    last_name: 'Gil',
    display_name: 'Rosa Gil',
    role: 'kitchen',
    hours_worked: '4.00',
    weight_at_time: null,
    amount: '25.00',
  },
]

type RenderDailyWorkersTableOptions = {
  isClosed?: boolean
  editingParticipationId?: number | null
  deletingParticipationId?: number | null
  getParticipationByUserId?: (userId: number) => DailyParticipation | undefined
}

function renderDailyWorkersTable({
  isClosed = false,
  editingParticipationId = null,
  deletingParticipationId = null,
  getParticipationByUserId = (userId) => (userId === 2 ? participationFixture : undefined),
}: RenderDailyWorkersTableOptions = {}) {
  const onStartEditHours = vi.fn()
  const onStartDeleteParticipation = vi.fn()
  const onSubmitEditHours = vi.fn()
  const onDraftEditHoursChange = vi.fn()
  const onDraftEditReasonChange = vi.fn()
  const onDraftDeleteReasonChange = vi.fn()
  const onConfirmDeleteParticipation = vi.fn()

  render(
    <DailyWorkersTable
      workerRows={workerRowsFixture}
      isClosed={isClosed}
      isSubmittingAction={false}
      editingParticipationId={editingParticipationId}
      deletingParticipationId={deletingParticipationId}
      draftEditHours="9.00"
      draftEditReason="Ajuste"
      draftDeleteReason="Eliminar"
      getParticipationByUserId={getParticipationByUserId}
      onStartEditHours={onStartEditHours}
      onStartDeleteParticipation={onStartDeleteParticipation}
      onSubmitEditHours={onSubmitEditHours}
      onDraftEditHoursChange={onDraftEditHoursChange}
      onDraftEditReasonChange={onDraftEditReasonChange}
      onDraftDeleteReasonChange={onDraftDeleteReasonChange}
      onConfirmDeleteParticipation={onConfirmDeleteParticipation}
    />,
  )

  return {
    onStartEditHours,
    onStartDeleteParticipation,
    onConfirmDeleteParticipation,
  }
}

describe('DailyWorkersTable', () => {
  it('muestra la tabla y deja sin acciones a filas sin participación', async () => {
    const user = userEvent.setup()
    const { onStartEditHours, onStartDeleteParticipation } = renderDailyWorkersTable()

    expect(screen.getByText('Trabajadores del día')).toBeInTheDocument()
    expect(screen.getByText('Ana Lopez')).toBeInTheDocument()
    expect(screen.getByText('75.00 EUR')).toBeInTheDocument()
    expect(screen.getByText('Rosa Gil')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByText('Sin acciones')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Editar horas' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(onStartEditHours).toHaveBeenCalledWith(participationFixture)
    expect(onStartDeleteParticipation).toHaveBeenCalledWith(30)
  })

  it('muestra el formulario de edición con motivo cuando el día está cerrado', () => {
    renderDailyWorkersTable({
      isClosed: true,
      editingParticipationId: 30,
    })

    expect(screen.getByLabelText('Horas de Ana Lopez')).toHaveValue('9.00')
    expect(screen.getByLabelText('Motivo del cambio')).toHaveValue('Ajuste')
    expect(screen.getByRole('button', { name: 'Guardar horas' })).toBeInTheDocument()
  })

  it('muestra la confirmación de eliminación con motivo cuando el día está cerrado', async () => {
    const user = userEvent.setup()
    const { onConfirmDeleteParticipation } = renderDailyWorkersTable({
      isClosed: true,
      deletingParticipationId: 30,
    })

    expect(screen.getByText('Quitar participación')).toBeInTheDocument()
    expect(screen.getByText('Confirma si quieres eliminar a Ana Lopez de este día.')).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo del cambio')).toHaveValue('Eliminar')

    await user.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))

    expect(onConfirmDeleteParticipation).toHaveBeenCalledWith(participationFixture)
  })

  it('muestra estado vacío cuando no hay trabajadores', () => {
    render(
      <DailyWorkersTable
        workerRows={[]}
        isClosed={false}
        isSubmittingAction={false}
        editingParticipationId={null}
        deletingParticipationId={null}
        draftEditHours=""
        draftEditReason=""
        draftDeleteReason=""
        getParticipationByUserId={() => undefined}
        onStartEditHours={vi.fn()}
        onStartDeleteParticipation={vi.fn()}
        onSubmitEditHours={vi.fn()}
        onDraftEditHoursChange={vi.fn()}
        onDraftEditReasonChange={vi.fn()}
        onDraftDeleteReasonChange={vi.fn()}
        onConfirmDeleteParticipation={vi.fn()}
      />,
    )

    expect(screen.getByText('No hay trabajadores cargados para este día.')).toBeInTheDocument()
    expect(screen.getByText('Añade una participación para empezar a repartir el bote.')).toBeInTheDocument()
  })
})
