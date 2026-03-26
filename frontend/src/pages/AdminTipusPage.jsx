import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { llistarTipusAdmin, crearTipus, editarTipus, eliminarTipus, descarregarPlantilla, duplicarTipus, obtenirEstadistiques } from '../api/admin'
import { useToast } from '../context/ToastContext'

export default function AdminTipusPage() {
  const { t, i18n } = useTranslation()
  const { addToast } = useToast()
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
    if (!confirm(t('admin_tipus.confirm_duplicar', { nom }))) return
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
    if (!confirm(t('admin_tipus.confirm_eliminar', { nom }))) return
    try {
      await eliminarTipus(id)
      addToast(t('admin_tipus.tipus_eliminat'))
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading) return <p aria-busy="true">{t('common.carregant')}</p>

  return (
    <>
      <hgroup>
        <h1>{t('admin_tipus.titol')}</h1>
        <p>{t('admin_tipus.subtitol')}</p>
      </hgroup>

      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}

      <button onClick={() => { resetForm(); setShowForm(!showForm) }}>
        {showForm ? t('common.cancellar') : t('admin_tipus.nou_tipus')}
      </button>

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
        <p>{t('admin_tipus.no_tipus')}</p>
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
                      <Link to={`/admin/tipus/${tp.id}/seccions`} role="button" className="outline btn-sm" title={t('admin_tipus.title_seccions')}>
                        {t('admin_tipus.seccions')}
                      </Link>
                      <button className="outline btn-sm" onClick={() => startEdit(tp)} title={t('admin_tipus.title_editar')}>
                        {t('common.editar')}
                      </button>
                      <button className="outline btn-sm" onClick={() => handleDuplicar(tp.id, tp.nom)} title={t('admin_tipus.title_duplicar')}>
                        {t('common.duplicar')}
                      </button>
                      <button className="outline secondary btn-sm" onClick={() => handleDelete(tp.id, tp.nom)} title={t('admin_tipus.title_eliminar')}>
                        {t('common.eliminar')}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="admin-actions-row">
                      <button className="outline contrast btn-xs" onClick={() => handlePlantilla(tp.id)} title={t('admin_tipus.title_plantilla')}>
                        {t('admin_tipus.descarregar_plantilla')}
                      </button>
                      <Link to={`/admin/tipus/${tp.id}/import`} role="button" className="contrast btn-xs" title={t('admin_tipus.title_importar')}>
                        {t('admin_tipus.importar_dades')}
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
