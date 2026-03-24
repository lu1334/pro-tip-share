import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DailyDetailActionsPanel } from './DailyDetailActionsPanel'
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
  worker_rows: [],
  history: [],
}

type RenderActionsPanelOptions = {
  isClosed?: boolean
  isEditingTotalAmount?: boolean
  isConfirmingClosedState?: boolean
  isAddingWorker?: boolean
}

function renderActionsPanel({
  isClosed = false,
  isEditingTotalAmount = false,
  isConfirmingClosedState = false,
  isAddingWorker = false,
}: RenderActionsPanelOptions = {}) {
  const onOpenAddWorkerForm = vi.fn()
  const onToggleEditTotalAmount = vi.fn()
  const onToggleClosedState = vi.fn()
  const onSubmitTotalAmount = vi.fn()
  const onDraftTotalAmountChange = vi.fn()
  const onDraftTotalAmountReasonChange = vi.fn()
  const onCancelEditTotalAmount = vi.fn()
  const onConfirmClosedState = vi.fn()
  const onCancelClosedState = vi.fn()
  const onSubmitAddWorker = vi.fn()
  const onSelectedWorkerIdChange = vi.fn()
  const onDraftWorkerHoursChange = vi.fn()
  const onDraftWorkerReasonChange = vi.fn()
  const onCancelAddWorker = vi.fn()

  render(
    <DailyDetailActionsPanel
      dailyDetail={{
        ...dailyDetailFixture,
        is_closed: isClosed,
      }}
      isSubmittingAction={false}
      isEditingTotalAmount={isEditingTotalAmount}
      isConfirmingClosedState={isConfirmingClosedState}
      isAddingWorker={isAddingWorker}
      draftTotalAmount="120.50"
      draftTotalAmountReason="Corrección"
      availableWorkers={[
        {
          id: 3,
          username: 'rosa',
          first_name: 'Rosa',
          last_name: 'Gil',
          display_name: 'Rosa Gil',
          role: 'kitchen',
        },
      ]}
      selectedWorkerId="3"
      draftWorkerHours="4.00"
      draftWorkerReason="Cambio"
      onOpenAddWorkerForm={onOpenAddWorkerForm}
      onToggleEditTotalAmount={onToggleEditTotalAmount}
      onToggleClosedState={onToggleClosedState}
      onSubmitTotalAmount={onSubmitTotalAmount}
      onDraftTotalAmountChange={onDraftTotalAmountChange}
      onDraftTotalAmountReasonChange={onDraftTotalAmountReasonChange}
      onCancelEditTotalAmount={onCancelEditTotalAmount}
      onConfirmClosedState={onConfirmClosedState}
      onCancelClosedState={onCancelClosedState}
      onSubmitAddWorker={onSubmitAddWorker}
      onSelectedWorkerIdChange={onSelectedWorkerIdChange}
      onDraftWorkerHoursChange={onDraftWorkerHoursChange}
      onDraftWorkerReasonChange={onDraftWorkerReasonChange}
      onCancelAddWorker={onCancelAddWorker}
    />,
  )

  return {
    onOpenAddWorkerForm,
    onToggleEditTotalAmount,
    onToggleClosedState,
    onConfirmClosedState,
  }
}

