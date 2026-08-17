import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'
import Button from '../components/ui/Button'
import logoApp from '../logos/logoApp.png'

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
    <main className="login-container">
      <article className="login-card">
        <header className="login-header">
          <img src={logoApp} alt="Lab FC" className="login-logo" />
          <h2 className="login-title">{t('login.iniciar_sessio')}</h2>
        </header>
        <form onSubmit={handleSubmit}>
          <label className="login-field">
            <span className="login-label">{t('login.email')}</span>
            <div className="login-input-wrap">
              <Icon name="Mail" size={14} className="login-input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.placeholder_email')}
                autoFocus
                required
              />
            </div>
          </label>
          <label className="login-field">
            <span className="login-label">{t('login.contrasenya')}</span>
            <div className="login-input-wrap">
              <Icon name="Lock" size={14} className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Amagar' : 'Mostrar'}
              >
                <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
              </button>
            </div>
          </label>
          {error && (
            <div className="alert alert-danger">
              <Icon name="AlertCircle" size={14} />
              <span>{error}</span>
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={<Icon name="LogIn" size={16} />}
            className="login-submit"
          >
            {t('login.entrar')}
          </Button>
        </form>
      </article>
    </main>
  )
}
