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
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light'
  })
  const dropdownRef = useRef(null)
  const menuRef = useRef(null)
  const lang = i18n.language?.startsWith('es') ? 'es' : 'ca'

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  // Close dropdown / overflow menu on click outside
  useEffect(() => {
    function handleClick(e) {
      if (configOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setConfigOpen(false)
      }
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (configOpen || menuOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [configOpen, menuOpen])

  // Close dropdown / overflow menu on route change
  useEffect(() => {
    setConfigOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`
  const isRecepcio = user?.role === 'recepcio'

  if (isRecepcio) {
    return (
      <>
        <a href="#contingut" className="skip-link">{t('nav.salta_contingut')}</a>
        <nav className="nav-sticky" aria-label={t('nav.navegacio_principal')}>
          <div className="container nav-bar">
            <div className="nav-brand">
              <img src={logoApp} alt="Lab FC" style={{ height: 36, width: 'auto' }} />
              <div className="nav-brand-text">
                <span className="nav-brand-name">Lab FC</span>
                <span className="nav-brand-sub">{t('recepcio.titol')}</span>
              </div>
            </div>
            <div className="nav-actions">
              <button className="theme-toggle" onClick={toggleTheme} title={t('nav.tema')} aria-label={t('nav.tema')}>
                <Icon name={theme === 'light' ? 'Moon' : 'Sun'} size={16} />
              </button>
              <div className="nav-user">
                <button type="button" className="nav-link nav-link-logout" onClick={logout}>
                  <Icon name="LogOut" size={14} />
                  <span>{t('nav.sortir')}</span>
                </button>
                <span className="nav-user-name">{user?.nom || user?.email}</span>
              </div>
            </div>
          </div>
        </nav>
        <main className="container" id="contingut">
          {children}
        </main>
      </>
    )
  }

  return (
    <>
      <a href="#contingut" className="skip-link">{t('nav.salta_contingut')}</a>
      <nav className="nav-sticky" aria-label={t('nav.navegacio_principal')}>
        <div className="container nav-bar">
          <Link to="/" className="nav-brand">
            <img src={logoApp} alt="Lab FC" style={{ height: 36, width: 'auto' }} />
            <div className="nav-brand-text">
              <span className="nav-brand-name">Lab FC</span>
              <span className="nav-brand-sub">{t('nav.gestio_analisis')}</span>
            </div>
          </Link>
          {/* Per sota de 768px les accions es pleguen darrere el botó de menú;
              per sobre, .nav-collapse és un simple contenidor sense efecte. */}
          <div className="nav-collapse" ref={menuRef}>
            <button
              type="button"
              className="nav-menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="nav-menu"
              aria-label={t('nav.menu')}
              title={t('nav.menu')}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Icon name={menuOpen ? 'X' : 'Menu'} size={18} />
            </button>
            <div className={`nav-actions${menuOpen ? ' is-open' : ''}`} id="nav-menu">
              {isHome && (
                <button type="button" className="nav-link" onClick={() => {
                  setMenuOpen(false)
                  window.dispatchEvent(new CustomEvent('open-export-dialog'))
                }}>{t('nav.exportar_excel')}</button>
              )}
              {(user?.role === 'admin' || user?.role === 'user') && (
                <div className="nav-dropdown" ref={dropdownRef}>
                  <button
                    type="button"
                    className={`nav-link${isAdminRoute ? ' is-active' : ''}`}
                    aria-haspopup="menu"
                    aria-expanded={configOpen}
                    onClick={() => setConfigOpen((v) => !v)}
                  >
                    {t('nav.configuracio')}
                  </button>
                  {configOpen && (
                    <div className="nav-dropdown-menu" role="menu">
                      <NavLink
                        to="/admin/tipus"
                        role="menuitem"
                        className={({ isActive }) => `nav-dropdown-item${isActive ? ' is-active' : ''}`}
                        onClick={() => setConfigOpen(false)}
                      >
                        {t('nav.tipus_analisi')}
                      </NavLink>
                      {user?.role === 'admin' && (
                        <NavLink
                          to="/admin/users"
                          role="menuitem"
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
                type="button"
                className="nav-link lang-switcher"
                onClick={() => i18n.changeLanguage(lang === 'ca' ? 'es' : 'ca')}
                title={t('nav.idioma')}
                aria-label={t('nav.idioma')}
              >
                <Icon name="Languages" size={14} />
                <span>{lang === 'ca' ? 'ES' : 'CA'}</span>
              </button>
              <div className="nav-user">
                <button type="button" className="nav-link nav-link-logout" onClick={logout}>
                  <Icon name="LogOut" size={14} />
                  <span>{t('nav.sortir')}</span>
                </button>
                <span className="nav-user-name">{user?.nom || user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="container" id="contingut">
        {children}
      </main>
    </>
  )
}
