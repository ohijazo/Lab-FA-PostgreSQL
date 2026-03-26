import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { llistarUsers, crearUser, editarUser, eliminarUser } from '../api/admin'
import { useToast } from '../context/ToastContext'

export default function AdminUsersPage() {
  const { addToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ email: '', nom: '', password: '', role: 'user' })
  const [emailUserId, setEmailUserId] = useState(null)
  const [emailForm, setEmailForm] = useState({ email_from_name: '', email_from_address: '', email_smtp_password: '' })

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
    setEmailUserId(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startEmailConfig(u) {
    setEmailForm({
      email_from_name: u.email_from_name || '',
      email_from_address: u.email_from_address || '',
      email_smtp_password: u.email_configurat ? '••••••••' : '',
    })
    setEmailUserId(u.id)
    setShowForm(false)
    setEditingId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      if (editingId) {
        const data = { email: form.email, nom: form.nom, role: form.role }
        if (form.password) data.password = form.password
        await editarUser(editingId, data)
        addToast('Usuari actualitzat')
      } else {
        await crearUser(form)
        addToast('Usuari creat')
      }
      resetForm()
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await editarUser(emailUserId, emailForm)
      addToast('Configuració de correu desada')
      setEmailUserId(null)
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleDelete(id, email) {
    if (!confirm(`Segur que vols eliminar l'usuari "${email}"?`)) return
    try {
      await eliminarUser(id)
      addToast('Usuari eliminat')
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading) return <p aria-busy="true">Carregant...</p>

  const emailUser = users.find(u => u.id === emailUserId)

  return (
    <>
      <nav aria-label="breadcrumb">
        <ul>
          <li><Link to="/admin/tipus">Configuracio</Link></li>
          <li>Usuaris</li>
        </ul>
      </nav>

      <hgroup>
        <h1>Gestio d'usuaris</h1>
        <p>Crea, edita o elimina usuaris del sistema</p>
      </hgroup>

      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}

      <button onClick={() => { resetForm(); setEmailUserId(null); setShowForm(!showForm) }}>
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
                <option value="user">Editor</option>
                <option value="admin">Administrador</option>
                <option value="viewer">Lectura</option>
              </select>
            </label>
            <button type="submit">{editingId ? 'Desar canvis' : 'Crear'}</button>
          </fieldset>
        </form>
      )}

      {emailUserId && emailUser && (
        <form onSubmit={handleEmailSubmit}>
          <fieldset>
            <legend><strong>Configuració de correu — {emailUser.nom}</strong></legend>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
              Configura les dades per enviar anàlisis per correu electrònic via Microsoft 365.
              El servidor SMTP (<code>smtp.office365.com:587</code>) és comú per a tots els usuaris.
            </p>
            <label>
              Nom del remitent
              <input
                type="text"
                value={emailForm.email_from_name}
                onChange={e => setEmailForm({ ...emailForm, email_from_name: e.target.value })}
                placeholder={emailUser.nom}
              />
              <small>El nom que apareixerà com a remitent del correu</small>
            </label>
            <label>
              Email del remitent
              <input
                type="email"
                value={emailForm.email_from_address}
                onChange={e => setEmailForm({ ...emailForm, email_from_address: e.target.value })}
                placeholder={emailUser.email}
              />
              <small>L'adreça que apareixerà com a remitent (pot ser un àlies)</small>
            </label>
            <label>
              Contrasenya SMTP (App Password de M365)
              <input
                type="password"
                value={emailForm.email_smtp_password}
                onChange={e => setEmailForm({ ...emailForm, email_smtp_password: e.target.value })}
                placeholder="Contrasenya d'aplicació de Microsoft 365"
              />
              <small>Necessària per autenticar-se al servidor de correu</small>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit">Desar configuració</button>
              <button type="button" className="outline secondary" onClick={() => setEmailUserId(null)}>Cancel·lar</button>
            </div>
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
              <th>Correu</th>
              <th>Accions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td><strong>{u.nom}</strong></td>
                <td>{u.role === 'admin' ? 'Administrador' : u.role === 'viewer' ? 'Lectura' : 'Editor'}</td>
                <td>
                  {u.email_configurat
                    ? <span style={{ color: '#059669', fontSize: '0.8rem' }} title="Correu configurat">Configurat</span>
                    : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }} title="Correu no configurat">No configurat</span>
                  }
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="outline btn-sm" onClick={() => startEdit(u)} title="Editar les dades de l'usuari">Editar</button>
                    <button className="outline btn-sm" onClick={() => startEmailConfig(u)} title="Configurar el correu electrònic d'aquest usuari">Correu</button>
                    <button className="outline secondary btn-sm" onClick={() => handleDelete(u.id, u.email)} title="Eliminar aquest usuari">
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
