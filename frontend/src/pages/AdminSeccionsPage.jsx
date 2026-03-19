import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { obtenirTipusAdmin, llistarSeccions, crearSeccio, editarSeccio, eliminarSeccio, editarTipus, reordenarSeccions } from '../api/admin'

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

export default function AdminSeccionsPage() {
  const { tipusId } = useParams()
  const [tipus, setTipus] = useState(null)
  const [seccions, setSeccions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ titol: '' })
  const [columnesLlista, setColumnesLlista] = useState([])

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
      await fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  function resetForm() {
    setForm({ titol: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(s) {
    setForm({ titol: s.titol })
    setEditingId(s.id)
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const data = { titol: form.titol }
    try {
      if (editingId) {
        await editarSeccio(editingId, data)
      } else {
        await crearSeccio(tipusId, data)
      }
      resetForm()
      await fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id, titol) {
    if (!confirm(`Eliminar seccio "${titol}" i tots els seus camps?`)) return
    try {
      await eliminarSeccio(id)
      await fetchData()
    } catch (err) {
      setError(err.message)
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

  if (loading) return <p aria-busy="true">Carregant...</p>
  if (!tipus) return <p>Tipus no trobat.</p>

  return (
    <>
      <nav aria-label="breadcrumb">
        <ul>
          <li><Link to="/admin">Tipus</Link></li>
          <li>{tipus.nom}</li>
        </ul>
      </nav>

      <hgroup>
        <h1>Seccions de {tipus.nom}</h1>
        <p>Gestiona les seccions i els seus camps. Arrossega per reordenar.</p>
      </hgroup>

      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}

      <button onClick={() => { resetForm(); setShowForm(!showForm) }}>
        {showForm ? 'Cancel·lar' : 'Nova seccio'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend><strong>{editingId ? 'Editar seccio' : 'Nova seccio'}</strong></legend>
            <label>
              Titol
              <input
                type="text"
                value={form.titol}
                onChange={e => setForm({ ...form, titol: e.target.value })}
                required
              />
            </label>
            <button type="submit">{editingId ? 'Desar canvis' : 'Crear'}</button>
          </fieldset>
        </form>
      )}

      {seccions.length === 0 ? (
        <p>No hi ha seccions. Crea'n una per comencar.</p>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '3rem' }}></th>
                  <th>Titol</th>
                  <th>Camps</th>
                  <th>Accions</th>
                </tr>
              </thead>
              <SortableContext items={seccions.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {seccions.map(s => (
                    <SortableRow key={s.id} id={s.id}>
                      <td><strong>{s.titol}</strong></td>
                      <td>{s.camps.length}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link to={`/admin/seccions/${s.id}/camps`} role="button" className="outline">
                            Camps
                          </Link>
                          <button className="outline" onClick={() => startEdit(s)}>Editar</button>
                          <button className="outline secondary" onClick={() => handleDelete(s.id, s.titol)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </SortableRow>
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>

          {totsCamps.length > 0 && (
            <article>
              <header><strong>Columnes de la llista</strong></header>
              <p>Selecciona quins camps es mostren a la taula de la llista d'analisis:</p>
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
              <button onClick={saveColumnes}>Desar columnes</button>
            </article>
          )}
        </>
      )}
    </>
  )
}
