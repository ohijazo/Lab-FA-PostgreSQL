import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { llistarUsers, crearUser, editarUser, eliminarUser } from '../api/admin'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Icon from '../components/Icon'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import LoadingBlock from '../components/ui/LoadingBlock'

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const confirm = useConfirm()
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
    const ok = await confirm({
      title: t('common.eliminar'),
      message: t('admin_users.confirm_eliminar', { email }),
      confirmLabel: t('common.eliminar'),
      cancelLabel: t('common.cancellar'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await eliminarUser(id)
      addToast(t('admin_users.usuari_eliminat'))
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading) return <LoadingBlock label={t('common.carregant')} />

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t('admin_users.breadcrumb_config'), to: '/admin/tipus' },
          { label: t('admin_users.breadcrumb_usuaris') },
        ]}
      />

      <div className="admin-header">
        <hgroup>
          <h1>{t('admin_users.titol')}</h1>
          <p>{t('admin_users.subtitol')}</p>
        </hgroup>
        <div className="admin-header-actions">
          <Button
            variant={showForm ? 'ghost' : 'primary'}
            icon={<Icon name={showForm ? 'X' : 'UserPlus'} size={14} />}
            onClick={() => { resetForm(); setShowForm(!showForm) }}
          >
            {showForm ? t('common.cancellar') : t('admin_users.nou_usuari')}
          </Button>
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
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label={showPassword ? 'Amagar' : 'Mostrar'}>
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
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
        <EmptyState
          icon={<Icon name="Users" size={40} />}
          title={t('admin_users.no_usuaris')}
          description={t('admin_users.no_usuaris_desc')}
          action={
            <Button
              variant="primary"
              icon={<Icon name="Plus" size={14} />}
              onClick={() => { resetForm(); setShowForm(true) }}
            >
              {t('admin_users.crear_primer_usuari')}
            </Button>
          }
        />
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
                  <div className="admin-actions-row">
                    <Button variant="ghost" size="sm" icon={<Icon name="Pencil" size={12} />} onClick={() => startEdit(u)} title={t('admin_users.title_editar')}>
                      {t('common.editar')}
                    </Button>
                    <Button variant="danger" size="sm" icon={<Icon name="Trash2" size={12} />} onClick={() => handleDelete(u.id, u.email)} title={t('admin_users.title_eliminar')}>
                      {t('common.eliminar')}
                    </Button>
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
