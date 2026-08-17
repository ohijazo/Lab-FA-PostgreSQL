import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { importarAnalisis, obtenirTipusAdmin } from '../api/admin'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Button from '../components/ui/Button'
import LoadingBlock from '../components/ui/LoadingBlock'
import Icon from '../components/Icon'

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

  if (loadingTipus) return <LoadingBlock label={t('common.carregant')} />
  if (!tipus) return <p>{t('common.tipus_no_trobat')}</p>

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t('admin_import.breadcrumb_tipus'), to: '/admin/tipus' },
          { label: tipus.nom, to: `/admin/tipus/${tipusId}/seccions` },
          { label: t('nav.importar') },
        ]}
      />

      <hgroup>
        <h1>{t('admin_import.titol', { nom: tipus.nom })}</h1>
        <p>{t('admin_import.subtitol')}</p>
      </hgroup>

      {error && (
        <div className="alert alert-danger">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </div>
      )}

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
            <Button
              type="submit"
              variant="primary"
              icon={<Icon name="Upload" size={14} />}
              disabled={!file}
              loading={loading}
            >
              {loading ? t('admin_import.important') : t('admin_import.importar')}
            </Button>
          </fieldset>
        </form>
      )}

      {result && (
        <article>
          <header><strong>{t('admin_import.resultat')}</strong></header>

          <div className="import-result-summary">
            <div className="import-result-stat">
              <strong className="import-result-value import-result-value-primary">{result.importats}</strong>
              <span>{t('admin_import.registres_importats')}</span>
            </div>
            <div className="import-result-stat">
              <strong className="import-result-value import-result-value-muted">{result.saltats}</strong>
              <span>{t('admin_import.duplicats_saltats')}</span>
            </div>
            <div className="import-result-stat">
              <strong className={`import-result-value ${result.errors.length > 0 ? 'import-result-value-danger' : ''}`}>{result.errors.length}</strong>
              <span>{t('admin_import.errors')}</span>
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

          <footer className="import-result-actions">
            <Link to={`/${tipus.slug}`} className="btn btn-primary">
              <Icon name="List" size={14} />
              <span>{t('admin_import.anar_llista')}</span>
            </Link>
            <Button variant="outline" icon={<Icon name="RefreshCw" size={14} />} onClick={() => { setResult(null); setFile(null) }}>
              {t('admin_import.importar_altre')}
            </Button>
          </footer>
        </article>
      )}
    </>
  )
}
