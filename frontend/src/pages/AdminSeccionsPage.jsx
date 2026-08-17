import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { obtenirTipusAdmin, llistarSeccions, crearSeccio, editarSeccio, eliminarSeccio, editarTipus, reordenarSeccions } from '../api/admin'
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
      message: t('admin_seccions.confirm_eliminar', { titol }),
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

  if (loading) return <LoadingBlock label={t('common.carregant')} />
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

          {campsSelect.length > 0 && (
            <article>
              <header><strong>{t('admin_seccions.rangs_condicionals', 'Rangs condicionals')}</strong></header>
              <p>{t('admin_seccions.rangs_condicionals_desc', 'Selecciona el camp que determina els rangs de min/max per altres camps numèrics.')}</p>
              <div className="admin-inline-row">
                <label className="admin-inline-field">
                  {t('admin_seccions.camp_controlador', 'Camp controlador')}
                  <select
                    value={campControlador}
                    onChange={e => setCampControlador(e.target.value)}
                  >
                    <option value="">{t('admin_seccions.sense_controlador', '— Sense controlador —')}</option>
                    {campsSelect.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.label} ({c.seccioTitol})
                      </option>
                    ))}
                  </select>
                </label>
                <Button variant="primary" size="sm" icon={<Icon name="Save" size={12} />} onClick={saveCampControlador}>
                  {t('common.desar', 'Desar')}
                </Button>
                {campControlador && (
                  <Link to={`/admin/tipus/${tipusId}/rangs`} className="btn btn-outline btn-sm">
                    <Icon name="Table2" size={12} />
                    <span>{t('admin_seccions.taula_rangs', 'Taula de rangs')}</span>
                  </Link>
                )}
              </div>
            </article>
          )}

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
