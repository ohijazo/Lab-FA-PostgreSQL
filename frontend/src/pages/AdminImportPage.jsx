import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { importarAnalisis, obtenirTipusAdmin } from '../api/admin'

export default function AdminImportPage() {
  const { t } = useTranslation()
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

  if (loadingTipus) return <p aria-busy="true">{t('common.carregant')}</p>
  if (!tipus) return <p>{t('common.tipus_no_trobat')}</p>

  return (
    <>
      <nav aria-label="breadcrumb">
        <ul>
          <li><Link to="/admin/tipus">{t('admin_import.breadcrumb_tipus')}</Link></li>
          <li><Link to={`/admin/tipus/${tipusId}/seccions`}>{tipus.nom}</Link></li>
          <li>{t('admin_import.breadcrumb_importar')}</li>
        </ul>
      </nav>

      <hgroup>
        <h1>{t('admin_import.titol', { nom: tipus.nom })}</h1>
        <p>{t('admin_import.subtitol')}</p>
      </hgroup>

      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}

      {!result && (
        <form onSubmit={handleSubmit}>
          <fieldset>
            <label>
              {t('admin_import.fitxer_excel')}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={e => setFile(e.target.files[0])}
                required
              />
            </label>
            <button type="submit" disabled={!file || loading} aria-busy={loading}>
              {loading ? t('admin_import.important') : t('admin_import.importar')}
            </button>
          </fieldset>
        </form>
      )}

      {result && (
        <article>
          <header><strong>{t('admin_import.resultat')}</strong></header>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <div>
              <strong style={{ fontSize: '2rem', color: 'var(--pico-primary)' }}>{result.importats}</strong>
              <br />{t('admin_import.registres_importats')}
            </div>
            <div>
              <strong style={{ fontSize: '2rem', color: 'var(--pico-secondary)' }}>{result.saltats}</strong>
              <br />{t('admin_import.duplicats_saltats')}
            </div>
            <div>
              <strong style={{ fontSize: '2rem', color: result.errors.length > 0 ? 'var(--pico-del-color)' : 'inherit' }}>{result.errors.length}</strong>
              <br />{t('admin_import.errors')}
            </div>
          </div>

          {result.columnes_reconegudes?.length > 0 && (
            <details open>
              <summary>{t('admin_import.columnes_reconegudes', { count: result.columnes_reconegudes.length })}</summary>
              <p>{result.columnes_reconegudes.join(', ')}</p>
            </details>
          )}

          {result.columnes_no_reconegudes?.length > 0 && (
            <details>
              <summary>{t('admin_import.columnes_no_reconegudes', { count: result.columnes_no_reconegudes.length })}</summary>
              <p>{result.columnes_no_reconegudes.join(', ')}</p>
            </details>
          )}

          {result.errors.length > 0 && (
            <details open>
              <summary>{t('admin_import.detall_errors')}</summary>
              <table>
                <thead>
                  <tr>
                    <th>{t('admin_import.fila')}</th>
                    <th>{t('admin_import.motiu')}</th>
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
              {t('admin_import.anar_llista')}
            </Link>
            <button className="outline" onClick={() => { setResult(null); setFile(null) }}>
              {t('admin_import.importar_altre')}
            </button>
          </footer>
        </article>
      )}
    </>
  )
}
