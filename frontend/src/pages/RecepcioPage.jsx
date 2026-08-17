import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/index.js'
import { llistarAnalisisRecepcio } from '../api/analisis'
import Icon from '../components/Icon'
import LoadingBlock from '../components/ui/LoadingBlock'
import EmptyState from '../components/ui/EmptyState'

function formatHora(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString(i18n.language === 'es' ? 'es-ES' : 'ca-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatValue(camp, val) {
  if (val === null || val === undefined || val === '') return ''
  if (camp.type === 'date' && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    const [y, m, d] = val.split('-')
    return `${d}/${m}/${y}`
  }
  if (camp.type === 'checkbox') return val ? '✓' : '—'
  return String(val)
}

function stateInfo(apte, t) {
  if (apte === 'apte') return { cls: 'apte', icon: 'Check', label: t('detall.apte') }
  if (apte === 'no_apte') return { cls: 'no_apte', icon: 'X', label: t('detall.no_apte') }
  return { cls: 'pendent', icon: 'HelpCircle', label: t('detall.pendent_apte') }
}

export default function RecepcioPage() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await llistarAnalisisRecepcio(q)
      setData(res)
      setError(null)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const id = setInterval(fetchData, 30000)
    return () => clearInterval(id)
  }, [fetchData])

  return (
    <div className="recepcio-page">
      <div className="recepcio-header">
        <hgroup>
          <h1>{t('recepcio.titol')}</h1>
          <p>{t('recepcio.subtitol')}</p>
        </hgroup>
        {lastUpdate && (
          <span className="recepcio-updated">
            <Icon name="RefreshCw" size={14} />
            {t('recepcio.actualitzat', { hora: formatHora(lastUpdate.toISOString()) })}
          </span>
        )}
      </div>

      <div className="recepcio-search-wrap">
        <Icon name="Search" size={16} className="recepcio-search-icon" />
        <input
          type="search"
          className="recepcio-search"
          placeholder={t('recepcio.cercar_codi')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>

      {error && (
        <div className="alert alert-danger">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </div>
      )}

      {loading && data.length === 0 ? (
        <LoadingBlock label={t('common.carregant')} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Icon name="Inbox" size={40} />}
          title={t('recepcio.cap_analisi')}
          description={t('recepcio.cap_analisi_desc')}
        />
      ) : (
        <div className="recepcio-list">
          {data.map((a) => {
            const s = stateInfo(a.apte, t)
            const identif = a.identificacio || []
            return (
              <div key={a.id} className={`recepcio-card recepcio-card-${s.cls}`}>
                <div className="recepcio-card-info">
                  <div className="recepcio-card-codi">
                    {a.codi || `#${a.id}`}
                  </div>
                  <div className="recepcio-card-meta">
                    <span>{a.tipus_nom}</span>
                    <span className="recepcio-card-sep">·</span>
                    <span>{formatHora(a.created_at)}</span>
                  </div>
                  {identif.length > 0 && (
                    <div className="recepcio-card-identif">
                      {identif.map((c) => (
                        <div key={c.name} className="recepcio-card-identif-item">
                          <span className="recepcio-card-identif-label">{c.label}:</span>
                          <span className="recepcio-card-identif-value">{formatValue(c, c.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`recepcio-badge-gran is-${s.cls}`}>
                  <Icon name={s.icon} size={22} />
                  <span>{s.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
