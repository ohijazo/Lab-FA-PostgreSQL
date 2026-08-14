import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import BarcodeScanner from './BarcodeScanner'
import logoApp from '../logos/logoApp.png'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [configOpen, setConfigOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
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
            <a href="#" className="nav-link" onClick={(e) => {
              e.preventDefault()
              setScannerOpen(true)
            }}>{t('nav.escaner')}</a>
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
                  className="nav-link"
                  onClick={(e) => { e.preventDefault(); setConfigOpen((v) => !v) }}
                >
                  {t('nav.configuracio')}
                </a>
                {configOpen && (
                  <div className="nav-dropdown-menu">
                    <Link to="/admin/tipus" className="nav-dropdown-item" onClick={() => setConfigOpen(false)}>
                      {t('nav.tipus_analisi')}
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin/users" className="nav-dropdown-item" onClick={() => setConfigOpen(false)}>
                        {t('nav.gestio_usuaris')}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
            <Link to="/ajuda" className="nav-link">{t('nav.ajuda')}</Link>
            <button className="theme-toggle" onClick={toggleTheme} title={t('nav.tema')}>
              {theme === 'light' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>
            <button className="nav-link lang-switcher" onClick={() => i18n.changeLanguage(lang === 'ca' ? 'es' : 'ca')}>{lang === 'ca' ? 'ES' : 'CA'}</button>
            <div className="nav-user">
              <a href="#" className="nav-link nav-link-logout" onClick={(e) => { e.preventDefault(); logout() }}>
                {t('nav.sortir')}
              </a>
              <span className="nav-user-name">{user?.nom || user?.email}</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="container">
        {children}
      </main>
      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </>
  )
}
