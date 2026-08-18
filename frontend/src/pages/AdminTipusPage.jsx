import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { llistarTipusAdmin, crearTipus, editarTipus, eliminarTipus, descarregarPlantilla, duplicarTipus, obtenirEstadistiques } from '../api/admin'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Icon from '../components/Icon'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import LoadingBlock from '../components/ui/LoadingBlock'
import TableSkeleton from '../components/ui/TableSkeleton'

export default function AdminTipusPage() {
  const { t, i18n } = useTranslation()
  const { addToast } = useToast()
  const confirm = useConfirm()
  const [tipus, setTipus] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nom: '', descripcio: '' })

  async function fetchData() {
    setLoading(true)
    try {
      const [t, s] = await Promise.all([llistarTipusAdmin(), obtenirEstadistiques()])
      setTipus(t)
      setStats(s)
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
        addToast(t('admin_tipus.tipus_actualitzat'))
      } else {
        await crearTipus(form)
        addToast(t('admin_tipus.tipus_creat'))
      }
      resetForm()
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleDuplicar(id, nom) {
    const ok = await confirm({
      title: t('common.duplicar'),
      message: t('admin_tipus.confirm_duplicar', { nom }),
      confirmLabel: t('common.duplicar'),
      cancelLabel: t('common.cancellar'),
    })
    if (!ok) return
    try {
      await duplicarTipus(id)
      addToast(t('admin_tipus.tipus_duplicat'))
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handlePlantilla(id) {
    try {
      await descarregarPlantilla(id)
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function getStats(tipusId) {
    return stats.find(s => s.id === tipusId) || { total_analisis: 0, ultima_analisi: null }
  }

  async function handleDelete(id, nom) {
    const ok = await confirm({
      title: t('common.eliminar'),
      message: <Trans i18nKey="admin_tipus.confirm_eliminar" values={{ nom }} components={{ 1: <strong /> }} />,
      confirmLabel: t('common.eliminar'),
      cancelLabel: t('common.cancellar'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await eliminarTipus(id)
      addToast(t('admin_tipus.tipus_eliminat'))
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading) return <TableSkeleton rows={6} />

  return (
    <>
      <div className="admin-header">
        <hgroup>
          <h1>{t('admin_tipus.titol')}</h1>
          <p>{t('admin_tipus.subtitol')}</p>
        </hgroup>
        <div className="admin-header-actions">
          <button
            className={showForm ? 'secondary' : ''}
            onClick={() => { resetForm(); setShowForm(!showForm) }}
          >
            {showForm ? t('common.cancellar') : t('admin_tipus.nou_tipus')}
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
            <legend><strong>{editingId ? t('admin_tipus.editar_tipus') : t('admin_tipus.nou_tipus')}</strong></legend>
            <label>
              {t('common.nom')}
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                required
              />
            </label>
            <label>
              {t('admin_tipus.descripcio')}
              <input
                type="text"
                value={form.descripcio}
                onChange={e => setForm({ ...form, descripcio: e.target.value })}
              />
            </label>
            <button type="submit">{editingId ? t('common.desar_canvis') : t('common.crear')}</button>
          </fieldset>
        </form>
      )}

      {tipus.length === 0 ? (
        <EmptyState
          icon={<Icon name="Layers" size={40} />}
          title={t('admin_tipus.no_tipus')}
          description={t('admin_tipus.no_tipus_desc')}
          action={
            <Button
              variant="primary"
              icon={<Icon name="Plus" size={14} />}
              onClick={() => { resetForm(); setShowForm(true) }}
            >
              {t('admin_tipus.crear_primer_tipus')}
            </Button>
          }
        />
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('common.nom')}</th>
              <th>{t('admin_tipus.slug')}</th>
              <th>{t('admin_tipus.descripcio')}</th>
              <th>{t('admin_tipus.analisis')}</th>
              <th>{t('admin_tipus.ultima')}</th>
              <th>{t('common.accions')}</th>
              <th>{t('admin_tipus.dades')}</th>
            </tr>
          </thead>
          <tbody>
            {tipus.map(tp => {
              const st = getStats(tp.id)
              return (
                <tr key={tp.id}>
                  <td><strong>{tp.nom}</strong></td>
                  <td><code>{tp.slug}</code></td>
                  <td>{tp.descripcio}</td>
                  <td>{st.total_analisis}</td>
                  <td>{st.ultima_analisi ? new Date(st.ultima_analisi).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'ca-ES') : '—'}</td>
                  <td>
                    <div className="admin-actions-row">
                      <Link to={`/admin/tipus/${tp.id}/seccions`} className="btn btn-outline btn-sm" title={t('admin_tipus.title_seccions')}>
                        <Icon name="Layers" size={12} />
                        <span>{t('admin_tipus.seccions')}</span>
                      </Link>
                      <Button variant="ghost" size="sm" icon={<Icon name="Pencil" size={12} />} onClick={() => startEdit(tp)} title={t('admin_tipus.title_editar')}>
                        {t('common.editar')}
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Icon name="Copy" size={12} />} onClick={() => handleDuplicar(tp.id, tp.nom)} title={t('admin_tipus.title_duplicar')}>
                        {t('common.duplicar')}
                      </Button>
                      <Button variant="danger" size="sm" icon={<Icon name="Trash2" size={12} />} onClick={() => handleDelete(tp.id, tp.nom)} title={t('admin_tipus.title_eliminar')}>
                        {t('common.eliminar')}
                      </Button>
                    </div>
                  </td>
                  <td>
                    <div className="admin-actions-row">
                      <Button variant="ghost" size="sm" icon={<Icon name="FileDown" size={12} />} onClick={() => handlePlantilla(tp.id)} title={t('admin_tipus.title_plantilla')}>
                        {t('admin_tipus.descarregar_plantilla')}
                      </Button>
                      <Link to={`/admin/tipus/${tp.id}/import`} className="btn btn-outline btn-sm" title={t('admin_tipus.title_importar')}>
                        <Icon name="Upload" size={12} />
                        <span>{t('admin_tipus.importar_dades')}</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </>
  )
}
