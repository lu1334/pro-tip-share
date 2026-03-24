import type { DailyTipHistoryEntry } from '../../types/api'

type DailyHistoryListProps = {
  history: DailyTipHistoryEntry[]
}

export function DailyHistoryList({ history }: DailyHistoryListProps) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Auditoría</p>
          <h3 className="section-title">Historial del día</h3>
          <p className="muted">Cada cambio queda reflejado con usuario, fecha y motivo.</p>
        </div>
      </div>

      {history.length ? (
        <div className="history-list">
          {history.map((entry) => (
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
      ) : (
        <div className="empty-state">
          <strong>Todavía no hay eventos en el historial.</strong>
          <p className="muted">Cuando se registren cambios, aparecerán aquí.</p>
        </div>
      )}
    </section>
  )
}
