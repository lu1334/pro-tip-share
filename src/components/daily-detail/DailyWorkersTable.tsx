import type { FormEvent } from 'react'
import type { DailyParticipation, DailyWorkerRow } from '../../types/api'

type DailyWorkersTableProps = {
  workerRows: DailyWorkerRow[]
  isClosed: boolean
  isSubmittingAction: boolean
  editingParticipationId: number | null
  deletingParticipationId: number | null
  draftEditHours: string
  draftEditReason: string
  draftDeleteReason: string
  getParticipationByUserId: (userId: number) => DailyParticipation | undefined
  onStartEditHours: (participation: DailyParticipation) => void
  onStartDeleteParticipation: (participationId: number) => void
  onSubmitEditHours: (
    event: FormEvent<HTMLFormElement>,
    participation: DailyParticipation,
  ) => void | Promise<void>
  onDraftEditHoursChange: (value: string) => void
  onDraftEditReasonChange: (value: string) => void
  onDraftDeleteReasonChange: (value: string) => void
  onConfirmDeleteParticipation: (participation: DailyParticipation) => void | Promise<void>
}

export function DailyWorkersTable({
  workerRows,
  isClosed,
  isSubmittingAction,
  editingParticipationId,
  deletingParticipationId,
  draftEditHours,
  draftEditReason,
  draftDeleteReason,
  getParticipationByUserId,
  onStartEditHours,
  onStartDeleteParticipation,
  onSubmitEditHours,
  onDraftEditHoursChange,
  onDraftEditReasonChange,
  onDraftDeleteReasonChange,
  onConfirmDeleteParticipation,
}: DailyWorkersTableProps) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Reparto</p>
          <h3 className="section-title">Trabajadores del día</h3>
          <p className="muted">Las horas y cantidades se muestran con el reparto ya calculado.</p>
        </div>
      </div>

      {workerRows.length ? (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Rol</th>
                <th>Horas</th>
                <th>Peso</th>
                <th>Cantidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {workerRows.map((worker) => {
                const participation = getParticipationByUserId(worker.user_id)

                return (
                  <tr key={worker.user_id}>
                    <td>{worker.display_name}</td>
                    <td>{worker.role}</td>
                    <td>{worker.hours_worked} h</td>
                    <td>{worker.weight_at_time ?? '-'}</td>
                    <td>{worker.amount} EUR</td>
                    <td>
                      {participation ? (
                        <div className="stack gap-md">
                          <div className="actions-bar">
                            <button
                              className="btn ghost"
                              type="button"
                              onClick={() => onStartEditHours(participation)}
                              disabled={isSubmittingAction}
                            >
                              {editingParticipationId === participation.id
                                ? 'Cancelar edición'
                                : 'Editar horas'}
                            </button>
                            <button
                              className="btn ghost"
                              type="button"
                              onClick={() => onStartDeleteParticipation(participation.id)}
                              disabled={isSubmittingAction}
                            >
                              {deletingParticipationId === participation.id
                                ? 'Cancelar eliminación'
                                : 'Eliminar'}
                            </button>
                          </div>

                          {editingParticipationId === participation.id ? (
                            <form
                              className="panel-card stack gap-md"
                              onSubmit={(event) => onSubmitEditHours(event, participation)}
                            >
                              <div className="panel-card-header">
                                <div>
                                  <p className="eyebrow">Horas</p>
                                  <h4 className="section-title">Editar participación</h4>
                                </div>
                              </div>

                              <div className="field">
                                <label className="label" htmlFor={`edit-hours-${participation.id}`}>
                                  Horas de {worker.display_name}
                                </label>
                                <input
                                  id={`edit-hours-${participation.id}`}
                                  className="input"
                                  value={draftEditHours}
                                  onChange={(event) => onDraftEditHoursChange(event.target.value)}
                                  disabled={isSubmittingAction}
                                />
                              </div>

                              {isClosed ? (
                                <div className="field">
                                  <label
                                    className="label"
                                    htmlFor={`edit-reason-${participation.id}`}
                                  >
                                    Motivo del cambio
                                  </label>
                                  <input
                                    id={`edit-reason-${participation.id}`}
                                    className="input"
                                    value={draftEditReason}
                                    onChange={(event) => onDraftEditReasonChange(event.target.value)}
                                    disabled={isSubmittingAction}
                                  />
                                </div>
                              ) : null}

                              <div className="actions-bar">
                                <button
                                  className="btn primary"
                                  type="submit"
                                  disabled={isSubmittingAction}
                                >
                                  Guardar horas
                                </button>
                              </div>
                            </form>
                          ) : null}

                          {deletingParticipationId === participation.id ? (
                            <div className="panel-card stack gap-md">
                              <div className="panel-card-header">
                                <div>
                                  <p className="eyebrow">Eliminar</p>
                                  <h4 className="section-title">Quitar participación</h4>
                                </div>
                              </div>

                              <p className="muted">
                                Confirma si quieres eliminar a {worker.display_name} de este día.
                              </p>

                              {isClosed ? (
                                <div className="field">
                                  <label
                                    className="label"
                                    htmlFor={`delete-reason-${participation.id}`}
                                  >
                                    Motivo del cambio
                                  </label>
                                  <input
                                    id={`delete-reason-${participation.id}`}
                                    className="input"
                                    value={draftDeleteReason}
                                    onChange={(event) => onDraftDeleteReasonChange(event.target.value)}
                                    disabled={isSubmittingAction}
                                  />
                                </div>
                              ) : null}

                              <div className="actions-bar">
                                <button
                                  className="btn primary"
                                  type="button"
                                  onClick={() => onConfirmDeleteParticipation(participation)}
                                  disabled={isSubmittingAction}
                                >
                                  Confirmar eliminación
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="muted">Sin acciones</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <strong>No hay trabajadores cargados para este día.</strong>
          <p className="muted">Añade una participación para empezar a repartir el bote.</p>
        </div>
      )}
    </section>
  )
}
