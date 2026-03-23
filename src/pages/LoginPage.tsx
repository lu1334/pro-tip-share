import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccessToken, loginUser, saveAuthTokens } from '../services/auth'
import { getApiBaseUrl } from '../services/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (getAccessToken()) {
      navigate('/dashboard/weekly', { replace: true })
    }
  }, [navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Usuario y contraseña son obligatorios.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await loginUser(username.trim(), password)
      saveAuthTokens(response.access, response.refresh)
      navigate('/dashboard/weekly', { replace: true })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo iniciar sesión.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page">
      <header className="page-header-block">
        <p className="eyebrow">Autenticación</p>
        <h2 className="page-title">Acceso al panel</h2>
        <p className="muted">
          Inicia sesión con el usuario administrador para entrar a la vista semanal y al detalle
          diario.
        </p>
      </header>

      <form className="card card--narrow stack gap-lg" onSubmit={handleSubmit}>
        <div className="field">
          <label className="label" htmlFor="username">
            Usuario
          </label>
          <input
            id="username"
            className="input"
            placeholder="admin_test"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>

        {errorMessage ? <div className="feedback feedback--error">{errorMessage}</div> : null}

        <button className="btn primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="note">
          <p className="eyebrow">Endpoint activo</p>
          <p className="muted">
            <code>{getApiBaseUrl()}/api/users/login/</code>
          </p>
        </div>
      </form>
    </section>
  )
}
