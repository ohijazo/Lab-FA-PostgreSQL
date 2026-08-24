import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation, Trans } from 'react-i18next'
import { llistarCamps, crearCamp, editarCamp, eliminarCamp, reordenarCamps, obtenirSeccio, obtenirTipusAdmin } from '../api/admin'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Icon from '../components/Icon'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import TableSkeleton from '../components/ui/TableSkeleton'
import { Tabs, Tab } from '../components/ui/Tabs'

// --- Fila d'un camp a la llista esquerra ---
function SortableCampRow({ camp, isSelected, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: camp.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <li ref={setNodeRef} style={style} className={`admin-camps-row${isSelected ? ' is-selected' : ''}`}>
      <span {...attributes} {...listeners} className="admin-camps-row-drag drag-handle" title="Arrossega per reordenar">
        <Icon name="GripVertical" size={14} />
      </span>
      <button type="button" className="admin-camps-row-body" onClick={onSelect}>
        <div className="admin-camps-row-main">
          <span className="admin-camps-row-label">{camp.label}</span>
          {camp.formula && <span className="formula-badge" title={camp.formula}><Icon name="Sigma" size={11} /></span>}
          {camp.required && <span className="admin-camps-row-req" title="Obligatori">*</span>}
        </div>
        <div className="admin-camps-row-meta">
          <code className="admin-camps-row-name">{camp.name}</code>
          <span className="admin-camps-row-type">{camp.type}</span>
          {camp.grup && <span className="admin-camps-row-grup">· {camp.grup}</span>}
        </div>
      </button>
    </li>
  )
}

// --- Fila d'una opció (dins del panel Opcions) ---
function SortableOpcio({ id, value, onChange, onRemove, isDup }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className={`admin-camps-opcio${isDup ? ' is-dup' : ''}`}>
      <span {...attributes} {...listeners} className="drag-handle admin-camps-opcio-drag"><Icon name="GripVertical" size={14} /></span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="admin-camps-opcio-input" />
      <button type="button" className="admin-camps-opcio-remove" onClick={onRemove} title="Eliminar">
        <Icon name="X" size={14} />
      </button>
    </div>
  )
}

const EMPTY_FORM = {
  name: '', label: '', type: 'text', required: false, grup: '', opcions: [],
  alerta_min: '', alerta_max: '', alerta_color_min: '#3b82f6', alerta_color_max: '#e53e3e',
  formula: '', rangs_condicionals: {},
}

