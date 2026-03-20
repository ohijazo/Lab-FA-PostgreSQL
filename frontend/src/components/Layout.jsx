import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoApp from '../logos/logoApp.png'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [configOpen, setConfigOpen] = useState(false)
  const dropdownRef = useRef(null)

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
              <span className="nav-brand-sub">Gestió d'anàlisis de laboratori</span>
            </div>
          </Link>
          <div className="nav-actions">
            {isHome && (
              <a href="#" className="nav-link" onClick={(e) => {
                e.preventDefault()
                window.dispatchEvent(new CustomEvent('open-export-dialog'))
              }}>Exportar Excel</a>
            )}
            {user?.role === 'admin' && (
              <div className="nav-dropdown" ref={dropdownRef}>
                <a
                  href="#"
                  className="nav-link"
                  onClick={(e) => { e.preventDefault(); setConfigOpen((v) => !v) }}
                >
                  Configuració ▾
                </a>
                {configOpen && (
                  <div className="nav-dropdown-menu">
                    <Link to="/admin" className="nav-dropdown-item" onClick={() => setConfigOpen(false)}>
                      Tipus d'Anàlisi
                    </Link>
                    <Link to="/admin/users" className="nav-dropdown-item" onClick={() => setConfigOpen(false)}>
                      Gestió d'Usuaris
                    </Link>
                  </div>
                )}
              </div>
            )}
            <div className="nav-user">
              <a href="#" className="nav-link nav-link-logout" onClick={(e) => { e.preventDefault(); logout() }}>
                Sortir
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
