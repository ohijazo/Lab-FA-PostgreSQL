import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { llistarTipusAdmin, crearTipus, editarTipus, eliminarTipus } from '../api/admin'

export default function AdminTipusPage() {
  const [tipus, setTipus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nom: '', descripcio: '' })

  async function fetchData() {
    setLoading(true)
    try {
      setTipus(await llistarTipusAdmin())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  function resetForm() {
    setForm({ nom: '', descripcio: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(t) {
    setForm({ nom: t.nom, descripcio: t.descripcio || '' })
    setEditingId(t.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      if (editingId) {
        await editarTipus(editingId, form)
      } else {
        await crearTipus(form)
      }
      resetForm()
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleDelete(id, nom) {
    if (!confirm(`Segur que vols eliminar "${nom}"? S'eliminaran totes les seccions i camps associats.`)) return
    try {
      await eliminarTipus(id)
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading) return <p aria-busy="true">Carregant...</p>

  return (
    <>
      <hgroup>
        <h1>Configuracio - Tipus d'analisi</h1>
        <p>Gestiona els tipus d'analisi, les seves seccions i camps</p>
      </hgroup>

      <p><Link to="/admin/users" role="button" className="outline">Gestionar usuaris</Link></p>

      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}

      <button onClick={() => { resetForm(); setShowForm(!showForm) }}>
        {showForm ? 'Cancel·lar' : 'Nou tipus'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend><strong>{editingId ? 'Editar tipus' : 'Nou tipus'}</strong></legend>
            <label>
              Nom
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                required
              />
            </label>
            <label>
              Descripcio
              <input
                type="text"
                value={form.descripcio}
                onChange={e => setForm({ ...form, descripcio: e.target.value })}
              />
            </label>
            <button type="submit">{editingId ? 'Desar canvis' : 'Crear'}</button>
          </fieldset>
        </form>
      )}

      {tipus.length === 0 ? (
        <p>No hi ha tipus d'analisi. Crea'n un per comencar.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Slug</th>
              <th>Descripcio</th>
              <th>Accions</th>
            </tr>
          </thead>
          <tbody>
            {tipus.map(t => (
              <tr key={t.id}>
                <td><strong>{t.nom}</strong></td>
                <td><code>{t.slug}</code></td>
                <td>{t.descripcio}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/admin/tipus/${t.id}/seccions`} role="button" className="outline">
                      Seccions
                    </Link>
                    <button className="outline" onClick={() => startEdit(t)}>Editar</button>
                    <button className="outline secondary" onClick={() => handleDelete(t.id, t.nom)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
