import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { llistarTipus } from '../api/analisis'

export default function HomePage() {
  const [tipus, setTipus] = useState([])
  const [loading, setLoading] = useState(true)
  const [cerca, setCerca] = useState('')

  useEffect(() => {
    llistarTipus()
      .then(setTipus)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtrats = tipus.filter((t) => {
    const q = cerca.toLowerCase()
    return t.nom.toLowerCase().includes(q) || (t.descripcio || '').toLowerCase().includes(q)
  })

  if (loading) return <p aria-busy="true">Carregant...</p>

  return (
    <>
      <h1>Lab FA</h1>
      <p>Gestio d'analisis de laboratori</p>
      <input
        type="search"
        placeholder="Cercar tipus d'anàlisi..."
        value={cerca}
        onChange={(e) => setCerca(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Descripció</th>
            <th>Accions</th>
          </tr>
        </thead>
        <tbody>
          {filtrats.map((t) => (
            <tr key={t.slug}>
              <td><strong>{t.nom}</strong></td>
              <td>{t.descripcio}</td>
              <td>
                <div className="grid" style={{ gap: '0.5rem' }}>
                  <Link to={`/${t.slug}/nou`} role="button" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85em' }}>Nou anàlisi</Link>
                  <Link to={`/${t.slug}`} role="button" className="outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85em' }}>Veure llista</Link>
                  <Link to={`/dashboard/${t.slug}`} role="button" className="secondary outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85em' }}>Dashboard</Link>
                </div>
              </td>
            </tr>
          ))}
          {filtrats.length === 0 && (
            <tr><td colSpan={3}>Cap resultat trobat.</td></tr>
          )}
        </tbody>
      </table>
    </>
  )
}
