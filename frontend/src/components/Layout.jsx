import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <>
      <nav className="container nav-sticky">
        <ul>
          <li><strong><Link to="/">Lab FA</Link></strong></li>
        </ul>
        <ul>
          {user?.role === 'admin' && (
            <li><Link to="/admin" role="button" className="outline">Configuracio</Link></li>
          )}
          <li>
            <span style={{ fontSize: '0.85em', marginRight: 8 }}>{user?.nom || user?.email}</span>
            <a href="#" role="button" className="outline secondary" onClick={(e) => { e.preventDefault(); logout() }}>
              Sortir
            </a>
          </li>
        </ul>
      </nav>
      <main className="container">
        {children}
      </main>
    </>
  )
}
