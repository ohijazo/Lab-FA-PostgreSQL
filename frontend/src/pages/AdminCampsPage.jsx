import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { llistarCamps, crearCamp, editarCamp, eliminarCamp, reordenarCamps, obtenirSeccio, obtenirTipusAdmin } from '../api/admin'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Icon from '../components/Icon'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import LoadingBlock from '../components/ui/LoadingBlock'

function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <tr ref={setNodeRef} style={style}>
      <td {...attributes} {...listeners} className="drag-handle"><Icon name="GripVertical" size={14} /></td>
      {children}
    </tr>
  )
}

function SortableOpcio({ id, value, onChange, onRemove, isDup }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem',
    background: isDup ? 'var(--pico-del-background-color, #fee2e2)' : 'transparent',
    borderRadius: '0.25rem',
  }
  return (
    <div ref={setNodeRef} style={style}>
      <span {...attributes} {...listeners} className="drag-handle" style={{ cursor: 'grab', padding: '0 0.25rem' }}><Icon name="GripVertical" size={14} /></span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ margin: 0, flex: 1 }}
      />
      <button
        type="button"
        className="outline secondary"
        style={{ padding: '0.15rem 0.5rem', margin: 0, fontSize: '0.85rem', lineHeight: 1 }}
        onClick={onRemove}
        title="Eliminar"
      ><Icon name="X" size={14} /></button>
    </div>
  )
}