describe('DailyDetailActionsPanel', () => {
  it('muestra una nota cuando no hay ninguna acción activa y dispara los botones principales', async () => {
    const user = userEvent.setup()
    const { onOpenAddWorkerForm, onToggleEditTotalAmount, onToggleClosedState } =
      renderActionsPanel()

    expect(screen.getByText('Acción activa: ninguna')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Añadir trabajador' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar bote' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar día' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Añadir trabajador' }))
    await user.click(screen.getByRole('button', { name: 'Editar bote' }))
    await user.click(screen.getByRole('button', { name: 'Cerrar día' }))

    expect(onOpenAddWorkerForm).toHaveBeenCalled()
    expect(onToggleEditTotalAmount).toHaveBeenCalled()
    expect(onToggleClosedState).toHaveBeenCalled()
  })

  it('muestra el formulario de edición del bote y añade motivo solo en días cerrados', () => {
    const { rerender } = render(
      <DailyDetailActionsPanel
        dailyDetail={dailyDetailFixture}
        isSubmittingAction={false}
        isEditingTotalAmount
        isConfirmingClosedState={false}
        isAddingWorker={false}
        draftTotalAmount="120.50"
        draftTotalAmountReason="Corrección"
        availableWorkers={[]}
        selectedWorkerId=""
        draftWorkerHours="0.00"
        draftWorkerReason=""
        onOpenAddWorkerForm={vi.fn()}
        onToggleEditTotalAmount={vi.fn()}
        onToggleClosedState={vi.fn()}
        onSubmitTotalAmount={vi.fn()}
        onDraftTotalAmountChange={vi.fn()}
        onDraftTotalAmountReasonChange={vi.fn()}
        onCancelEditTotalAmount={vi.fn()}
        onConfirmClosedState={vi.fn()}
        onCancelClosedState={vi.fn()}
        onSubmitAddWorker={vi.fn()}
        onSelectedWorkerIdChange={vi.fn()}
        onDraftWorkerHoursChange={vi.fn()}
        onDraftWorkerReasonChange={vi.fn()}
        onCancelAddWorker={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Nuevo bote total')).toHaveValue('120.50')
    expect(screen.queryByLabelText('Motivo del cambio')).not.toBeInTheDocument()

    rerender(
      <DailyDetailActionsPanel
        dailyDetail={{
          ...dailyDetailFixture,
          is_closed: true,
        }}
        isSubmittingAction={false}
        isEditingTotalAmount
        isConfirmingClosedState={false}
        isAddingWorker={false}
        draftTotalAmount="120.50"
        draftTotalAmountReason="Corrección"
        availableWorkers={[]}
        selectedWorkerId=""
        draftWorkerHours="0.00"
        draftWorkerReason=""
        onOpenAddWorkerForm={vi.fn()}
        onToggleEditTotalAmount={vi.fn()}
        onToggleClosedState={vi.fn()}
        onSubmitTotalAmount={vi.fn()}
        onDraftTotalAmountChange={vi.fn()}
        onDraftTotalAmountReasonChange={vi.fn()}
        onCancelEditTotalAmount={vi.fn()}
        onConfirmClosedState={vi.fn()}
        onCancelClosedState={vi.fn()}
        onSubmitAddWorker={vi.fn()}
        onSelectedWorkerIdChange={vi.fn()}
        onDraftWorkerHoursChange={vi.fn()}
        onDraftWorkerReasonChange={vi.fn()}
        onCancelAddWorker={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Motivo del cambio')).toHaveValue('Corrección')
  })

  it('muestra la confirmación del cambio de estado con el texto correcto', async () => {
    const user = userEvent.setup()
    const { onConfirmClosedState } = renderActionsPanel({
      isClosed: true,
      isConfirmingClosedState: true,
    })

    expect(
      screen.getByRole('heading', { name: 'Confirmar reapertura', level: 4 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Confirma si quieres reabrir este día.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirmar reapertura' }))

    expect(onConfirmClosedState).toHaveBeenCalled()
  })

  it('muestra el formulario de añadir trabajador y el motivo solo si el día está cerrado', () => {
    const { rerender } = render(
      <DailyDetailActionsPanel
        dailyDetail={dailyDetailFixture}
        isSubmittingAction={false}
        isEditingTotalAmount={false}
        isConfirmingClosedState={false}
        isAddingWorker
        draftTotalAmount="100.00"
        draftTotalAmountReason=""
        availableWorkers={[
          {
            id: 3,
            username: 'rosa',
            first_name: 'Rosa',
            last_name: 'Gil',
            display_name: 'Rosa Gil',
            role: 'kitchen',
          },
        ]}
        selectedWorkerId="3"
        draftWorkerHours="4.00"
        draftWorkerReason="Cambio"
        onOpenAddWorkerForm={vi.fn()}
        onToggleEditTotalAmount={vi.fn()}
        onToggleClosedState={vi.fn()}
        onSubmitTotalAmount={vi.fn()}
        onDraftTotalAmountChange={vi.fn()}
        onDraftTotalAmountReasonChange={vi.fn()}
        onCancelEditTotalAmount={vi.fn()}
        onConfirmClosedState={vi.fn()}
        onCancelClosedState={vi.fn()}
        onSubmitAddWorker={vi.fn()}
        onSelectedWorkerIdChange={vi.fn()}
        onDraftWorkerHoursChange={vi.fn()}
        onDraftWorkerReasonChange={vi.fn()}
        onCancelAddWorker={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Trabajador')).toHaveValue('3')
    expect(screen.getByLabelText('Horas trabajadas')).toHaveValue('4.00')
    expect(screen.queryByLabelText('Motivo del cambio')).not.toBeInTheDocument()

    rerender(
      <DailyDetailActionsPanel
        dailyDetail={{
          ...dailyDetailFixture,
          is_closed: true,
        }}
        isSubmittingAction={false}
        isEditingTotalAmount={false}
        isConfirmingClosedState={false}
        isAddingWorker
        draftTotalAmount="100.00"
        draftTotalAmountReason=""
        availableWorkers={[
          {
            id: 3,
            username: 'rosa',
            first_name: 'Rosa',
            last_name: 'Gil',
            display_name: 'Rosa Gil',
            role: 'kitchen',
          },
        ]}
        selectedWorkerId="3"
        draftWorkerHours="4.00"
        draftWorkerReason="Cambio"
        onOpenAddWorkerForm={vi.fn()}
        onToggleEditTotalAmount={vi.fn()}
        onToggleClosedState={vi.fn()}
        onSubmitTotalAmount={vi.fn()}
        onDraftTotalAmountChange={vi.fn()}
        onDraftTotalAmountReasonChange={vi.fn()}
        onCancelEditTotalAmount={vi.fn()}
        onConfirmClosedState={vi.fn()}
        onCancelClosedState={vi.fn()}
        onSubmitAddWorker={vi.fn()}
        onSelectedWorkerIdChange={vi.fn()}
        onDraftWorkerHoursChange={vi.fn()}
        onDraftWorkerReasonChange={vi.fn()}
        onCancelAddWorker={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Motivo del cambio')).toHaveValue('Cambio')
  })
})
