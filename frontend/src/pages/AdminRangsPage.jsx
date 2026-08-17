import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { obtenirTipusAdmin, editarCamp } from '../api/admin'
import { useToast } from '../context/ToastContext'

export default function AdminRangsPage() {
  const { t } = useTranslation()
  const { tipusId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [tipus, setTipus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [rangs, setRangs] = useState({})

  async function fetchData() {
    setLoading(true)
    try {
      const tipusData = await obtenirTipusAdmin(tipusId)
      setTipus(tipusData)
      const inicial = {}
      for (const s of tipusData.seccions || []) {
        for (const c of s.camps || []) {
          if (c.type === 'number' && c.name !== tipusData.camp_controlador) {
            inicial[c.id] = c.rangs_condicionals || {}
          }
        }
      }
      setRangs(inicial)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [tipusId])

  if (loading) return <p aria-busy="true">{t('common.carregant')}</p>
  if (!tipus) return <p>{t('common.tipus_no_trobat')}</p>

  const controladorCamp = (() => {
    if (!tipus.camp_controlador) return null
    for (const s of tipus.seccions || []) {
      for (const c of s.camps || []) {
        if (c.name === tipus.camp_controlador) return c
      }
    }
    return null
  })()

  if (!controladorCamp) {
    return (
      <>
        <nav aria-label="breadcrumb">
          <ul>
            <li><Link to="/admin/tipus">{t('admin_seccions.breadcrumb_tipus')}</Link></li>
            <li><Link to="#" onClick={(e) => { e.preventDefault(); navigate(-1) }}>{tipus.nom}</Link></li>
            <li>{t('admin_rangs.titol', 'Taula de rangs')}</li>
          </ul>
        </nav>
        <h1>{t('admin_rangs.titol', 'Taula de rangs')}</h1>
        <p>{t('admin_rangs.no_controlador', 'Aquest tipus no té camp controlador configurat.')}</p>
      </>
    )
  }

  const opcions = controladorCamp.opcions || []
  const campsNumerics = []
  for (const s of tipus.seccions || []) {
    for (const c of s.camps || []) {
      if (c.type === 'number' && c.name !== tipus.camp_controlador) {
        campsNumerics.push({ ...c, seccioTitol: s.titol })
      }
    }
  }

  function setRang(campId, valor, minMax, v) {
    setRangs(prev => {
      const perCamp = { ...(prev[campId] || {}) }
      const actual = { ...(perCamp[valor] || {}) }
      if (v === '' || v === null) {
        delete actual[minMax]
      } else {
        actual[minMax] = parseFloat(v)
      }
      if (Object.keys(actual).length === 0) {
        delete perCamp[valor]
      } else {
        perCamp[valor] = actual
      }
      return { ...prev, [campId]: perCamp }
    })
  }

  async function desar() {
    setSaving(true)
    setError(null)
    try {
      for (const c of campsNumerics) {
        const rc = rangs[c.id] || {}
        const netRc = Object.keys(rc).length > 0 ? rc : null
        await editarCamp(c.id, { rangs_condicionals: netRc })
      }
      addToast(t('admin_rangs.desats', 'Rangs desats'))
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (campsNumerics.length === 0) {
    return (
      <>
        <nav aria-label="breadcrumb">
          <ul>
            <li><Link to="/admin/tipus">{t('admin_seccions.breadcrumb_tipus')}</Link></li>
            <li><Link to={`/admin/tipus/${tipusId}/seccions`}>{tipus.nom}</Link></li>
            <li>{t('admin_rangs.titol', 'Taula de rangs')}</li>
          </ul>
        </nav>
        <h1>{t('admin_rangs.titol', 'Taula de rangs')}</h1>
        <p>{t('admin_rangs.no_camps_numerics', 'No hi ha camps numèrics per configurar.')}</p>
      </>
    )
  }

  return (
    <>
      <nav aria-label="breadcrumb">
        <ul>
          <li><Link to="/admin/tipus">{t('admin_seccions.breadcrumb_tipus')}</Link></li>
          <li><Link to={`/admin/tipus/${tipusId}/seccions`}>{tipus.nom}</Link></li>
          <li>{t('admin_rangs.titol', 'Taula de rangs')}</li>
        </ul>
      </nav>

      <div className="admin-header">
        <hgroup>
          <h1>{t('admin_rangs.titol', 'Taula de rangs')} — {tipus.nom}</h1>
          <p>
            {t('admin_rangs.subtitol', 'Rangs de min/max per cada valor de {{camp}}. Deixa buit per no aplicar rang.', { camp: controladorCamp.label })}
          </p>
        </hgroup>
        <div className="admin-header-actions">
          <button onClick={desar} disabled={saving} aria-busy={saving}>
            {saving ? t('common.desant', 'Desant...') : t('common.desar_canvis')}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}

      <div style={{ overflowX: 'auto' }}>
        <table className="rangs-matrix">
          <thead>
            <tr>
              <th rowSpan={2} style={{ verticalAlign: 'bottom', minWidth: '8rem' }}>
                {controladorCamp.label}
              </th>
              {campsNumerics.map(c => (
                <th key={c.id} colSpan={2} style={{ textAlign: 'center', borderLeft: '1px solid var(--pico-muted-border-color)' }}>
                  {c.label}
                  <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--lab-text-muted)' }}>
                    {c.seccioTitol}
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              {campsNumerics.flatMap(c => [
                <th key={`${c.id}-min`} style={{ borderLeft: '1px solid var(--pico-muted-border-color)', textAlign: 'center', fontSize: '0.85rem' }}>
                  {t('admin_camps.minim')}
                </th>,
                <th key={`${c.id}-max`} style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                  {t('admin_camps.maxim')}
                </th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {opcions.map(op => (
              <tr key={op}>
                <td><strong>{op}</strong></td>
                {campsNumerics.flatMap(c => {
                  const rang = (rangs[c.id] || {})[op] || {}
                  return [
                    <td key={`${c.id}-${op}-min`} style={{ borderLeft: '1px solid var(--pico-muted-border-color)', padding: '0.25rem' }}>
                      <input
                        type="number"
                        step="any"
                        value={rang.min != null ? rang.min : ''}
                        onChange={e => setRang(c.id, op, 'min', e.target.value)}
                        style={{ margin: 0, minWidth: '5rem' }}
                      />
                    </td>,
                    <td key={`${c.id}-${op}-max`} style={{ padding: '0.25rem' }}>
                      <input
                        type="number"
                        step="any"
                        value={rang.max != null ? rang.max : ''}
                        onChange={e => setRang(c.id, op, 'max', e.target.value)}
                        style={{ margin: 0, minWidth: '5rem' }}
                      />
                    </td>,
                  ]
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button onClick={desar} disabled={saving} aria-busy={saving}>
          {saving ? t('common.desant', 'Desant...') : t('common.desar_canvis')}
        </button>
      </div>
    </>
  )
}
