import { Link, useParams } from 'react-router-dom'
import type { DailyDetailResponse } from '../types/api'

const previewDetail: DailyDetailResponse = {
  id: 2,
  date: '2026-03-17',
  total_amount: '95.00',
  distribution_method: 'hours',
  created_by: {
    id: 99,
    username: 'admin_test',
    first_name: 'Admin',
    last_name: 'Fairtip',
    email: null,
    role: 'manager',
  },
  created_at: '2026-03-17T21:03:00Z',
  is_closed: false,
  closed_at: null,
  closed_by: null,
  participations: [],
  distributions: [],
  worker_rows: [
    {
      user_id: 1,
      username: 'ana',
      first_name: 'Ana',
      last_name: 'Lopez',
      display_name: 'Ana Lopez',
      role: 'waiter',
      hours_worked: '5.00',
      weight_at_time: '1.00',
      amount: '42.00',
    },
    {
      user_id: 2,
      username: 'luis',
      first_name: 'Luis',
      last_name: 'Soto',
      display_name: 'Luis Soto',
      role: 'kitchen',
      hours_worked: '4.00',
      weight_at_time: '0.80',
      amount: '20.00',
    },
  ],
  history: [
    {
      id: 1,
      event_type: 'created',
      message: 'Se creo el bote diario con un total de 95.00 EUR.',
      reason: '',
      old_value: null,
      new_value: null,
      happened_after_closure: false,
      changed_by: {
        id: 99,
        username: 'admin_test',
        first_name: 'Admin',
        last_name: 'Fairtip',
        email: null,
        role: 'manager',
      },
      created_at: '2026-03-17T21:03:00Z',
    },
    {
      id: 2,
      event_type: 'hours_updated',
      message: 'Se actualizo la participacion de Luis Soto.',
      reason: 'Faltaba una hora al cerrar caja.',
      old_value: null,
      new_value: null,
      happened_after_closure: true,
      changed_by: {
        id: 99,
        username: 'admin_test',
        first_name: 'Admin',
        last_name: 'Fairtip',
        email: null,
        role: 'manager',
      },
      created_at: '2026-03-17T21:10:00Z',
    },
  ],
}

export function DailyDetailPage() {
  const { dailyTipId } = useParams()

  return (
    <section className="page">
      <header className="page-header-block">
        <div>
          <p className="eyebrow">Pantalla 2</p>
          <h2 className="page-title">Detalle del día {dailyTipId}</h2>
          <p className="muted">
            Página preparada para usar <code>daily-detail</code>, <code>available-workers</code> y
            las acciones de edición del día.
          </p>
        </div>

        <Link className="btn ghost" to="/dashboard/weekly">
          Volver a semana
        </Link>
      </header>

      <section className="card detail-hero">
        <div className="stats-row">
          <div className="stat">
            <span className="stat-label">Fecha</span>
            <strong>{previewDetail.date}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Bote total</span>
            <strong>{previewDetail.total_amount} EUR</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Método</span>
            <strong>{previewDetail.distribution_method}</strong>
          </div>
          <div className="stat">
            <span className="stat-label">Estado</span>
            <strong>{previewDetail.is_closed ? 'Cerrado' : 'Abierto'}</strong>
          </div>
        </div>

        <div className="actions-bar">
          <button className="btn ghost" type="button">
            Editar bote
          </button>
          <button className="btn primary" type="button">
            Añadir trabajador
          </button>
          <button className="btn ghost" type="button">
            Cerrar día
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Reparto</p>
            <h3 className="section-title">Trabajadores del día</h3>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Rol</th>
                <th>Horas</th>
                <th>Peso</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {previewDetail.worker_rows.map((worker) => (
                <tr key={worker.user_id}>
                  <td>{worker.display_name}</td>
                  <td>{worker.role}</td>
                  <td>{worker.hours_worked} h</td>
                  <td>{worker.weight_at_time ?? '-'}</td>
                  <td>{worker.amount} EUR</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Auditoría</p>
            <h3 className="section-title">Historial del día</h3>
          </div>
        </div>

        <div className="history-list">
          {previewDetail.history.map((entry) => (
            <article className="history-item" key={entry.id}>
              <div className="history-meta">
                <strong>{entry.changed_by?.username ?? 'Sistema'}</strong>
                <span>{new Date(entry.created_at).toLocaleString('es-ES')}</span>
              </div>
              <p>{entry.message}</p>
              {entry.reason ? <p className="history-reason">Motivo: {entry.reason}</p> : null}
              {entry.happened_after_closure ? (
                <span className="status-badge">Posterior al cierre</span>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
