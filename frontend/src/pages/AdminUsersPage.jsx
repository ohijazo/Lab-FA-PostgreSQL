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

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await editarUser(emailUserId, emailForm)
      addToast(t('admin_users.config_correu_desada'))
      setEmailUserId(null)
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

  const emailUser = users.find(u => u.id === emailUserId)

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

      <button onClick={() => { resetForm(); setEmailUserId(null); setShowForm(!showForm) }}>
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
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required={!editingId}
              />
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

      {emailUserId && emailUser && (
        <form onSubmit={handleEmailSubmit}>
          <fieldset>
            <legend><strong>{t('admin_users.config_correu', { nom: emailUser.nom })}</strong></legend>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
              {t('admin_users.config_correu_desc', { 1: 'smtp.office365.com:587' })}
            </p>
            <label>
              {t('admin_users.nom_remitent')}
              <input
                type="text"
                value={emailForm.email_from_name}
                onChange={e => setEmailForm({ ...emailForm, email_from_name: e.target.value })}
                placeholder={emailUser.nom}
              />
              <small>{t('admin_users.nom_remitent_desc')}</small>
            </label>
            <label>
              {t('admin_users.email_remitent')}
              <input
                type="email"
                value={emailForm.email_from_address}
                onChange={e => setEmailForm({ ...emailForm, email_from_address: e.target.value })}
                placeholder={emailUser.email}
              />
              <small>{t('admin_users.email_remitent_desc')}</small>
            </label>
            <label>
              {t('admin_users.contrasenya_smtp')}
              <input
                type="password"
                value={emailForm.email_smtp_password}
                onChange={e => setEmailForm({ ...emailForm, email_smtp_password: e.target.value })}
                placeholder={t('admin_users.contrasenya_smtp_placeholder')}
              />
              <small>{t('admin_users.contrasenya_smtp_desc')}</small>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit">{t('admin_users.desar_config')}</button>
              <button type="button" className="outline secondary" onClick={() => setEmailUserId(null)}>{t('common.cancellar')}</button>
            </div>
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
              <th>{t('admin_users.correu')}</th>
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
                  {u.email_configurat
                    ? <span style={{ color: '#059669', fontSize: '0.8rem' }} title={t('admin_users.correu_configurat')}>{t('admin_users.correu_configurat')}</span>
                    : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }} title={t('admin_users.correu_no_configurat')}>{t('admin_users.correu_no_configurat')}</span>
                  }
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="outline btn-sm" onClick={() => startEdit(u)} title={t('admin_users.title_editar')}>{t('common.editar')}</button>
                    <button className="outline btn-sm" onClick={() => startEmailConfig(u)} title={t('admin_users.title_correu')}>{t('admin_users.correu')}</button>
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
