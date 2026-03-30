import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/index.js'
import { obtenirAnalisi, eliminarAnalisi, obtenirConfig, enviarEmail, obtenirEmailsAnalisi } from '../api/analisis'
import AnalisisDetail from '../components/AnalisisDetail'
import QRCode from '../components/QRCode'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import logoApp from '../logos/logoApp.png'

function formatDate(val) {
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    const [y, m, d] = val.split('-')
    return `${d}-${m}-${y}`
  }
  return val || ''
}

function buildFieldMap(seccions) {
  const map = {}
  for (const s of seccions) {
    for (const c of s.camps) {
      map[c.name] = c
    }
  }
  return map
}

function formatSummaryValue(camp, val) {
  if (val === null || val === undefined || val === '') return '—'
  if (camp?.type === 'date') return formatDate(val)
  return String(val)
}

export default function DetallPage() {
  const { t } = useTranslation()
  const { tipus, id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { user } = useAuth()
  const isViewer = user?.role === 'viewer'
  const [config, setConfig] = useState(null)
  const [analisi, setAnalisi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailDestinatari, setEmailDestinatari] = useState('')
  const [emailAssumpte, setEmailAssumpte] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailLogs, setEmailLogs] = useState([])

  useEffect(() => {
    Promise.all([obtenirConfig(tipus), obtenirAnalisi(tipus, id)])
      .then(([cfg, data]) => {
        setConfig(cfg)
        setAnalisi(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    obtenirEmailsAnalisi(tipus, id).then(setEmailLogs)
  }, [tipus, id])

  const { titleField, metaFields, fieldMap } = useMemo(() => {
    if (!config) return { titleField: null, metaFields: [], fieldMap: {} }
    const fm = buildFieldMap(config.seccions)
    const cols = config.columnes_llista || []
    return {
      titleField: cols[0] || null,
      metaFields: cols.slice(1),
      fieldMap: fm,
    }
  }, [config])

  async function handleDelete() {
    if (!confirm(t('detall.confirm_eliminar'))) return
    try {
      await eliminarAnalisi(tipus, id)
      addToast(t('detall.analisi_eliminada'))
      navigate(`/${tipus}`)
    } catch (err) {
      setError(err.message)
    }
  }

  const emailDialogRef = useRef(null)

  function openEmailModal() {
    let tv = titleField ? (analisi[titleField] || `#${analisi.id}`) : `#${analisi.id}`
    tv = formatDate(tv) || tv
    setEmailDestinatari('')
    setEmailAssumpte(`${config.nom} - ${tv}`)
    setEmailError('')
    setEmailModalOpen(true)
  }

  useEffect(() => {
    if (emailModalOpen && emailDialogRef.current) {
      emailDialogRef.current.showModal()
    }
  }, [emailModalOpen])

  async function handleSendEmail(e) {
    e.preventDefault()
    setEmailSending(true)
    setEmailError('')
    try {
      await enviarEmail(tipus, id, emailDestinatari, emailAssumpte)
      setEmailModalOpen(false)
      emailDialogRef.current?.close()
      addToast(t('detall.email_enviat'))
      obtenirEmailsAnalisi(tipus, id).then(setEmailLogs)
    } catch (err) {
      setEmailError(err.message)
    } finally {
      setEmailSending(false)
    }
  }

  function closeEmailModal() {
    setEmailModalOpen(false)
    emailDialogRef.current?.close()
  }

  if (loading) return <p aria-busy="true">{t('common.carregant')}</p>
  if (error) return <p>Error: {error}</p>
  if (!analisi) return <p>{t('common.no_trobat')}</p>

  const titleValue = titleField ? (analisi[titleField] || `#${analisi.id}`) : `#${analisi.id}`
  const metaItems = metaFields
    .map((name) => formatSummaryValue(fieldMap[name], analisi[name]))
    .filter((v) => v !== '—')

  const dateLocale = i18n.language === 'es' ? 'es-ES' : 'ca-ES'

  return (
    <>
      <div className="print-header">
        <div className="print-header-brand">
          <img src={logoApp} alt="Lab FC" className="print-logo" />
          <div>
            <h1 className="print-title">{config.nom}</h1>
            <p className="print-subtitle">{t('detall.informe_analisi')}</p>
          </div>
        </div>
        <div className="print-meta-grid">
          {[titleField, ...metaFields].filter(Boolean).map((name) => (
            <div key={name} className="print-meta-item">
              <span className="print-meta-label">{fieldMap[name]?.label || name}</span>
              <span className="print-meta-value">{formatSummaryValue(fieldMap[name], analisi[name])}</span>
            </div>
          ))}
        </div>
        {analisi.codi && (
          <div className="print-qr">
            <QRCode value={String(analisi.codi)} size={100} />
          </div>
        )}
      </div>
      <div className="detall-toolbar no-print">
        <div className="detall-toolbar-info">
          <h2>Anàlisi {titleValue}</h2>
          {metaItems.length > 0 && (
            <span className="detall-toolbar-meta">{metaItems.join(' — ')}</span>
          )}
          {(analisi.created_by || analisi.updated_by) && (
            <div style={{ fontSize: '0.85em', marginTop: '0.25rem', color: 'var(--pico-muted-color)' }}>
              {analisi.created_by && <span>{t('detall.creat_per', { nom: analisi.created_by })}</span>}
              {analisi.created_by && analisi.updated_by && analisi.updated_by !== analisi.created_by && ' | '}
              {analisi.updated_by && analisi.updated_by !== analisi.created_by && (
                <span>{t('detall.modificat_per', { nom: analisi.updated_by })}</span>
              )}
            </div>
          )}
        </div>
        <div className="detall-toolbar-actions">
          <button className="outline contrast" onClick={() => navigate(`/${tipus}`)}>{t('detall.tornar_llista')}</button>
          {!isViewer && (
            <>
              <Link to={`/${tipus}/${id}/editar`} role="button" className="outline">{t('common.editar')}</Link>
              <button className="outline" onClick={() => {
                const { id: _id, created_at, updated_at, created_by, updated_by, tipus: _t, ...dades } = analisi
                navigate(`/${tipus}/nou`, { state: { duplicatDe: dades } })
              }}>{t('common.duplicar')}</button>
              <button className="outline secondary" onClick={handleDelete}>{t('common.eliminar')}</button>
            </>
          )}
          <button className="outline contrast" onClick={() => window.print()}>{t('detall.imprimir')}</button>
          {user?.email_configurat && (
            <button className="outline contrast" onClick={openEmailModal}>{t('detall.enviar_email')}</button>
          )}
        </div>
      </div>
      <AnalisisDetail seccions={config.seccions} analisi={analisi} />
      {emailLogs.length > 0 && (
        <details className="no-print" style={{ marginTop: '1.5rem' }}>
          <summary><strong>{t('detall.historial_enviaments')}</strong> ({emailLogs.length})</summary>
          <table style={{ marginTop: '0.5rem' }}>
            <thead>
              <tr>
                <th>{t('detall.enviat_a')}</th>
                <th>{t('detall.assumpte')}</th>
                <th>{t('detall.enviat_per')}</th>
                <th>{t('detall.data_enviament')}</th>
              </tr>
            </thead>
            <tbody>
              {emailLogs.map(log => (
                <tr key={log.id}>
                  <td>{log.destinatari}</td>
                  <td>{log.assumpte}</td>
                  <td>{log.enviat_per}</td>
                  <td>{log.enviat_at ? new Date(log.enviat_at).toLocaleString(dateLocale) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
      {emailModalOpen && (
        <dialog ref={emailDialogRef} onClose={closeEmailModal}>
          <article style={{ minWidth: '350px' }}>
            <header>
              <button aria-label="Close" rel="prev" onClick={closeEmailModal}></button>
              <h3>{t('detall.enviar_email')}</h3>
            </header>
            <form onSubmit={handleSendEmail}>
              <label>
                {t('detall.destinatari')}
                <input
                  type="email"
                  required
                  value={emailDestinatari}
                  onChange={e => setEmailDestinatari(e.target.value)}
                  placeholder="email@exemple.com"
                  autoFocus
                />
              </label>
              <label>
                {t('detall.assumpte')}
                <input
                  type="text"
                  value={emailAssumpte}
                  onChange={e => setEmailAssumpte(e.target.value)}
                />
              </label>
              {emailError && <p style={{ color: 'var(--pico-del-color, red)', fontSize: '0.9em' }}>{emailError}</p>}
              <footer style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="outline secondary" onClick={closeEmailModal}>{t('common.cancellar')}</button>
                <button type="submit" disabled={emailSending} aria-busy={emailSending}>
                  {emailSending ? t('detall.enviant') : t('detall.enviar')}
                </button>
              </footer>
            </form>
          </article>
        </dialog>
      )}
    </>
  )
}
