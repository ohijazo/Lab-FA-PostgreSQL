import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { llistarUsers, crearUser, editarUser, eliminarUser } from '../api/admin'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ email: '', nom: '', password: '', role: 'user' })

  async function fetchData() {
    setLoading(true)
    try {
      setUsers(await llistarUsers())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  function resetForm() {
    setForm({ email: '', nom: '', password: '', role: 'user' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(u) {
    setForm({ email: u.email, nom: u.nom, password: '', role: u.role })
    setEditingId(u.id)
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      if (editingId) {
        const data = { email: form.email, nom: form.nom, role: form.role }
        if (form.password) data.password = form.password
        await editarUser(editingId, data)
      } else {
        await crearUser(form)
      }
      resetForm()
      await fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id, email) {
    if (!confirm(`Segur que vols eliminar l'usuari "${email}"?`)) return
    try {
      await eliminarUser(id)
      await fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p aria-busy="true">Carregant...</p>

  return (
    <>
      <nav aria-label="breadcrumb">
        <ul>
          <li><Link to="/admin">Configuracio</Link></li>
          <li>Usuaris</li>
        </ul>
      </nav>

      <hgroup>
        <h1>Gestio d'usuaris</h1>
        <p>Crea, edita o elimina usuaris del sistema</p>
      </hgroup>

      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}

      <button onClick={() => { resetForm(); setShowForm(!showForm) }}>
        {showForm ? 'Cancel·lar' : 'Nou usuari'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend><strong>{editingId ? 'Editar usuari' : 'Nou usuari'}</strong></legend>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemple.com"
                required
              />
            </label>
            <label>
              Nom complet
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                required
              />
            </label>
            <label>
              Contrasenya{editingId ? ' (deixa buit per no canviar)' : ''}
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required={!editingId}
              />
            </label>
            <label>
              Rol
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="user">Usuari</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <button type="submit">{editingId ? 'Desar canvis' : 'Crear'}</button>
          </fieldset>
        </form>
      )}

      {users.length === 0 ? (
        <p>No hi ha usuaris.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Nom</th>
              <th>Rol</th>
              <th>Accions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td><strong>{u.nom}</strong></td>
                <td>{u.role === 'admin' ? 'Administrador' : 'Usuari'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="outline" onClick={() => startEdit(u)}>Editar</button>
                    <button className="outline secondary" onClick={() => handleDelete(u.id, u.email)}>
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
