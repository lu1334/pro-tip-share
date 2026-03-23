import { NavLink, Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Fairtip</p>
          <h1 className="brand-title">Control de reparto</h1>
          <p className="muted">
            Base de frontend preparada para autenticación, vista semanal y detalle diario.
          </p>
        </div>

        <nav className="nav">
          <NavLink
            to="/dashboard/weekly"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link--active' : 'nav-link'
            }
          >
            Semana
          </NavLink>
          <NavLink
            to="/daily/demo"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link--active' : 'nav-link'
            }
          >
            Detalle del día
          </NavLink>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link--active' : 'nav-link'
            }
          >
            Login
          </NavLink>
        </nav>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
