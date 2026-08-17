import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'
import logoApp from '../logos/logoApp.png'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isAdminRoute = location.pathname.startsWith('/admin')
  const [configOpen, setConfigOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light'
  })
  const dropdownRef = useRef(null)
  const lang = i18n.language?.startsWith('es') ? 'es' : 'ca'

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setConfigOpen(false)
      }
    }
    if (configOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [configOpen])

  // Close dropdown on route change
  useEffect(() => {
    setConfigOpen(false)
  }, [location.pathname])

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`

  return (
    <>
      <nav className="nav-sticky">
        <div className="container nav-bar">
          <Link to="/" className="nav-brand">
            <img src={logoApp} alt="Lab FC" style={{ height: 36, width: 'auto' }} />
            <div className="nav-brand-text">
              <span className="nav-brand-name">Lab FC</span>
              <span className="nav-brand-sub">{t('nav.gestio_analisis')}</span>
            </div>
          </Link>
          <div className="nav-actions">
            {isHome && (
              <a href="#" className="nav-link" onClick={(e) => {
                e.preventDefault()
                window.dispatchEvent(new CustomEvent('open-export-dialog'))
              }}>{t('nav.exportar_excel')}</a>
            )}
            {(user?.role === 'admin' || user?.role === 'user') && (
              <div className="nav-dropdown" ref={dropdownRef}>
                <a
                  href="#"
                  className={`nav-link${isAdminRoute ? ' is-active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setConfigOpen((v) => !v) }}
                >
                  {t('nav.configuracio')}
                </a>
                {configOpen && (
                  <div className="nav-dropdown-menu">
                    <NavLink
                      to="/admin/tipus"
                      className={({ isActive }) => `nav-dropdown-item${isActive ? ' is-active' : ''}`}
                      onClick={() => setConfigOpen(false)}
                    >
                      {t('nav.tipus_analisi')}
                    </NavLink>
                    {user?.role === 'admin' && (
                      <NavLink
                        to="/admin/users"
                        className={({ isActive }) => `nav-dropdown-item${isActive ? ' is-active' : ''}`}
                        onClick={() => setConfigOpen(false)}
                      >
                        {t('nav.gestio_usuaris')}
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            )}
            <NavLink to="/ajuda" className={navLinkClass}>{t('nav.ajuda')}</NavLink>
            <button className="theme-toggle" onClick={toggleTheme} title={t('nav.tema')} aria-label={t('nav.tema')}>
              <Icon name={theme === 'light' ? 'Moon' : 'Sun'} size={16} />
            </button>
            <button
              className="nav-link lang-switcher"
              onClick={() => i18n.changeLanguage(lang === 'ca' ? 'es' : 'ca')}
              title={t('nav.tema')}
            >
              <Icon name="Languages" size={14} />
              <span>{lang === 'ca' ? 'ES' : 'CA'}</span>
            </button>
            <div className="nav-user">
              <a href="#" className="nav-link nav-link-logout" onClick={(e) => { e.preventDefault(); logout() }}>
                <Icon name="LogOut" size={14} />
                <span>{t('nav.sortir')}</span>
              </a>
              <span className="nav-user-name">{user?.nom || user?.email}</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="container">
        {children}
      </main>
    </>
  )
}
