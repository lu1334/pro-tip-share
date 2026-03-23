import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function AppLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Fairtip</p>
          <h1 className="brand-title">Control de reparto</h1>
          <p className="muted">
            Base de frontend preparada para autenticación, vista semanal y detalle diario.
          </p>
          {user ? (
            <p className="muted">
              Sesión actual: <strong>{user.username}</strong>
            </p>
          ) : null}
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
          <button className="nav-link" type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </nav>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
