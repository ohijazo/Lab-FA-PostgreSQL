import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import i18n from '../i18n/index.js'
import { obtenirAnalisi, eliminarAnalisi, obtenirConfig, enviarEmail, obtenirEmailsAnalisi, marcarFinalitzat, marcarAlerta, marcarApte } from '../api/analisis'
import useShortcut from '../hooks/useShortcut'
import Skeleton from '../components/ui/Skeleton'
import AnalisisDetail from '../components/AnalisisDetail'
import AdjuntsGaleria from '../components/AdjuntsGaleria'
import { llistarAdjunts } from '../api/adjunts'
import Icon from '../components/Icon'
import QRCode from '../components/QRCode'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import LoadingBlock from '../components/ui/LoadingBlock'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
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
  const confirm = useConfirm()
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
  const [emailImatges, setEmailImatges] = useState([])   // imatges que es poden adjuntar
  const [emailAdjunts, setEmailAdjunts] = useState([])   // ids triats
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
    const codi = analisi?.codi || `#${analisi?.id ?? ''}`
    const ok = await confirm({
      title: t('common.eliminar'),
      message: <Trans i18nKey="detall.confirm_eliminar" values={{ codi }} components={{ 1: <strong /> }} />,
      confirmLabel: t('common.eliminar'),
      cancelLabel: t('common.cancellar'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await eliminarAnalisi(tipus, id)
      addToast(t('detall.analisi_eliminada'))
      navigate(`/${tipus}`)
    } catch (err) {
      setError(err.message)
    }
  }

  const [togglingFinalitzat, setTogglingFinalitzat] = useState(false)

  // Shortcut: 'e' obre edició (només editors)
  useShortcut(['e', 'E'], () => { if (!isViewer) navigate(`/${tipus}/${id}/editar`) })
  // Shortcut: 'n' crea un nou anàlisi (només editors)
  useShortcut(['n', 'N'], () => { if (!isViewer) navigate(`/${tipus}/nou`) })

  async function handleToggleFinalitzat() {
    if (togglingFinalitzat) return
    const nou = !analisi.finalitzat
    setTogglingFinalitzat(true)
    try {
      const updated = await marcarFinalitzat(tipus, id, nou)
      setAnalisi(updated)
      addToast(nou ? t('detall.marcat_finalitzat') : t('detall.marcat_pendent'))
    } catch (err) {
      setError(err.message)
    } finally {
      setTogglingFinalitzat(false)
    }
  }

  const [alertaOpen, setAlertaOpen] = useState(false)
  const [alertaForm, setAlertaForm] = useState({ alerta: false, motiu: '' })
  const [savingAlerta, setSavingAlerta] = useState(false)
  const [alertaError, setAlertaError] = useState('')

  function openAlertaModal() {
    setAlertaError('')
    setAlertaForm({ alerta: !!analisi.alerta, motiu: analisi.alerta_motiu || '' })
    setAlertaOpen(true)
  }

  function closeAlertaModal() {
    setAlertaOpen(false)
  }

  async function handleSaveAlerta(e) {
    e.preventDefault()
    setSavingAlerta(true)
    setAlertaError('')
    try {
      const updated = await marcarAlerta(tipus, id, alertaForm.alerta, alertaForm.motiu)
      setAnalisi(updated)
      closeAlertaModal()
      addToast(updated.alerta ? t('detall.alerta_activada') : t('detall.alerta_desactivada'))
    } catch (err) {
      setAlertaError(err.message)
    } finally {
      setSavingAlerta(false)
    }
  }

  const [togglingApte, setTogglingApte] = useState(false)

  async function handleToggleApte() {
    if (togglingApte) return
    const actual = analisi.apte || null
    const seguent = actual === null ? 'apte' : actual === 'apte' ? 'no_apte' : null
    setTogglingApte(true)
    try {
      const updated = await marcarApte(tipus, id, seguent)
      setAnalisi(updated)
      addToast(t(`detall.marcat_${seguent || 'pendent_apte'}`))
    } catch (err) {
      setError(err.message)
    } finally {
      setTogglingApte(false)
    }
  }

  function openEmailModal() {
    let tv = titleField ? (analisi[titleField] || `#${analisi.id}`) : `#${analisi.id}`
    tv = formatDate(tv) || tv
    setEmailDestinatari('')
    setEmailAssumpte(`${config.nom} - ${tv}`)
    setEmailError('')
    setEmailModalOpen(true)
    // Només imatges: els vídeos no s'adjunten mai al correu (mida)
    llistarAdjunts(tipus, id)
      .then((res) => setEmailImatges(res.filter((a) => a.kind === 'image')))
      .catch(() => setEmailImatges([]))
    setEmailAdjunts([])
  }

  async function handleSendEmail(e) {
    e.preventDefault()
    setEmailSending(true)
    setEmailError('')
    try {
      await enviarEmail(tipus, id, emailDestinatari, emailAssumpte, emailAdjunts)
      setEmailModalOpen(false)
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
  }

  if (loading) return (
    <div className="detall-skeleton">
      <div className="detall-skeleton-header">
        <Skeleton width="40%" height="1.75rem" />
        <div className="detall-skeleton-badges">
          <Skeleton width="90px" height="1.6rem" radius="999px" />
          <Skeleton width="90px" height="1.6rem" radius="999px" />
          <Skeleton width="110px" height="1.6rem" radius="999px" />
        </div>
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className="detall-skeleton-section">
          <Skeleton width="25%" height="1.1rem" />
          <div className="detall-skeleton-fields">
            {[0, 1, 2, 3, 4, 5].map(j => (
              <div key={j} className="detall-skeleton-field">
                <Skeleton width="60%" height="0.75rem" />
                <Skeleton height="1.4rem" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
  if (error) return (
    <div className="alert alert-danger">
      <Icon name="AlertCircle" size={14} />
      <span>{error}</span>
    </div>
  )
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
      <Breadcrumbs
        className="no-print"
        items={[
          { label: t('nav.inici'), to: '/' },
          { label: config.nom, to: `/${tipus}` },
          { label: String(titleValue) },
        ]}
      />
      <div className="detall-toolbar no-print">
        <div className="detall-toolbar-info">
          <h2>
            Anàlisi {titleValue}{' '}
            {isViewer ? (
              <span className={`estat-badge ${analisi.finalitzat ? 'estat-finalitzat' : 'estat-pendent'}`}>
                {analisi.finalitzat ? <><Icon name="Check" size={12} /> {t('detall.finalitzat')}</> : t('detall.pendent')}
              </span>
            ) : (
              <button
                type="button"
                className={`estat-badge ${analisi.finalitzat ? 'estat-finalitzat' : 'estat-pendent'}`}
                onClick={handleToggleFinalitzat}
                disabled={togglingFinalitzat}
                title={analisi.finalitzat ? t('detall.marcar_pendent') : t('detall.marcar_finalitzat')}
              >
                {analisi.finalitzat ? <><Icon name="Check" size={12} /> {t('detall.finalitzat')}</> : t('detall.pendent')}
              </button>
            )}
            {isViewer ? (
              analisi.alerta && (
                <span
                  className="estat-badge estat-alerta"
                  title={analisi.alerta_motiu || t('detall.alerta')}
                >
                  <Icon name="AlertTriangle" size={12} /> {t('detall.alerta')}
                </span>
              )
            ) : (
              <button
                type="button"
                className={`estat-badge ${analisi.alerta ? 'estat-alerta' : 'estat-sense-alerta'}`}
                onClick={openAlertaModal}
                title={analisi.alerta ? (analisi.alerta_motiu || t('detall.alerta')) : t('detall.afegir_alerta')}
              >
                {analisi.alerta
                  ? <><Icon name="AlertTriangle" size={12} /> {t('detall.alerta')}</>
                  : <><Icon name="Plus" size={12} /> {t('detall.alerta')}</>}
              </button>
            )}
            {isViewer ? (
              <span className={`estat-badge estat-apte-${analisi.apte || 'pendent'}`}>
                {analisi.apte === 'apte' ? <><Icon name="Check" size={12} /> {t('detall.apte')}</>
                  : analisi.apte === 'no_apte' ? <><Icon name="X" size={12} /> {t('detall.no_apte')}</>
                  : <><Icon name="HelpCircle" size={12} /> {t('detall.pendent_apte')}</>}
              </span>
            ) : (
              <button
                type="button"
                className={`estat-badge estat-apte-${analisi.apte || 'pendent'}`}
                onClick={handleToggleApte}
                disabled={togglingApte}
                title={t('detall.canviar_apte')}
              >
                {analisi.apte === 'apte' ? <><Icon name="Check" size={12} /> {t('detall.apte')}</>
                  : analisi.apte === 'no_apte' ? <><Icon name="X" size={12} /> {t('detall.no_apte')}</>
                  : <><Icon name="HelpCircle" size={12} /> {t('detall.pendent_apte')}</>}
              </button>
            )}
          </h2>
          {(analisi.created_by || analisi.updated_by) && (
            <div className="detall-toolbar-meta">
              {analisi.created_by && <span>{t('detall.creat_per', { nom: analisi.created_by })}</span>}
              {analisi.created_by && analisi.updated_by && analisi.updated_by !== analisi.created_by && ' | '}
              {analisi.updated_by && analisi.updated_by !== analisi.created_by && (
                <span>{t('detall.modificat_per', { nom: analisi.updated_by })}</span>
              )}
            </div>
          )}
        </div>
        <div className="detall-toolbar-actions">
          {!isViewer && (
            <Button variant="outline" size="sm" icon={<Icon name="Plus" size={12} />} onClick={() => navigate(`/${tipus}/nou`)}>
              {t('llista.nou_analisi')}
            </Button>
          )}
          <Button variant="ghost" size="sm" icon={<Icon name="ArrowLeft" size={12} />} onClick={() => navigate(`/${tipus}`)}>
            {t('detall.tornar_llista')}
          </Button>
          {!isViewer && (
            <>
              <Link to={`/${tipus}/${id}/editar`} className="btn btn-primary btn-sm">
                <Icon name="Pencil" size={12} />
                <span>{t('common.editar')}</span>
              </Link>
              <Button
                variant="outline"
                size="sm"
                icon={<Icon name="Copy" size={12} />}
                onClick={() => {
                  const { id: _id, created_at, updated_at, created_by, updated_by, tipus: _t, ...dades } = analisi
                  navigate(`/${tipus}/nou`, { state: { duplicatDe: dades } })
                }}
              >
                {t('common.duplicar')}
              </Button>
              <Button variant="danger" size="sm" icon={<Icon name="Trash2" size={12} />} onClick={handleDelete}>
                {t('common.eliminar')}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" icon={<Icon name="Printer" size={12} />} onClick={() => window.print()}>
            {t('detall.imprimir')}
          </Button>
          {user?.email_configurat && (
            <Button variant="outline" size="sm" icon={<Icon name="Mail" size={12} />} onClick={openEmailModal}>
              {t('detall.enviar_email')}
            </Button>
          )}
        </div>
      </div>
      <AnalisisDetail seccions={config.seccions} analisi={analisi} tipusConfig={config} />
      <AdjuntsGaleria tipus={tipus} id={id} readOnly={isViewer} />
      {!isViewer && (
        <div className="detall-valoracio no-print">
          <h3 className="detall-valoracio-title">{t('detall.valoracio_titol')}</h3>
          <div className="detall-valoracio-buttons">
            <button
              type="button"
              className={`detall-valoracio-btn is-finalitzat-${analisi.finalitzat ? 'on' : 'off'}`}
              onClick={handleToggleFinalitzat}
              disabled={togglingFinalitzat}
              title={analisi.finalitzat ? t('detall.marcar_pendent') : t('detall.marcar_finalitzat')}
            >
              <Icon name={analisi.finalitzat ? 'Check' : 'Circle'} size={22} />
              <span className="detall-valoracio-btn-label">
                {analisi.finalitzat ? t('detall.finalitzat') : t('detall.pendent')}
              </span>
            </button>
            <button
              type="button"
              className={`detall-valoracio-btn is-alerta-${analisi.alerta ? 'on' : 'off'}`}
              onClick={openAlertaModal}
              title={analisi.alerta ? (analisi.alerta_motiu || t('detall.alerta')) : t('detall.afegir_alerta')}
            >
              <Icon name={analisi.alerta ? 'AlertTriangle' : 'Plus'} size={22} />
              <span className="detall-valoracio-btn-label">
                {analisi.alerta ? t('detall.alerta') : t('detall.afegir_alerta')}
              </span>
            </button>
            <button
              type="button"
              className={`detall-valoracio-btn is-apte-${analisi.apte || 'pendent'}`}
              onClick={handleToggleApte}
              disabled={togglingApte}
              title={t('detall.canviar_apte')}
            >
              <Icon
                name={analisi.apte === 'apte' ? 'Check' : analisi.apte === 'no_apte' ? 'X' : 'HelpCircle'}
                size={22}
              />
              <span className="detall-valoracio-btn-label">
                {analisi.apte === 'apte'
                  ? t('detall.apte')
                  : analisi.apte === 'no_apte'
                    ? t('detall.no_apte')
                    : t('detall.pendent_apte')}
              </span>
            </button>
          </div>
        </div>
      )}
      {emailLogs.length > 0 && (
        <details className="no-print detall-email-history">
          <summary><strong>{t('detall.historial_enviaments')}</strong> ({emailLogs.length})</summary>
          <table className="detall-email-history-table">
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
      <Modal
        open={alertaOpen}
        onClose={closeAlertaModal}
        title={t('detall.alerta_titol')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={closeAlertaModal} disabled={savingAlerta}>
              {t('common.cancellar')}
            </Button>
            <Button variant="primary" type="submit" form="alerta-form" loading={savingAlerta}>
              {t('common.desar_canvis')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveAlerta} id="alerta-form">
          <label>
            <input
              type="checkbox"
              role="switch"
              checked={alertaForm.alerta}
              onChange={(e) => setAlertaForm((f) => ({ ...f, alerta: e.target.checked }))}
            />
            {t('detall.alerta_activa')}
          </label>
          {alertaForm.alerta && (
            <label>
              {t('detall.alerta_motiu')}
              <textarea
                value={alertaForm.motiu}
                onChange={(e) => setAlertaForm((f) => ({ ...f, motiu: e.target.value }))}
                rows={3}
                maxLength={500}
                placeholder={t('detall.alerta_motiu_placeholder')}
                autoFocus
              />
            </label>
          )}
          {alertaError && <p className="form-error-text">{alertaError}</p>}
        </form>
      </Modal>

      <Modal
        open={emailModalOpen}
        onClose={closeEmailModal}
        title={t('detall.enviar_email')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={closeEmailModal}>{t('common.cancellar')}</Button>
            <Button
              variant="primary"
              type="submit"
              form="email-form"
              icon={<Icon name="Mail" size={14} />}
              loading={emailSending}
            >
              {emailSending ? t('detall.enviant') : t('detall.enviar')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSendEmail} id="email-form">
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
          {emailImatges.length > 0 && (
            <fieldset className="email-adjunts">
              <legend>{t('detall.email_adjuntar')}</legend>
              {emailImatges.map((a) => (
                <label key={a.id} className="email-adjunt-item">
                  <input
                    type="checkbox"
                    checked={emailAdjunts.includes(a.id)}
                    onChange={(e) => setEmailAdjunts((prev) =>
                      e.target.checked ? [...prev, a.id] : prev.filter((x) => x !== a.id)
                    )}
                  />
                  <span>{a.nom}</span>
                </label>
              ))}
            </fieldset>
          )}
          {emailError && <p className="form-error-text">{emailError}</p>}
        </form>
      </Modal>
    </>
  )
}
