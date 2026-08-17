import { useEffect, useState, useCallback, useMemo } from 'react'
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

function statusCls(apte) {
  if (apte === 'apte') return 'apte'
  if (apte === 'no_apte') return 'no_apte'
  return 'pendent'
}

function StatusBadge({ apte, t }) {
  const cls = statusCls(apte)
  const icon = apte === 'apte' ? 'Check' : apte === 'no_apte' ? 'X' : 'HelpCircle'
  const label = apte === 'apte' ? t('detall.apte') : apte === 'no_apte' ? t('detall.no_apte') : t('detall.pendent_apte')
  return (
    <span className={`recepcio-badge is-${cls}`}>
      <Icon name={icon} size={14} />
      <span>{label}</span>
    </span>
  )
}

export default function RecepcioPage() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [expanded, setExpanded] = useState(() => new Set())

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

  function toggleExpanded(id) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const counts = useMemo(() => ({
    all: data.length,
    pendent: data.filter((a) => !a.apte).length,
    apte: data.filter((a) => a.apte === 'apte').length,
    no_apte: data.filter((a) => a.apte === 'no_apte').length,
  }), [data])

  const filtered = useMemo(() => {
    if (activeTab === 'pendent') return data.filter((a) => !a.apte)
    if (activeTab === 'apte') return data.filter((a) => a.apte === 'apte')
    if (activeTab === 'no_apte') return data.filter((a) => a.apte === 'no_apte')
    return data
  }, [data, activeTab])

  const tabs = [
    { key: 'all', label: t('recepcio.tab_tots'), count: counts.all },
    { key: 'pendent', label: t('detall.pendent_apte'), count: counts.pendent },
    { key: 'apte', label: t('detall.apte'), count: counts.apte },
    { key: 'no_apte', label: t('detall.no_apte'), count: counts.no_apte },
  ]

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

      <div className="recepcio-toolbar">
        <div className="recepcio-search-wrap">
          <Icon name="Search" size={16} className="recepcio-search-icon" />
          <input
            type="search"
            className="recepcio-search"
            placeholder={t('recepcio.cercar_placeholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>
        <div className="recepcio-tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`recepcio-tab is-${tab.key}${activeTab === tab.key ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="recepcio-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </div>
      )}

      {loading && data.length === 0 ? (
        <LoadingBlock label={t('common.carregant')} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Icon name="Inbox" size={40} />}
          title={data.length === 0 ? t('recepcio.cap_analisi') : t('recepcio.cap_amb_filtre')}
          description={data.length === 0 ? t('recepcio.cap_analisi_desc') : t('recepcio.cap_amb_filtre_desc')}
        />
      ) : (
        <ul className="recepcio-rows">
          {filtered.map((a) => {
            const cls = statusCls(a.apte)
            const isOpen = expanded.has(a.id)
            const hasIdentif = (a.identificacio || []).length > 0
            return (
              <li key={a.id} className={`recepcio-row-item is-${cls}${isOpen ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="recepcio-row"
                  onClick={() => hasIdentif && toggleExpanded(a.id)}
                  aria-expanded={hasIdentif ? isOpen : undefined}
                  disabled={!hasIdentif}
                >
                  <span className="recepcio-row-chevron" aria-hidden="true">
                    {hasIdentif ? <Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={14} /> : <span style={{ display: 'inline-block', width: 14 }} />}
                  </span>
                  <span className="recepcio-row-codi">{a.codi || `#${a.id}`}</span>
                  <span className="recepcio-row-proveidor" title={a.proveidor}>{a.proveidor || '—'}</span>
                  <span className="recepcio-row-tiquet">{a.num_tiquet ? `#${a.num_tiquet}` : ''}</span>
                  <span className="recepcio-row-tipus">{a.tipus_nom}</span>
                  <span className="recepcio-row-hora">{formatHora(a.created_at)}</span>
                  <span className="recepcio-row-badge">
                    <StatusBadge apte={a.apte} t={t} />
                  </span>
                </button>
                {isOpen && hasIdentif && (
                  <div className="recepcio-row-detall">
                    {a.identificacio.map((c) => (
                      <div key={c.name} className="recepcio-row-detall-item">
                        <span className="recepcio-row-detall-label">{c.label}:</span>
                        <span className="recepcio-row-detall-value">{formatValue(c, c.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
