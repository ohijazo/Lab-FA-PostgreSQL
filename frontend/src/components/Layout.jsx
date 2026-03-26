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
  const dropdownRef = useRef(null)
  const lang = i18n.language?.startsWith('es') ? 'es' : 'ca'

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
            {user?.role === 'admin' && (
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
                    <Link to="/admin/users" className="nav-dropdown-item" onClick={() => setConfigOpen(false)}>
                      {t('nav.gestio_usuaris')}
                    </Link>
                  </div>
                )}
              </div>
            )}
            <Link to="/ajuda" className="nav-link">{t('nav.ajuda')}</Link>
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
