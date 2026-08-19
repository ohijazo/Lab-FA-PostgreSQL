import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation, Trans } from 'react-i18next'
import { obtenirTipusAdmin, llistarSeccions, crearSeccio, editarSeccio, eliminarSeccio, editarTipus, reordenarSeccions } from '../api/admin'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Icon from '../components/Icon'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import LoadingBlock from '../components/ui/LoadingBlock'
import TableSkeleton from '../components/ui/TableSkeleton'

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

export default function AdminSeccionsPage() {
  const { t } = useTranslation()
  const { tipusId } = useParams()
  const { addToast } = useToast()
  const confirm = useConfirm()
  const [tipus, setTipus] = useState(null)
  const [seccions, setSeccions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ titol: '' })
  const [columnesLlista, setColumnesLlista] = useState([])
  const [campControlador, setCampControlador] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  async function fetchData() {
    setLoading(true)
    try {
      const [t, secs] = await Promise.all([
        obtenirTipusAdmin(tipusId),
        llistarSeccions(tipusId),
      ])
      setTipus(t)
      setSeccions(secs)
      setColumnesLlista(t.columnes_llista || [])
      setCampControlador(t.camp_controlador || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [tipusId])

  // Collect all camps from all seccions
  const totsCamps = seccions.flatMap(s => s.camps.map(c => ({ ...c, seccioTitol: s.titol })))

  function toggleColumna(campName) {
    setColumnesLlista(prev =>
      prev.includes(campName)
        ? prev.filter(n => n !== campName)
        : [...prev, campName]
    )
  }

  async function saveColumnes() {
    setError(null)
    try {
      await editarTipus(tipusId, { columnes_llista: columnesLlista })
      addToast(t('admin_seccions.columnes_desades'))
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function saveCampControlador() {
    setError(null)
    try {
      await editarTipus(tipusId, { camp_controlador: campControlador })
      addToast(t('admin_seccions.controlador_desat', 'Controlador desat'))
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const campsSelect = totsCamps.filter(c => c.type === 'select')

  function resetForm() {
    setForm({ titol: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(s) {
    setForm({ titol: s.titol })
    setEditingId(s.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const data = { titol: form.titol }
    try {
      if (editingId) {
        await editarSeccio(editingId, data)
        addToast(t('admin_seccions.seccio_actualitzada'))
      } else {
        await crearSeccio(tipusId, data)
        addToast(t('admin_seccions.seccio_creada'))
      }
      resetForm()
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleDelete(id, titol) {
    const ok = await confirm({
      title: t('common.eliminar'),
      message: <Trans i18nKey="admin_seccions.confirm_eliminar" values={{ titol }} components={{ 1: <strong /> }} />,
      confirmLabel: t('common.eliminar'),
      cancelLabel: t('common.cancellar'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await eliminarSeccio(id)
      addToast(t('admin_seccions.seccio_eliminada'))
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = seccions.findIndex(s => s.id === active.id)
    const newIndex = seccions.findIndex(s => s.id === over.id)
    const newOrder = arrayMove(seccions, oldIndex, newIndex)
    setSeccions(newOrder)

    try {
      await reordenarSeccions(tipusId, newOrder.map(s => s.id))
    } catch (err) {
      setError(err.message)
      await fetchData()
    }
  }

  if (loading) return <TableSkeleton rows={5} />
  if (!tipus) return <p>{t('common.tipus_no_trobat')}</p>

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t('admin_seccions.breadcrumb_tipus'), to: '/admin/tipus' },
          { label: tipus.nom, to: `/admin/tipus/${tipusId}/seccions` },
          { label: t('nav.seccions') },
        ]}
      />

      <div className="admin-header">
        <hgroup>
          <h1>{t('admin_seccions.titol', { nom: tipus.nom })}</h1>
          <p>{t('admin_seccions.subtitol')}</p>
        </hgroup>
        <div className="admin-header-actions">
          <button
            className={showForm ? 'secondary' : ''}
            onClick={() => { resetForm(); setShowForm(!showForm) }}
          >
            {showForm ? t('common.cancellar') : t('admin_seccions.nova_seccio')}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend><strong>{editingId ? t('admin_seccions.editar_seccio') : t('admin_seccions.nova_seccio')}</strong></legend>
            <label>
              {t('admin_seccions.titol_label')}
              <input
                type="text"
                value={form.titol}
                onChange={e => setForm({ ...form, titol: e.target.value })}
                required
              />
            </label>
            <button type="submit">{editingId ? t('common.desar_canvis') : t('common.crear')}</button>
          </fieldset>
        </form>
      )}

      {seccions.length === 0 ? (
        <EmptyState
          icon={<Icon name="Layers" size={40} />}
          title={t('admin_seccions.no_seccions')}
          description={t('admin_seccions.no_seccions_desc')}
          action={
            <Button
              variant="primary"
              icon={<Icon name="Plus" size={14} />}
              onClick={() => { resetForm(); setShowForm(true) }}
            >
              {t('admin_seccions.crear_primera_seccio')}
            </Button>
          }
        />
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '3rem' }}></th>
                  <th>{t('admin_seccions.titol_label')}</th>
                  <th>{t('admin_seccions.camps')}</th>
                  <th>{t('common.accions')}</th>
                </tr>
              </thead>
              <SortableContext items={seccions.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {seccions.map(s => (
                    <SortableRow key={s.id} id={s.id}>
                      <td><strong>{s.titol}</strong></td>
                      <td>{s.camps.length}</td>
                      <td>
                        <div className="admin-actions-row">
                          <Link to={`/admin/seccions/${s.id}/camps`} className="btn btn-outline btn-sm">
                            <Icon name="LayoutList" size={12} />
                            <span>{t('admin_seccions.camps')}</span>
                          </Link>
                          <Button variant="ghost" size="sm" icon={<Icon name="Pencil" size={12} />} onClick={() => startEdit(s)}>
                            {t('common.editar')}
                          </Button>
                          <Button variant="danger" size="sm" icon={<Icon name="Trash2" size={12} />} onClick={() => handleDelete(s.id, s.titol)}>
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

          {(() => {
            // Estat del sub-sistema de rangs
            const controladorField = campsSelect.find(c => c.name === (tipus?.camp_controlador || ''))
            const opcionsController = controladorField?.opcions || []
            // Comptar camps numèrics amb almenys un rang configurat
            const campsNumWithRang = totsCamps.filter(c => c.type === 'number' && c.rangs_condicionals && Object.keys(c.rangs_condicionals).length > 0)
            const campsNumTotal = totsCamps.filter(c => c.type === 'number' && c.name !== tipus?.camp_controlador).length
            const hasSelects = campsSelect.length > 0
            const hasController = !!tipus?.camp_controlador
            const hasRangs = campsNumWithRang.length > 0
            const controladorSaved = tipus?.camp_controlador === campControlador
            const state = !hasSelects ? 'no-selects'
              : !controladorSaved ? 'unsaved'
              : !hasController ? 'no-controller'
              : !hasRangs ? 'no-rangs'
              : 'configured'

            return (
              <article className={`rangs-card is-${state}`}>
                <header className="rangs-card-header">
                  <div className="rangs-card-icon"><Icon name="SlidersHorizontal" size={22} /></div>
                  <div className="rangs-card-header-info">
                    <h3 className="rangs-card-title">{t('admin_seccions.rangs_condicionals', 'Rangs condicionals per valor')}</h3>
                    <p className="rangs-card-desc">
                      {t('admin_seccions.rangs_condicionals_intro', 'Els camps numèrics poden tenir rangs vàlids diferents segons el valor d\'un camp de tipus llista (ex: humitat esperada canvia segons el tipus de blat).')}
                    </p>
                  </div>
                  {state === 'configured' && (
                    <span className="rangs-card-badge is-ok">
                      <Icon name="Check" size={12} /> {t('admin_seccions.rangs_configurats', 'Configurat')}
                    </span>
                  )}
                </header>

                {state === 'no-selects' && (
                  <div className="rangs-card-body">
                    <div className="rangs-card-empty">
                      <Icon name="AlertCircle" size={16} />
                      <div>
                        <strong>{t('admin_seccions.rangs_no_selects', 'Necessites un camp de tipus «Llista»')}</strong>
                        <p>{t('admin_seccions.rangs_no_selects_desc', 'Per activar rangs condicionals, primer has de crear un camp de tipus llista (ex: tipus_blat, varietat) a alguna secció. Serà el camp «controlador» que determinarà els rangs.')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {(state === 'no-controller' || state === 'unsaved') && (
                  <div className="rangs-card-body">
                    <div className="rangs-card-step">
                      <span className="rangs-card-step-num">1</span>
                      <div className="rangs-card-step-content">
                        <strong>{t('admin_seccions.rangs_paso1', 'Selecciona el camp controlador')}</strong>
                        <div className="rangs-card-form">
                          <select
                            value={campControlador}
                            onChange={e => setCampControlador(e.target.value)}
                            className="rangs-card-select"
                          >
                            <option value="">{t('admin_seccions.sense_controlador', '— Sense controlador —')}</option>
                            {campsSelect.map(c => (
                              <option key={c.name} value={c.name}>{c.label} ({c.seccioTitol})</option>
                            ))}
                          </select>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Icon name="Save" size={12} />}
                            onClick={saveCampControlador}
                            disabled={controladorSaved}
                          >
                            {t('common.desar', 'Desar')}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="rangs-card-step is-disabled">
                      <span className="rangs-card-step-num">2</span>
                      <div className="rangs-card-step-content">
                        <strong>{t('admin_seccions.rangs_paso2', 'Configura els rangs per cada valor')}</strong>
                        <p className="rangs-card-hint">{t('admin_seccions.rangs_paso2_disabled', 'Disponible un cop desat el controlador.')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {state === 'no-rangs' && (
                  <div className="rangs-card-body">
                    <div className="rangs-card-step is-done">
                      <span className="rangs-card-step-num"><Icon name="Check" size={12} /></span>
                      <div className="rangs-card-step-content">
                        <strong>{t('admin_seccions.rangs_ctrl_configurat', 'Controlador: {{camp}}', { camp: controladorField?.label || tipus.camp_controlador })}</strong>
                        <div className="rangs-card-form">
                          <select
                            value={campControlador}
                            onChange={e => setCampControlador(e.target.value)}
                            className="rangs-card-select"
                          >
                            <option value="">{t('admin_seccions.sense_controlador', '— Sense controlador —')}</option>
                            {campsSelect.map(c => (
                              <option key={c.name} value={c.name}>{c.label} ({c.seccioTitol})</option>
                            ))}
                          </select>
                          {!controladorSaved && (
                            <Button variant="primary" size="sm" icon={<Icon name="Save" size={12} />} onClick={saveCampControlador}>
                              {t('common.desar', 'Desar')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="rangs-card-step is-active">
                      <span className="rangs-card-step-num">2</span>
                      <div className="rangs-card-step-content">
                        <strong>{t('admin_seccions.rangs_paso2', 'Configura els rangs per cada valor')}</strong>
                        <p className="rangs-card-hint">
                          {t('admin_seccions.rangs_paso2_desc', 'Tens {{n}} valors a «{{camp}}» i {{c}} camps numèrics per configurar.', {
                            n: opcionsController.length,
                            camp: controladorField?.label,
                            c: campsNumTotal,
                          })}
                        </p>
                        <Link to={`/admin/tipus/${tipusId}/rangs`} className="btn btn-primary btn-sm">
                          <Icon name="Table2" size={12} />
                          <span>{t('admin_seccions.configurar_rangs', 'Configurar rangs')}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {state === 'configured' && (
                  <div className="rangs-card-body">
                    <div className="rangs-card-stats">
                      <div className="rangs-card-stat">
                        <span className="rangs-card-stat-value">{controladorField?.label}</span>
                        <span className="rangs-card-stat-label">{t('admin_seccions.rangs_stat_ctrl', 'Camp controlador')}</span>
                      </div>
                      <div className="rangs-card-stat">
                        <span className="rangs-card-stat-value">{opcionsController.length}</span>
                        <span className="rangs-card-stat-label">{t('admin_seccions.rangs_stat_valors', 'valors')}</span>
                      </div>
                      <div className="rangs-card-stat">
                        <span className="rangs-card-stat-value">{campsNumWithRang.length}/{campsNumTotal}</span>
                        <span className="rangs-card-stat-label">{t('admin_seccions.rangs_stat_camps', 'camps configurats')}</span>
                      </div>
                    </div>
                    <div className="rangs-card-actions">
                      <Link to={`/admin/tipus/${tipusId}/rangs`} className="btn btn-primary btn-sm">
                        <Icon name="Table2" size={12} />
                        <span>{t('admin_seccions.editar_rangs', 'Editar rangs')}</span>
                      </Link>
                      <details className="rangs-card-change-ctrl">
                        <summary>{t('admin_seccions.canviar_ctrl', 'Canviar controlador')}</summary>
                        <div className="rangs-card-form" style={{ marginTop: '0.5rem' }}>
                          <select
                            value={campControlador}
                            onChange={e => setCampControlador(e.target.value)}
                            className="rangs-card-select"
                          >
                            <option value="">{t('admin_seccions.sense_controlador', '— Sense controlador —')}</option>
                            {campsSelect.map(c => (
                              <option key={c.name} value={c.name}>{c.label} ({c.seccioTitol})</option>
                            ))}
                          </select>
                          <Button variant="primary" size="sm" icon={<Icon name="Save" size={12} />} onClick={saveCampControlador} disabled={controladorSaved}>
                            {t('common.desar', 'Desar')}
                          </Button>
                        </div>
                      </details>
                    </div>
                  </div>
                )}
              </article>
            )
          })()}

          {totsCamps.length > 0 && (
            <article>
              <header><strong>{t('admin_seccions.columnes_llista')}</strong></header>
              <p>{t('admin_seccions.columnes_desc')}</p>
              {seccions.filter(s => s.camps.length > 0).map(s => (
                <fieldset key={s.id}>
                  <legend><strong>{s.titol}</strong></legend>
                  {s.camps.map(c => (
                    <label key={c.name}>
                      <input
                        type="checkbox"
                        checked={columnesLlista.includes(c.name)}
                        onChange={() => toggleColumna(c.name)}
                      />
                      {c.label}
                    </label>
                  ))}
                </fieldset>
              ))}
              <button onClick={saveColumnes}>{t('admin_seccions.desar_columnes')}</button>
            </article>
          )}
        </>
      )}
    </>
  )
}