export default function AdminCampsPage() {
  const { t } = useTranslation()
  const { seccioId } = useParams()
  const { addToast } = useToast()
  const confirm = useConfirm()
  const [camps, setCamps] = useState([])
  const [tipus, setTipus] = useState(null)
  const [seccio, setSeccio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [activeTab, setActiveTab] = useState('general')
  const [form, setForm] = useState(EMPTY_FORM)
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

  useEffect(() => { fetchData() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [seccioId])

  // Si canvia el type i el tab actiu ja no aplica, torna a 'general'
  useEffect(() => {
    if (activeTab === 'opcions' && form.type !== 'select') setActiveTab('general')
    if (activeTab === 'rangs' && form.type !== 'number') setActiveTab('general')
  }, [form.type, activeTab])

  function closeEditor() {
    setForm(EMPTY_FORM)
    setNovaOpcio('')
    setImportText('')
    setEditingId(null)
    setFormOpen(false)
    setActiveTab('general')
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setNovaOpcio('')
    setImportText('')
    setEditingId(null)
    setActiveTab('general')
    setFormOpen(true)
    setError(null)
  }

  function selectCamp(c) {
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
    setImportText('')
    setEditingId(c.id)
    setActiveTab('general')
    setFormOpen(true)
    setError(null)
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
      closeEditor()
      await fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete() {
    if (!editingId) return
    const ok = await confirm({
      title: t('common.eliminar'),
      message: <Trans i18nKey="admin_camps.confirm_eliminar" values={{ label: form.label }} components={{ 1: <strong /> }} />,
      confirmLabel: t('common.eliminar'),
      cancelLabel: t('common.cancellar'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await eliminarCamp(editingId)
      addToast(t('admin_camps.camp_eliminat'))
      closeEditor()
      await fetchData()
    } catch (err) {
      setError(err.message)
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

  if (loading) return <TableSkeleton rows={6} />

  const hasRangsCondicionals = form.type === 'number' && controladorCamp && (controladorCamp.opcions || []).length > 0 && form.name !== controladorCamp.name
  const showRightPanel = camps.length > 0 || formOpen

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
          <Button
            variant="primary"
            icon={<Icon name="Plus" size={14} />}
            onClick={openNew}
          >
            {t('admin_camps.nou_camp')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className={`admin-camps-layout${!showRightPanel ? ' admin-camps-layout-solo' : ''}`}>
        {/* --- PANEL ESQUERRA: llista sortable de camps --- */}
        <aside className="admin-camps-list-panel">
          {camps.length === 0 ? (
            <EmptyState
              icon={<Icon name="LayoutList" size={40} />}
              title={t('admin_camps.no_camps')}
              description={t('admin_camps.no_camps_desc')}
              action={
                <Button
                  variant="primary"
                  icon={<Icon name="Plus" size={14} />}
                  onClick={openNew}
                >
                  {t('admin_camps.crear_primer_camp')}
                </Button>
              }
            />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={camps.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <ul className="admin-camps-list">
                  {camps.map(c => (
                    <SortableCampRow
                      key={c.id}
                      camp={c}
                      isSelected={editingId === c.id}
                      onSelect={() => selectCamp(c)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </aside>

        {/* --- PANEL DRETA: editor amb tabs (sticky) --- */}
        {showRightPanel && (
        <section className="admin-camps-editor-panel">
          {!formOpen ? (
            <EmptyState
              icon={<Icon name="Pencil" size={40} />}
              title={t('admin_camps.editor_buit_titol')}
              description={t('admin_camps.editor_buit_desc')}
            />
          ) : (
            <form onSubmit={handleSubmit} className="admin-camps-editor-form">
              <header className="admin-camps-editor-header">
                <h2>{editingId ? t('admin_camps.editar_camp') : t('admin_camps.nou_camp')}</h2>
                <button type="button" className="admin-camps-editor-close" onClick={closeEditor} title={t('common.tancar', 'Tancar')}>
                  <Icon name="X" size={16} />
                </button>
              </header>

              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tab id="general" label={t('admin_camps.tab_general')}>
                  <div className="admin-camps-panel">
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
                    <div className="admin-camps-panel-row">
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
                  </div>
                </Tab>

                {form.type === 'select' && (
                  <Tab id="opcions" label={`${t('admin_camps.opcions_llista')} (${form.opcions.length})`}>
                    <div className="admin-camps-panel">
                      {form.opcions.length > 0 && (
                        <>
                          <div className="admin-camps-opcions-actions">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const ordenades = [...form.opcions].sort((a, b) => a.localeCompare(b, 'ca', { numeric: true, sensitivity: 'base' }))
                                setForm({ ...form, opcions: ordenades })
                              }}
                            >
                              {t('admin_camps.ordenar_az', 'Ordenar A-Z')}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
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
                            >
                              {t('admin_camps.buidar', 'Buidar')}
                            </Button>
                          </div>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => {
                              const { active, over } = event
                              if (!over || active.id === over.id) return
                              // Els ids són posicionals ('opcio-N'): amb opcions duplicades
                              // buscar per valor reordenava la fila equivocada.
                              const oldIndex = Number(String(active.id).slice(6))
                              const newIndex = Number(String(over.id).slice(6))
                              setForm({ ...form, opcions: arrayMove(form.opcions, oldIndex, newIndex) })
                            }}
                          >
                            <SortableContext items={form.opcions.map((_, i) => `opcio-${i}`)} strategy={verticalListSortingStrategy}>
                              <div className="admin-camps-opcions-list">
                                {form.opcions.map((op, i) => (
                                  <SortableOpcio
                                    key={`opcio-${i}`}
                                    id={`opcio-${i}`}
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
                      <div className="admin-camps-opcions-add">
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
                        />
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => {
                            const val = novaOpcio.trim()
                            if (val && !form.opcions.includes(val)) {
                              setForm({ ...form, opcions: [...form.opcions, val] })
                              setNovaOpcio('')
                            }
                          }}
                        >
                          {t('admin_camps.afegir')}
                        </Button>
                      </div>
                      <details className="admin-camps-import">
                        <summary>{t('admin_camps.import_massiu', 'Import massiu (enganxa una llista)')}</summary>
                        <div className="admin-camps-import-body">
                          <textarea
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            rows={5}
                            placeholder={t('admin_camps.import_placeholder', 'Enganxa aquí una llista, un valor per línia o separats per comes')}
                          />
                          <div className="admin-camps-import-actions">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              disabled={!importText.trim()}
                              onClick={() => {
                                const trossos = importText.split(/[\n,;\t]+/).map(s => s.trim()).filter(s => s.length > 0)
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
                            >
                              {t('admin_camps.afegir_aquests', 'Afegir aquests')}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!importText.trim()}
                              onClick={() => setImportText('')}
                            >
                              {t('common.cancellar')}
                            </Button>
                          </div>
                        </div>
                      </details>
                    </div>
                  </Tab>
                )}

                <Tab id="formula" label={t('admin_camps.formula')}>
                  <div className="admin-camps-panel">
                    <label>
                      {t('admin_camps.formula')}
                      <input
                        type="text"
                        value={form.formula}
                        onChange={e => setForm({ ...form, formula: e.target.value })}
                        placeholder={t('admin_camps.formula_placeholder')}
                      />
                    </label>
                    <small className="admin-camps-help">
                      {t('admin_camps.formula_ajuda')}
                      {camps.length > 0 && (
                        <>
                          {' '}{t('admin_camps.formula_camps_disponibles')}{' '}
                          {camps.filter(c => c.id !== editingId).map((c, i) => (
                            <span key={c.id}>{i > 0 && ', '}<code>{c.name}</code></span>
                          ))}
                        </>
                      )}
                    </small>
                    <label className="admin-camps-required-row">
                      <input
                        type="checkbox"
                        checked={form.required}
                        onChange={e => setForm({ ...form, required: e.target.checked })}
                        role="switch"
                        disabled={!!form.formula && !!form.formula.trim()}
                      />
                      {t('admin_camps.obligatori')}
                      {form.formula && form.formula.trim() && (
                        <small className="admin-camps-help">({t('admin_camps.no_aplica_calculat')})</small>
                      )}
                    </label>
                  </div>
                </Tab>

                {form.type === 'number' && (
                  <Tab id="rangs" label={t('admin_camps.alertes_rang')}>
                    <div className="admin-camps-panel">
                      <div className="admin-camps-rangs-static">
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
                        <label className="admin-camps-color-label">
                          {t('admin_camps.color')}
                          <input
                            type="color"
                            value={form.alerta_color_min}
                            onChange={e => setForm({ ...form, alerta_color_min: e.target.value })}
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
                        <label className="admin-camps-color-label">
                          {t('admin_camps.color')}
                          <input
                            type="color"
                            value={form.alerta_color_max}
                            onChange={e => setForm({ ...form, alerta_color_max: e.target.value })}
                          />
                        </label>
                      </div>

                      {hasRangsCondicionals && (
                        <div className="admin-camps-rangs-cond">
                          <h4 className="admin-camps-rangs-cond-title">
                            {t('admin_camps.rangs_per_valor', 'Rangs per valor de {{camp}}', { camp: controladorCamp.label })}
                          </h4>
                          <p className="admin-camps-help">
                            {t('admin_camps.rangs_per_valor_desc', 'Deixa buit per no aplicar rang a aquest valor (sense alerta).')}
                          </p>
                          <div className="overflow-auto">
                            <table>
                              <thead>
                                <tr>
                                  <th>{controladorCamp.label}</th>
                                  <th>{t('admin_camps.minim')}</th>
                                  <th>{t('admin_camps.maxim')}</th>
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
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          step="any"
                                          value={rang.max != null ? rang.max : ''}
                                          onChange={e => setRangCondicional(op, 'max', e.target.value)}
                                          placeholder={t('admin_camps.sense_maxim')}
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
                    </div>
                  </Tab>
                )}
              </Tabs>

              <footer className="admin-camps-editor-actions">
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Icon name="Save" size={14} />}
                >
                  {editingId ? t('common.desar_canvis') : t('common.crear')}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="danger"
                    icon={<Icon name="Trash2" size={14} />}
                    onClick={handleDelete}
                  >
                    {t('common.eliminar')}
                  </Button>
                )}
                <Button type="button" variant="ghost" onClick={closeEditor}>
                  {t('common.cancellar')}
                </Button>
              </footer>
            </form>
          )}
        </section>
        )}
      </div>
    </>
  )
}
