import { Link } from 'react-router-dom'

export default function Layout({ children }) {
  return (
    <>
      <nav className="container">
        <ul>
          <li><strong><Link to="/">Lab FA</Link></strong></li>
        </ul>
        <ul>
          <li><Link to="/analisis">Llista</Link></li>
          <li><Link to="/analisis/nou">Nova anàlisi</Link></li>
        </ul>
      </nav>
      <main className="container">
        {children}
      </main>
    </>
  )
}
