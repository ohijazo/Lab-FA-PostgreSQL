import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { llistarUsers, crearUser, editarUser, eliminarUser } from '../api/admin'
import { useToast } from '../context/ToastContext'

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ email: '', nom: '', password: '', role: 'user' })
  const [showPassword, setShowPassword] = useState(false)

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
    setShowPassword(false)
  }

  function startEdit(u) {
    setForm({ email: u.email, nom: u.nom, password: '', role: u.role })
    setEditingId(u.id)
    setShowForm(true)
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
        addToast(t('admin_users.usuari_actualitzat'))
      } else {
        await crearUser(form)
        addToast(t('admin_users.usuari_creat'))
      }
      resetForm()
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleDelete(id, email) {
    if (!confirm(t('admin_users.confirm_eliminar', { email }))) return
    try {
      await eliminarUser(id)
      addToast(t('admin_users.usuari_eliminat'))
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading) return <p aria-busy="true">{t('common.carregant')}</p>

  return (
    <>
      <nav aria-label="breadcrumb">
        <ul>
          <li><Link to="/admin/tipus">{t('admin_users.breadcrumb_config')}</Link></li>
          <li>{t('admin_users.breadcrumb_usuaris')}</li>
        </ul>
      </nav>

      <hgroup>
        <h1>{t('admin_users.titol')}</h1>
        <p>{t('admin_users.subtitol')}</p>
      </hgroup>

      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}

      <button onClick={() => { resetForm(); setShowForm(!showForm) }}>
        {showForm ? t('common.cancellar') : t('admin_users.nou_usuari')}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend><strong>{editingId ? t('admin_users.editar_usuari') : t('admin_users.nou_usuari')}</strong></legend>
            <label>
              {t('admin_users.email')}
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder={t('admin_users.placeholder_email')}
                required
              />
            </label>
            <label>
              {t('admin_users.nom_complet')}
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                required
              />
            </label>
            <label>
              {editingId ? t('admin_users.contrasenya_editar') : t('admin_users.contrasenya')}
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword
                    ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </label>
            <label>
              {t('admin_users.rol')}
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="user">{t('admin_users.rol_editor')}</option>
                <option value="admin">{t('admin_users.rol_admin')}</option>
                <option value="viewer">{t('admin_users.rol_lectura')}</option>
              </select>
            </label>
            <button type="submit">{editingId ? t('common.desar_canvis') : t('common.crear')}</button>
          </fieldset>
        </form>
      )}

      {users.length === 0 ? (
        <p>{t('admin_users.no_usuaris')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('admin_users.email')}</th>
              <th>{t('common.nom')}</th>
              <th>{t('admin_users.rol')}</th>
              <th>{t('common.accions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td><strong>{u.nom}</strong></td>
                <td>{u.role === 'admin' ? t('admin_users.rol_admin') : u.role === 'viewer' ? t('admin_users.rol_lectura') : t('admin_users.rol_editor')}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="outline btn-sm" onClick={() => startEdit(u)} title={t('admin_users.title_editar')}>{t('common.editar')}</button>
                    <button className="outline secondary btn-sm" onClick={() => handleDelete(u.id, u.email)} title={t('admin_users.title_eliminar')}>
                      {t('common.eliminar')}
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
