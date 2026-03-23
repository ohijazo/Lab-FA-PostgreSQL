import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoApp from '../logos/logoApp.png'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const redirect = sessionStorage.getItem('redirectAfterLogin')
      if (redirect) {
        sessionStorage.removeItem('redirectAfterLogin')
        navigate(redirect)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container" style={{ maxWidth: 400, marginTop: '8vh' }}>
      <article>
        <header style={{ textAlign: 'center' }}>
          <img src={logoApp} alt="Lab FC" style={{ width: 220, height: 'auto', marginBottom: '0.75rem' }} />
          <h2 style={{ margin: 0 }}>Iniciar sessió</h2>
        </header>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              autoFocus
              required
            />
          </label>
          <label>
            Contrasenya
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p style={{ color: 'var(--pico-color-red-500, red)' }}>{error}</p>}
          <button type="submit" aria-busy={loading} disabled={loading}>
            Entrar
          </button>
        </form>
      </article>
    </main>
  )
}
