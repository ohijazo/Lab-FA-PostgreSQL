import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { obtenirTipusAdmin, editarCamp } from '../api/admin'
import { useToast } from '../context/ToastContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import LoadingBlock from '../components/ui/LoadingBlock'
import Icon from '../components/Icon'

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

  if (loading) return <LoadingBlock label={t('common.carregant')} />
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
        <Breadcrumbs
          items={[
            { label: t('admin_seccions.breadcrumb_tipus'), to: '/admin/tipus' },
            { label: tipus.nom, to: `/admin/tipus/${tipusId}/seccions` },
            { label: t('nav.rangs') },
          ]}
        />
        <h1>{t('admin_rangs.titol', 'Taula de rangs')}</h1>
        <EmptyState
          icon={<Icon name="SlidersHorizontal" size={40} />}
          title={t('admin_rangs.no_controlador', 'Aquest tipus no té camp controlador configurat.')}
          description={t('admin_rangs.no_controlador_desc', "El camp controlador (de tipus 'select') determina els rangs vàlids segons el valor triat. Configura'l des de la pàgina de seccions.")}
          action={
            <Link to={`/admin/tipus/${tipusId}/seccions`} className="btn btn-primary">
              <Icon name="Layers" size={14} />
              <span>{t('admin_rangs.anar_a_seccions', 'Configurar seccions')}</span>
            </Link>
          }
        />
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
        <Breadcrumbs
          items={[
            { label: t('admin_seccions.breadcrumb_tipus'), to: '/admin/tipus' },
            { label: tipus.nom, to: `/admin/tipus/${tipusId}/seccions` },
            { label: t('nav.rangs') },
          ]}
        />
        <h1>{t('admin_rangs.titol', 'Taula de rangs')}</h1>
        <EmptyState
          icon={<Icon name="Ruler" size={40} />}
          title={t('admin_rangs.no_camps_numerics', 'No hi ha camps numèrics per configurar.')}
          description={t('admin_rangs.no_camps_numerics_desc', "Afegeix camps de tipus 'número' a alguna secció per poder-los configurar aquí.")}
          action={
            <Link to={`/admin/tipus/${tipusId}/seccions`} className="btn btn-primary">
              <Icon name="Layers" size={14} />
              <span>{t('admin_rangs.anar_a_seccions', 'Configurar seccions')}</span>
            </Link>
          }
        />
      </>
    )
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t('admin_seccions.breadcrumb_tipus'), to: '/admin/tipus' },
          { label: tipus.nom, to: `/admin/tipus/${tipusId}/seccions` },
          { label: t('nav.rangs') },
        ]}
      />

      <div className="admin-header">
        <hgroup>
          <h1>{t('admin_rangs.titol', 'Taula de rangs')} — {tipus.nom}</h1>
          <p>
            {t('admin_rangs.subtitol', 'Rangs de min/max per cada valor de {{camp}}. Deixa buit per no aplicar rang.', { camp: controladorCamp.label })}
          </p>
        </hgroup>
        <div className="admin-header-actions">
          <Button variant="primary" icon={<Icon name="Save" size={14} />} loading={saving} onClick={desar}>
            {saving ? t('common.desant', 'Desant...') : t('common.desar_canvis')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className="rangs-matrix-wrap">
        <table className="rangs-matrix">
          <thead>
            <tr>
              <th rowSpan={2} className="rangs-col-header">
                {controladorCamp.label}
              </th>
              {campsNumerics.map(c => (
                <th key={c.id} colSpan={2} className="rangs-camp-header">
                  {c.label}
                  <div className="rangs-camp-header-sub">{c.seccioTitol}</div>
                </th>
              ))}
            </tr>
            <tr>
              {campsNumerics.flatMap(c => [
                <th key={`${c.id}-min`} className="rangs-minmax-header rangs-minmax-header-min">
                  {t('admin_camps.minim')}
                </th>,
                <th key={`${c.id}-max`} className="rangs-minmax-header">
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
                  const hasMin = rang.min != null
                  const hasMax = rang.max != null
                  return [
                    <td key={`${c.id}-${op}-min`} className={`rangs-cell rangs-cell-min${hasMin ? ' rangs-cell-filled' : ''}`}>
                      <input
                        type="number"
                        step="any"
                        value={hasMin ? rang.min : ''}
                        onChange={e => setRang(c.id, op, 'min', e.target.value)}
                        className="rangs-input"
                      />
                    </td>,
                    <td key={`${c.id}-${op}-max`} className={`rangs-cell${hasMax ? ' rangs-cell-filled' : ''}`}>
                      <input
                        type="number"
                        step="any"
                        value={hasMax ? rang.max : ''}
                        onChange={e => setRang(c.id, op, 'max', e.target.value)}
                        className="rangs-input"
                      />
                    </td>,
                  ]
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rangs-footer">
        <Button variant="primary" icon={<Icon name="Save" size={14} />} loading={saving} onClick={desar}>
          {saving ? t('common.desant', 'Desant...') : t('common.desar_canvis')}
        </Button>
      </div>
    </>
  )
}
