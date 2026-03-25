import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { importarAnalisis, obtenirTipusAdmin } from '../api/admin'
import { useEffect } from 'react'

export default function AdminImportPage() {
  const { tipusId } = useParams()
  const [tipus, setTipus] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingTipus, setLoadingTipus] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    obtenirTipusAdmin(tipusId)
      .then(t => setTipus(t))
      .catch(err => setError(err.message))
      .finally(() => setLoadingTipus(false))
  }, [tipusId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await importarAnalisis(tipusId, file)
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingTipus) return <p aria-busy="true">Carregant...</p>
  if (!tipus) return <p>Tipus no trobat.</p>

  return (
    <>
      <nav aria-label="breadcrumb">
        <ul>
          <li><Link to="/admin">Tipus</Link></li>
          <li><Link to={`/admin/tipus/${tipusId}/seccions`}>{tipus.nom}</Link></li>
          <li>Importar Excel</li>
        </ul>
      </nav>

      <hgroup>
        <h1>Importar Excel - {tipus.nom}</h1>
        <p>Puja un fitxer Excel (.xlsx) amb les dades a importar. Les capçaleres han de coincidir amb els noms o etiquetes dels camps.</p>
      </hgroup>

      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}

      {!result && (
        <form onSubmit={handleSubmit}>
          <fieldset>
            <label>
              Fitxer Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={e => setFile(e.target.files[0])}
                required
              />
            </label>
            <button type="submit" disabled={!file || loading} aria-busy={loading}>
              {loading ? 'Important...' : 'Importar'}
            </button>
          </fieldset>
        </form>
      )}

      {result && (
        <article>
          <header><strong>Resultat de la importació</strong></header>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <div>
              <strong style={{ fontSize: '2rem', color: 'var(--pico-primary)' }}>{result.importats}</strong>
              <br />registres importats
            </div>
            <div>
              <strong style={{ fontSize: '2rem', color: 'var(--pico-secondary)' }}>{result.saltats}</strong>
              <br />duplicats saltats
            </div>
            <div>
              <strong style={{ fontSize: '2rem', color: result.errors.length > 0 ? 'var(--pico-del-color)' : 'inherit' }}>{result.errors.length}</strong>
              <br />errors
            </div>
          </div>

          {result.columnes_reconegudes?.length > 0 && (
            <details open>
              <summary>Columnes reconegudes ({result.columnes_reconegudes.length})</summary>
              <p>{result.columnes_reconegudes.join(', ')}</p>
            </details>
          )}

          {result.columnes_no_reconegudes?.length > 0 && (
            <details>
              <summary>Columnes no reconegudes ({result.columnes_no_reconegudes.length})</summary>
              <p>{result.columnes_no_reconegudes.join(', ')}</p>
            </details>
          )}

          {result.errors.length > 0 && (
            <details open>
              <summary>Detall d'errors</summary>
              <table>
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Motiu</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, i) => (
                    <tr key={i}>
                      <td>{err.fila}</td>
                      <td>{err.motiu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}

          <footer style={{ display: 'flex', gap: '1rem' }}>
            <Link to={`/${tipus.slug}`} role="button">
              Anar a la llista
            </Link>
            <button className="outline" onClick={() => { setResult(null); setFile(null) }}>
              Importar un altre fitxer
            </button>
          </footer>
        </article>
      )}
    </>
  )
}
