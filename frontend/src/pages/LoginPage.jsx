import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import logoApp from '../logos/logoApp.png'

export default function LoginPage() {
  const { t } = useTranslation()
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
          <h2 style={{ margin: 0 }}>{t('login.iniciar_sessio')}</h2>
        </header>
        <form onSubmit={handleSubmit}>
          <label>
            {t('login.email')}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.placeholder_email')}
              autoFocus
              required
            />
          </label>
          <label>
            {t('login.contrasenya')}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p style={{ color: 'var(--pico-color-red-500, red)' }}>{error}</p>}
          <button type="submit" aria-busy={loading} disabled={loading}>
            {t('login.entrar')}
          </button>
        </form>
      </article>
    </main>
  )
}
