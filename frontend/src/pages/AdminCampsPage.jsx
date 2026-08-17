import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { llistarCamps, crearCamp, editarCamp, eliminarCamp, reordenarCamps, obtenirSeccio, obtenirTipusAdmin } from '../api/admin'
import { useToast } from '../context/ToastContext'

function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <tr ref={setNodeRef} style={style}>
      <td {...attributes} {...listeners} className="drag-handle">⠿</td>
      {children}
    </tr>
  )
}

export default function AdminCampsPage() {
  const { t } = useTranslation()
  const { seccioId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [camps, setCamps] = useState([])
  const [tipus, setTipus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', label: '', type: 'text', required: false, grup: '', opcions: [], alerta_min: '', alerta_max: '', alerta_color_min: '#3b82f6', alerta_color_max: '#e53e3e', formula: '', rangs_condicionals: {} })
  const [novaOpcio, setNovaOpcio] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  async function fetchData() {
    setLoading(true)
    try {
      const [campsData, seccioData] = await Promise.all([
        llistarCamps(seccioId),
        obtenirSeccio(seccioId),
      ])
      setCamps(campsData)
      if (seccioData && seccioData.tipus_id) {
        const tipusData = await obtenirTipusAdmin(seccioData.tipus_id)
        setTipus(tipusData)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const controladorCamp = (() => {
    if (!tipus || !tipus.camp_controlador) return null
    for (const s of tipus.seccions || []) {
      for (const c of s.camps || []) {
        if (c.name === tipus.camp_controlador) return c
      }
    }
    return null
  })()

  useEffect(() => { fetchData() }, [seccioId])

  function resetForm() {
    setForm({ name: '', label: '', type: 'text', required: false, grup: '', opcions: [], alerta_min: '', alerta_max: '', alerta_color_min: '#3b82f6', alerta_color_max: '#e53e3e', formula: '', rangs_condicionals: {} })
    setNovaOpcio('')
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(c) {
    setForm({
      name: c.name,
      label: c.label,
      type: c.type,
      required: c.required,
      grup: c.grup || '',
      opcions: c.opcions || [],
      alerta_min: c.alerta_min != null ? c.alerta_min : '',
      alerta_max: c.alerta_max != null ? c.alerta_max : '',
      alerta_color_min: c.alerta_color_min || '#3b82f6',
      alerta_color_max: c.alerta_color_max || '#e53e3e',
      formula: c.formula || '',
      rangs_condicionals: c.rangs_condicionals || {},
    })
    setNovaOpcio('')
    setEditingId(c.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function setRangCondicional(valor, camp, val) {
    setForm(prev => {
      const rc = { ...(prev.rangs_condicionals || {}) }
      const actual = { ...(rc[valor] || {}) }
      if (val === '' || val === null) {
        delete actual[camp]
      } else {
        actual[camp] = parseFloat(val)
      }
      if (Object.keys(actual).length === 0) {
        delete rc[valor]
      } else {
        rc[valor] = actual
      }
      return { ...prev, rangs_condicionals: rc }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const data = {
      name: form.name,
      label: form.label,
      type: form.type,
      required: form.required,
      grup: form.grup,
      opcions: form.type === 'select' ? form.opcions : [],
      alerta_min: form.type === 'number' && form.alerta_min !== '' ? parseFloat(form.alerta_min) : null,
      alerta_max: form.type === 'number' && form.alerta_max !== '' ? parseFloat(form.alerta_max) : null,
      alerta_color_min: form.type === 'number' ? form.alerta_color_min : null,
      alerta_color_max: form.type === 'number' ? form.alerta_color_max : null,
      formula: form.formula || '',
      rangs_condicionals: form.type === 'number' && form.rangs_condicionals && Object.keys(form.rangs_condicionals).length > 0
        ? form.rangs_condicionals
        : null,
    }
    try {
      if (editingId) {
        await editarCamp(editingId, data)
        addToast(t('admin_camps.camp_actualitzat'))
      } else {
        await crearCamp(seccioId, data)
        addToast(t('admin_camps.camp_creat'))
      }
      resetForm()
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleDelete(id, label) {
    if (!confirm(t('admin_camps.confirm_eliminar', { label }))) return
    try {
      await eliminarCamp(id)
      addToast(t('admin_camps.camp_eliminat'))
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = camps.findIndex(c => c.id === active.id)
    const newIndex = camps.findIndex(c => c.id === over.id)
    const newOrder = arrayMove(camps, oldIndex, newIndex)
    setCamps(newOrder)

    try {
      await reordenarCamps(seccioId, newOrder.map(c => c.id))
    } catch (err) {
      setError(err.message)
      await fetchData()
    }
  }

  if (loading) return <p aria-busy="true">{t('common.carregant')}</p>

  return (
    <>
      <nav aria-label="breadcrumb">
        <ul>
          <li><Link to="/admin/tipus">{t('admin_camps.breadcrumb_tipus')}</Link></li>
          <li><Link to="#" onClick={(e) => { e.preventDefault(); navigate(-1) }}>{t('admin_camps.breadcrumb_seccions')}</Link></li>
          <li>{t('admin_camps.breadcrumb_camps')}</li>
        </ul>
      </nav>

      <div className="admin-header">
        <hgroup>
          <h1>{t('admin_camps.titol')}</h1>
          <p>{t('admin_camps.subtitol')}</p>
        </hgroup>
        <div className="admin-header-actions">
          <button
            className={showForm ? 'secondary' : ''}
            onClick={() => { resetForm(); setShowForm(!showForm) }}
          >
            {showForm ? t('common.cancellar') : t('admin_camps.nou_camp')}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend><strong>{editingId ? t('admin_camps.editar_camp') : t('admin_camps.nou_camp')}</strong></legend>
            <div className="grid">
              <label>
                {t('admin_camps.nom_intern')}
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder={t('admin_camps.placeholder_nom')}
                />
              </label>
              <label>
                {t('admin_camps.etiqueta')}
                <input
                  type="text"
                  value={form.label}
                  onChange={e => setForm({ ...form, label: e.target.value })}
                  required
                  placeholder={t('admin_camps.placeholder_etiqueta')}
                />
              </label>
            </div>
            <div className="grid">
              <label>
                {t('admin_camps.tipus')}
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="text">{t('admin_camps.tipus_text')}</option>
                  <option value="number">{t('admin_camps.tipus_number')}</option>
                  <option value="date">{t('admin_camps.tipus_date')}</option>
                  <option value="textarea">{t('admin_camps.tipus_textarea')}</option>
                  <option value="checkbox">{t('admin_camps.tipus_checkbox')}</option>
                  <option value="select">{t('admin_camps.tipus_select')}</option>
                </select>
              </label>
              <label>
                {t('admin_camps.grup')}
                <input
                  type="text"
                  value={form.grup}
                  onChange={e => setForm({ ...form, grup: e.target.value })}
                  placeholder={t('admin_camps.placeholder_grup')}
                />
              </label>
            </div>
            {form.type === 'select' && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>{t('admin_camps.opcions_llista')}</strong>
                {form.opcions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.5rem 0' }}>
                    {form.opcions.map((op, i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        background: 'var(--pico-muted-border-color)', borderRadius: '0.3rem',
                        padding: '0.2rem 0.5rem', fontSize: '0.9rem',
                      }}>
                        {op}
                        <button
                          type="button"
                          className="outline secondary"
                          style={{ padding: '0 0.3rem', margin: 0, fontSize: '0.8rem', lineHeight: 1 }}
                          onClick={() => setForm({ ...form, opcions: form.opcions.filter((_, j) => j !== i) })}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
                  <input
                    type="text"
                    value={novaOpcio}
                    onChange={e => setNovaOpcio(e.target.value)}
                    placeholder={t('admin_camps.nova_opcio')}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = novaOpcio.trim()
                        if (val && !form.opcions.includes(val)) {
                          setForm({ ...form, opcions: [...form.opcions, val] })
                          setNovaOpcio('')
                        }
                      }
                    }}
                    style={{ marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = novaOpcio.trim()
                      if (val && !form.opcions.includes(val)) {
                        setForm({ ...form, opcions: [...form.opcions, val] })
                        setNovaOpcio('')
                      }
                    }}
                    style={{ whiteSpace: 'nowrap' }}
                  >{t('admin_camps.afegir')}</button>
                </div>
              </div>
            )}
            {form.type === 'number' && controladorCamp && (controladorCamp.opcions || []).length > 0 && form.name !== controladorCamp.name && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>{t('admin_camps.rangs_per_valor', 'Rangs per valor de {{camp}}', { camp: controladorCamp.label })}</strong>
                <p style={{ color: 'var(--lab-text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0.5rem 0' }}>
                  {t('admin_camps.rangs_per_valor_desc', 'Deixa buit per no aplicar rang a aquest valor (sense alerta).')}
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>{controladorCamp.label}</th>
                        <th style={{ width: '10rem' }}>{t('admin_camps.minim')}</th>
                        <th style={{ width: '10rem' }}>{t('admin_camps.maxim')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {controladorCamp.opcions.map((op) => {
                        const rang = (form.rangs_condicionals || {})[op] || {}
                        return (
                          <tr key={op}>
                            <td><strong>{op}</strong></td>
                            <td>
                              <input
                                type="number"
                                step="any"
                                value={rang.min != null ? rang.min : ''}
                                onChange={e => setRangCondicional(op, 'min', e.target.value)}
                                placeholder={t('admin_camps.sense_minim')}
                                style={{ margin: 0 }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="any"
                                value={rang.max != null ? rang.max : ''}
                                onChange={e => setRangCondicional(op, 'max', e.target.value)}
                                placeholder={t('admin_camps.sense_maxim')}
                                style={{ margin: 0 }}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {form.type === 'number' && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>{t('admin_camps.alertes_rang')}</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'end' }}>
                  <label>
                    {t('admin_camps.minim')}
                    <input
                      type="number"
                      step="any"
                      value={form.alerta_min}
                      onChange={e => setForm({ ...form, alerta_min: e.target.value })}
                      placeholder={t('admin_camps.sense_minim')}
                    />
                  </label>
                  <label>
                    {t('admin_camps.color')}
                    <input
                      type="color"
                      value={form.alerta_color_min}
                      onChange={e => setForm({ ...form, alerta_color_min: e.target.value })}
                      style={{ height: '2.5rem', width: '3rem', padding: '0.2rem', cursor: 'pointer' }}
                    />
                  </label>
                  <label>
                    {t('admin_camps.maxim')}
                    <input
                      type="number"
                      step="any"
                      value={form.alerta_max}
                      onChange={e => setForm({ ...form, alerta_max: e.target.value })}
                      placeholder={t('admin_camps.sense_maxim')}
                    />
                  </label>
                  <label>
                    {t('admin_camps.color')}
                    <input
                      type="color"
                      value={form.alerta_color_max}
                      onChange={e => setForm({ ...form, alerta_color_max: e.target.value })}
                      style={{ height: '2.5rem', width: '3rem', padding: '0.2rem', cursor: 'pointer' }}
                    />
                  </label>
                </div>
              </div>
            )}
            <label>
              {t('admin_camps.formula')}
              <input
                type="text"
                value={form.formula}
                onChange={e => setForm({ ...form, formula: e.target.value })}
                placeholder={t('admin_camps.formula_placeholder')}
              />
              <small style={{ color: 'var(--lab-text-muted)' }}>
                {t('admin_camps.formula_ajuda')}
                {camps.length > 0 && (
                  <>
                    {' '}{t('admin_camps.formula_camps_disponibles')}{' '}
                    {camps.filter(c => c.id !== editingId).map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && ', '}<code>{c.name}</code>
                      </span>
                    ))}
                  </>
                )}
              </small>
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.required}
                onChange={e => setForm({ ...form, required: e.target.checked })}
                role="switch"
                disabled={!!form.formula && !!form.formula.trim()}
              />
              {t('admin_camps.obligatori')}
              {form.formula && form.formula.trim() && (
                <small style={{ color: 'var(--lab-text-muted)', marginLeft: '0.5rem' }}>
                  ({t('admin_camps.no_aplica_calculat')})
                </small>
              )}
            </label>
            <button type="submit">{editingId ? t('common.desar_canvis') : t('common.crear')}</button>
          </fieldset>
        </form>
      )}

      {camps.length === 0 ? (
        <p>{t('admin_camps.no_camps')}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '3rem' }}></th>
                <th>{t('common.nom')}</th>
                <th>{t('admin_camps.etiqueta')}</th>
                <th>{t('admin_camps.tipus')}</th>
                <th>{t('admin_camps.grup')}</th>
                <th>{t('admin_camps.obligatori')}</th>
                <th>{t('common.accions')}</th>
              </tr>
            </thead>
            <SortableContext items={camps.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {camps.map(c => (
                  <SortableRow key={c.id} id={c.id}>
                    <td><code>{c.name}</code></td>
                    <td>
                      {c.label}
                      {c.formula && <span className="formula-badge" title={c.formula} style={{ marginLeft: '0.35rem' }}>ƒ</span>}
                    </td>
                    <td>{c.type}</td>
                    <td>{c.grup || '—'}</td>
                    <td>{c.required ? t('common.si') : t('common.no')}</td>
                    <td>
                      <div className="admin-actions-row">
                        <button className="outline btn-sm" onClick={() => startEdit(c)}>{t('common.editar')}</button>
                        <button className="outline secondary btn-sm" onClick={() => handleDelete(c.id, c.label)}>
                          {t('common.eliminar')}
                        </button>
                      </div>
                    </td>
                  </SortableRow>
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      )}
    </>
  )
}
