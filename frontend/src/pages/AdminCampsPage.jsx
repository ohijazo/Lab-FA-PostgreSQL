import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { llistarCamps, crearCamp, editarCamp, eliminarCamp, reordenarCamps } from '../api/admin'

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
  const { seccioId } = useParams()
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', label: '', type: 'text', required: false })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  async function fetchData() {
    setLoading(true)
    try {
      setCamps(await llistarCamps(seccioId))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [seccioId])

  function resetForm() {
    setForm({ name: '', label: '', type: 'text', required: false })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(c) {
    setForm({
      name: c.name,
      label: c.label,
      type: c.type,
      required: c.required,
    })
    setEditingId(c.id)
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const data = {
      name: form.name,
      label: form.label,
      type: form.type,
      required: form.required,
    }
    try {
      if (editingId) {
        await editarCamp(editingId, data)
      } else {
        await crearCamp(seccioId, data)
      }
      resetForm()
      await fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id, label) {
    if (!confirm(`Eliminar camp "${label}"?`)) return
    try {
      await eliminarCamp(id)
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

  if (loading) return <p aria-busy="true">Carregant...</p>

  return (
    <>
      <nav aria-label="breadcrumb">
        <ul>
          <li><Link to="/admin">Tipus</Link></li>
          <li><Link to="#" onClick={() => history.back()}>Seccions</Link></li>
          <li>Camps</li>
        </ul>
      </nav>

      <hgroup>
        <h1>Camps</h1>
        <p>Gestiona els camps d'aquesta seccio. Arrossega per reordenar.</p>
      </hgroup>

      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}

      <button onClick={() => { resetForm(); setShowForm(!showForm) }}>
        {showForm ? 'Cancel·lar' : 'Nou camp'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend><strong>{editingId ? 'Editar camp' : 'Nou camp'}</strong></legend>
            <div className="grid">
              <label>
                Nom (intern)
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="humitat_perc"
                />
              </label>
              <label>
                Etiqueta
                <input
                  type="text"
                  value={form.label}
                  onChange={e => setForm({ ...form, label: e.target.value })}
                  required
                  placeholder="Humitat %"
                />
              </label>
            </div>
            <div className="grid">
              <label>
                Tipus
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="text">Text</option>
                  <option value="number">Numero</option>
                  <option value="date">Data</option>
                  <option value="textarea">Text llarg</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </label>
            </div>
            <label>
              <input
                type="checkbox"
                checked={form.required}
                onChange={e => setForm({ ...form, required: e.target.checked })}
                role="switch"
              />
              Obligatori
            </label>
            <button type="submit">{editingId ? 'Desar canvis' : 'Crear'}</button>
          </fieldset>
        </form>
      )}

      {camps.length === 0 ? (
        <p>No hi ha camps. Crea'n un per comencar.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '3rem' }}></th>
                <th>Nom</th>
                <th>Etiqueta</th>
                <th>Tipus</th>
                <th>Obligatori</th>
                <th>Accions</th>
              </tr>
            </thead>
            <SortableContext items={camps.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {camps.map(c => (
                  <SortableRow key={c.id} id={c.id}>
                    <td><code>{c.name}</code></td>
                    <td>{c.label}</td>
                    <td>{c.type}</td>
                    <td>{c.required ? 'Si' : 'No'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="outline" onClick={() => startEdit(c)}>Editar</button>
                        <button className="outline secondary" onClick={() => handleDelete(c.id, c.label)}>
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
      )}
    </>
  )
}
