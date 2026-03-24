import type { FormEvent } from 'react'
import type { AvailableWorker, DailyDetailResponse } from '../../types/api'

type DailyDetailActionsPanelProps = {
  dailyDetail: DailyDetailResponse
  isSubmittingAction: boolean
  isEditingTotalAmount: boolean
  isConfirmingClosedState: boolean
  isAddingWorker: boolean
  draftTotalAmount: string
  draftTotalAmountReason: string
  availableWorkers: AvailableWorker[]
  selectedWorkerId: string
  draftWorkerHours: string
  draftWorkerReason: string
  onOpenAddWorkerForm: () => void | Promise<void>
  onToggleEditTotalAmount: () => void
  onToggleClosedState: () => void
  onSubmitTotalAmount: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  onDraftTotalAmountChange: (value: string) => void
  onDraftTotalAmountReasonChange: (value: string) => void
  onCancelEditTotalAmount: () => void
  onConfirmClosedState: () => void | Promise<void>
  onCancelClosedState: () => void
  onSubmitAddWorker: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  onSelectedWorkerIdChange: (value: string) => void
  onDraftWorkerHoursChange: (value: string) => void
  onDraftWorkerReasonChange: (value: string) => void
  onCancelAddWorker: () => void
}

export function DailyDetailActionsPanel({
  dailyDetail,
  isSubmittingAction,
  isEditingTotalAmount,
  isConfirmingClosedState,
  isAddingWorker,
  draftTotalAmount,
  draftTotalAmountReason,
  availableWorkers,
  selectedWorkerId,
  draftWorkerHours,
  draftWorkerReason,
  onOpenAddWorkerForm,
  onToggleEditTotalAmount,
  onToggleClosedState,
  onSubmitTotalAmount,
  onDraftTotalAmountChange,
  onDraftTotalAmountReasonChange,
  onCancelEditTotalAmount,
  onConfirmClosedState,
  onCancelClosedState,
  onSubmitAddWorker,
  onSelectedWorkerIdChange,
  onDraftWorkerHoursChange,
  onDraftWorkerReasonChange,
  onCancelAddWorker,
}: DailyDetailActionsPanelProps) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Acciones</p>
          <h3 className="section-title">Cambios del día</h3>
          <p className="muted">Las acciones mantienen la trazabilidad actual del backend.</p>
        </div>
      </div>

      <div className="actions-bar">
        <button
          className="btn primary"
          type="button"
          onClick={onOpenAddWorkerForm}
          disabled={isSubmittingAction}
        >
          {isAddingWorker ? 'Recargar trabajadores' : 'Añadir trabajador'}
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={onToggleEditTotalAmount}
          disabled={isSubmittingAction}
        >
          {isEditingTotalAmount ? 'Cancelar edición' : 'Editar bote'}
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={onToggleClosedState}
          disabled={isSubmittingAction}
        >
          {isConfirmingClosedState
            ? 'Cancelar cambio de estado'
            : dailyDetail.is_closed
              ? 'Reabrir día'
              : 'Cerrar día'}
        </button>
      </div>

      <div className="detail-side-stack">
        {isEditingTotalAmount ? (
          <form className="panel-card stack gap-md" onSubmit={onSubmitTotalAmount}>
            <div className="panel-card-header">
              <div>
                <p className="eyebrow">Bote</p>
                <h4 className="section-title">Editar total del día</h4>
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="total-amount">
                Nuevo bote total
              </label>
              <input
                id="total-amount"
                className="input"
                value={draftTotalAmount}
                onChange={(event) => onDraftTotalAmountChange(event.target.value)}
                disabled={isSubmittingAction}
              />
            </div>

            {dailyDetail.is_closed ? (
              <div className="field">
                <label className="label" htmlFor="total-amount-reason">
                  Motivo del cambio
                </label>
                <input
                  id="total-amount-reason"
                  className="input"
                  value={draftTotalAmountReason}
                  onChange={(event) => onDraftTotalAmountReasonChange(event.target.value)}
                  disabled={isSubmittingAction}
                />
              </div>
            ) : null}

            <div className="actions-bar">
              <button className="btn primary" type="submit" disabled={isSubmittingAction}>
                Guardar bote
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={onCancelEditTotalAmount}
                disabled={isSubmittingAction}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        {isConfirmingClosedState ? (
          <div className="panel-card stack gap-md">
            <div className="panel-card-header">
              <div>
                <p className="eyebrow">Estado</p>
                <h4 className="section-title">
                  {dailyDetail.is_closed ? 'Confirmar reapertura' : 'Confirmar cierre'}
                </h4>
              </div>
            </div>

            <p className="muted">
              {dailyDetail.is_closed
                ? 'Confirma si quieres reabrir este día.'
                : 'Confirma si quieres cerrar este día.'}
            </p>
            <div className="actions-bar">
              <button
                className="btn primary"
                type="button"
                onClick={onConfirmClosedState}
                disabled={isSubmittingAction}
              >
                {dailyDetail.is_closed ? 'Confirmar reapertura' : 'Confirmar cierre'}
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={onCancelClosedState}
                disabled={isSubmittingAction}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        {isAddingWorker ? (
          <form className="panel-card stack gap-md" onSubmit={onSubmitAddWorker}>
            <div className="panel-card-header">
              <div>
                <p className="eyebrow">Participación</p>
                <h4 className="section-title">Añadir trabajador</h4>
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="add-worker-select">
                Trabajador
              </label>
              <select
                id="add-worker-select"
                className="input"
                value={selectedWorkerId}
                onChange={(event) => onSelectedWorkerIdChange(event.target.value)}
                disabled={isSubmittingAction}
              >
                {availableWorkers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.display_name} ({worker.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="add-worker-hours">
                Horas trabajadas
              </label>
              <input
                id="add-worker-hours"
                className="input"
                value={draftWorkerHours}
                onChange={(event) => onDraftWorkerHoursChange(event.target.value)}
                disabled={isSubmittingAction}
              />
            </div>

            {dailyDetail.is_closed ? (
              <div className="field">
                <label className="label" htmlFor="add-worker-reason">
                  Motivo del cambio
                </label>
                <input
                  id="add-worker-reason"
                  className="input"
                  value={draftWorkerReason}
                  onChange={(event) => onDraftWorkerReasonChange(event.target.value)}
                  disabled={isSubmittingAction}
                />
              </div>
            ) : null}

            <div className="actions-bar">
              <button className="btn primary" type="submit" disabled={isSubmittingAction}>
                Guardar trabajador
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={onCancelAddWorker}
                disabled={isSubmittingAction}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        {!isEditingTotalAmount && !isConfirmingClosedState && !isAddingWorker ? (
          <div className="note">
            <strong>Acción activa: ninguna</strong>
            <p className="muted">
              Selecciona una acción para editar el bote, cambiar el estado o añadir un trabajador.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
