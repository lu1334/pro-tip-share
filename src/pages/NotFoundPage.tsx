import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="page page--centered">
      <div className="card card--narrow stack gap-lg">
        <div>
          <p className="eyebrow">404</p>
          <h2 className="page-title">Ruta no encontrada</h2>
          <p className="muted">La vista que buscas no existe dentro del frontend actual.</p>
        </div>
        <Link className="btn primary" to="/dashboard/weekly">
          Ir a la vista semanal
        </Link>
      </div>
    </section>
  )
}
