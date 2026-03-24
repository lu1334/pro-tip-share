import { WeeklyGridHeader } from '../components/weekly-grid/WeeklyGridHeader'
import { WeeklyGridTable } from '../components/weekly-grid/WeeklyGridTable'
import { useWeeklyGridPage } from '../hooks/useWeeklyGridPage'

export function WeeklyGridPage() {
  const { weeklyGrid, error, isLoading } = useWeeklyGridPage()

  if (isLoading) {
    return (
      <section className="page">
        <header className="page-header-block">
          <div>
            <p className="eyebrow">Pantalla 1</p>
            <h2 className="page-title">Vista semanal</h2>
          </div>
        </header>

        <section className="card">
          <p className="muted">Cargando vista semanal...</p>
        </section>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <header className="page-header-block">
          <div>
            <p className="eyebrow">Pantalla 1</p>
            <h2 className="page-title">Vista semanal</h2>
          </div>
        </header>

        <section className="card">
          <p className="muted">{error}</p>
        </section>
      </section>
    )
  }

  if (!weeklyGrid) {
    return null
  }

  return (
    <section className="page">
      <WeeklyGridHeader weeklyGrid={weeklyGrid} />
      <WeeklyGridTable weeklyGrid={weeklyGrid} />
    </section>
  )
}