export default function AdminCampsPage() {
  const { t } = useTranslation()
  const { seccioId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const confirm = useConfirm()
  const [camps, setCamps] = useState([])
  const [tipus, setTipus] = useState(null)
  const [seccio, setSeccio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', label: '', type: 'text', required: false, grup: '', opcions: [], alerta_min: '', alerta_max: '', alerta_color_min: '#3b82f6', alerta_color_max: '#e53e3e', formula: '', rangs_condicionals: {} })
  const [novaOpcio, setNovaOpcio] = useState('')
  const [importText, setImportText] = useState('')

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
      setSeccio(seccioData || null)
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
    setImportText('')
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
    const ok = await confirm({
      title: t('common.eliminar'),
      message: t('admin_camps.confirm_eliminar', { label }),
      confirmLabel: t('common.eliminar'),
      cancelLabel: t('common.cancellar'),
      variant: 'danger',
    })
    if (!ok) return
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

  if (loading) return <LoadingBlock label={t('common.carregant')} />

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t('admin_camps.breadcrumb_tipus'), to: '/admin/tipus' },
          ...(tipus ? [{ label: tipus.nom, to: `/admin/tipus/${tipus.id}/seccions` }] : []),
          ...(seccio ? [{ label: seccio.titol }] : [{ label: t('admin_camps.breadcrumb_seccions') }]),
          { label: t('nav.camps') },
        ]}
      />

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
                {' '}
                <span style={{ color: 'var(--lab-text-muted)', fontSize: '0.85rem' }}>
                  ({form.opcions.length})
                </span>
                {form.opcions.length > 0 && (
                  <>
                    <div style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="outline btn-sm"
                        onClick={() => {
                          const ordenades = [...form.opcions].sort((a, b) => a.localeCompare(b, 'ca', { numeric: true, sensitivity: 'base' }))
                          setForm({ ...form, opcions: ordenades })
                        }}
                      >{t('admin_camps.ordenar_az', 'Ordenar A-Z')}</button>
                      <button
                        type="button"
                        className="outline secondary btn-sm"
                        onClick={async () => {
                          const ok = await confirm({
                            title: t('admin_camps.buidar', 'Buidar'),
                            message: t('admin_camps.confirm_buidar', 'Segur que vols eliminar totes les opcions?'),
                            confirmLabel: t('admin_camps.buidar', 'Buidar'),
                            cancelLabel: t('common.cancellar'),
                            variant: 'danger',
                          })
                          if (ok) setForm({ ...form, opcions: [] })
                        }}
                      >{t('admin_camps.buidar', 'Buidar')}</button>
                    </div>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => {
                        const { active, over } = event
                        if (!over || active.id === over.id) return
                        const oldIndex = form.opcions.findIndex(o => o === active.id)
                        const newIndex = form.opcions.findIndex(o => o === over.id)
                        setForm({ ...form, opcions: arrayMove(form.opcions, oldIndex, newIndex) })
                      }}
                    >
                      <SortableContext items={form.opcions} strategy={verticalListSortingStrategy}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', margin: '0.5rem 0', maxHeight: '20rem', overflowY: 'auto', border: '1px solid var(--pico-muted-border-color)', borderRadius: '0.3rem', padding: '0.25rem' }}>
                          {form.opcions.map((op, i) => (
                            <SortableOpcio
                              key={op}
                              id={op}
                              value={op}
                              isDup={form.opcions.indexOf(op) !== i}
                              onChange={(nou) => {
                                const noves = [...form.opcions]
                                noves[i] = nou
                                setForm({ ...form, opcions: noves })
                              }}
                              onRemove={() => setForm({ ...form, opcions: form.opcions.filter((_, j) => j !== i) })}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end', marginTop: '0.5rem' }}>
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
                <details style={{ marginTop: '0.75rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                    {t('admin_camps.import_massiu', 'Import massiu (enganxa una llista)')}
                  </summary>
                  <div style={{ marginTop: '0.5rem' }}>
                    <textarea
                      value={importText}
                      onChange={e => setImportText(e.target.value)}
                      rows={5}
                      placeholder={t('admin_camps.import_placeholder', 'Enganxa aquí una llista, un valor per línia o separats per comes')}
                      style={{ marginBottom: '0.5rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const trossos = importText
                            .split(/[\n,;\t]+/)
                            .map(s => s.trim())
                            .filter(s => s.length > 0)
                          const existents = new Set(form.opcions)
                          const noves = []
                          for (const v of trossos) {
                            if (!existents.has(v)) {
                              existents.add(v)
                              noves.push(v)
                            }
                          }
                          if (noves.length > 0) {
                            setForm({ ...form, opcions: [...form.opcions, ...noves] })
                          }
                          addToast(t('admin_camps.import_result', 'Afegides {{n}} opcions noves', { n: noves.length }))
                          setImportText('')
                        }}
                        disabled={!importText.trim()}
                      >{t('admin_camps.afegir_aquests', 'Afegir aquests')}</button>
                      <button
                        type="button"
                        className="outline secondary"
                        onClick={() => setImportText('')}
                        disabled={!importText.trim()}
                      >{t('common.cancellar')}</button>
                    </div>
                  </div>
                </details>
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
        <EmptyState
          icon={<Icon name="LayoutList" size={40} />}
          title={t('admin_camps.no_camps')}
          description={t('admin_camps.no_camps_desc')}
          action={
            <Button
              variant="primary"
              icon={<Icon name="Plus" size={14} />}
              onClick={() => { resetForm(); setShowForm(true) }}
            >
              {t('admin_camps.crear_primer_camp')}
            </Button>
          }
        />
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
                      {c.formula && <span className="formula-badge" title={c.formula} style={{ marginLeft: '0.35rem' }}><Icon name="Sigma" size={11} /></span>}
                    </td>
                    <td>{c.type}</td>
                    <td>{c.grup || '—'}</td>
                    <td>{c.required ? t('common.si') : t('common.no')}</td>
                    <td>
                      <div className="admin-actions-row">
                        <Button variant="ghost" size="sm" icon={<Icon name="Pencil" size={12} />} onClick={() => startEdit(c)}>
                          {t('common.editar')}
                        </Button>
                        <Button variant="danger" size="sm" icon={<Icon name="Trash2" size={12} />} onClick={() => handleDelete(c.id, c.label)}>
                          {t('common.eliminar')}
                        </Button>
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
