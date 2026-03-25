import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { llistarTipusAdmin, crearTipus, editarTipus, eliminarTipus, descarregarPlantilla, duplicarTipus, obtenirEstadistiques } from '../api/admin'
import { useToast } from '../context/ToastContext'

export default function AdminTipusPage() {
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
        addToast('Tipus actualitzat')
      } else {
        await crearTipus(form)
        addToast('Tipus creat')
      }
      resetForm()
      await fetchData()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleDuplicar(id, nom) {
    if (!confirm(`Duplicar "${nom}" amb totes les seves seccions i camps?`)) return
    try {
      await duplicarTipus(id)
      addToast('Tipus duplicat')
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
    if (!confirm(`Segur que vols eliminar "${nom}"? S'eliminaran totes les seccions i camps associats.`)) return
    try {
      await eliminarTipus(id)
      addToast('Tipus eliminat')
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
              <th>Analisis</th>
              <th>Ultima</th>
              <th>Accions</th>
              <th>Dades</th>
            </tr>
          </thead>
          <tbody>
            {tipus.map(t => {
              const st = getStats(t.id)
              return (
                <tr key={t.id}>
                  <td><strong>{t.nom}</strong></td>
                  <td><code>{t.slug}</code></td>
                  <td>{t.descripcio}</td>
                  <td>{st.total_analisis}</td>
                  <td>{st.ultima_analisi ? new Date(st.ultima_analisi).toLocaleDateString('ca-ES') : '—'}</td>
                  <td>
                    <div className="admin-actions-row">
                      <Link to={`/admin/tipus/${t.id}/seccions`} role="button" className="outline btn-sm" title="Gestionar les seccions i camps d'aquest tipus">
                        Seccions
                      </Link>
                      <button className="outline btn-sm" onClick={() => startEdit(t)} title="Editar el nom i la descripció del tipus">
                        Editar
                      </button>
                      <button className="outline btn-sm" onClick={() => handleDuplicar(t.id, t.nom)} title="Crear una còpia d'aquest tipus amb totes les seccions i camps">
                        Duplicar
                      </button>
                      <button className="outline secondary btn-sm" onClick={() => handleDelete(t.id, t.nom)} title="Eliminar el tipus i totes les seves seccions i camps">
                        Eliminar
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="admin-actions-row">
                      <button className="outline contrast btn-xs" onClick={() => handlePlantilla(t.id)} title="Descarrega un Excel buit amb les capçaleres correctes per omplir i després importar les dades">
                        Descarregar Plantilla
                      </button>
                      <Link to={`/admin/tipus/${t.id}/import`} role="button" className="contrast btn-xs" title="Importa dades des d'un Excel. Utilitza la plantilla per assegurar el format correcte">
                        Importar Dades
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
