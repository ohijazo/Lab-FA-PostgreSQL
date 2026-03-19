import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { llistarAnalisis, obtenirConfig } from '../api/analisis'
import AnalisisList from '../components/AnalisisList'

export default function LlistaPage() {
  const { tipus } = useParams()
  const [config, setConfig] = useState(null)
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortCol, setSortCol] = useState('')
  const [sortDir, setSortDir] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cfg, result] = await Promise.all([
        obtenirConfig(tipus),
        llistarAnalisis(tipus, { page, q, sort: sortCol, sort_dir: sortDir }),
      ])
      setConfig(cfg)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tipus, page, q, sortCol, sortDir])

  useEffect(() => {
    setPage(1)
    setQ('')
    setSearchInput('')
    setSortCol('')
    setSortDir('')
  }, [tipus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    setQ(searchInput)
  }

  function handleSort(col) {
    setPage(1)
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  if (loading && !config) return <p aria-busy="true">Carregant...</p>
  if (error) return <p>Error: {error}</p>
  if (!config) return <p>Tipus no trobat.</p>

  return (
    <>
      <hgroup>
        <h1>{config.nom}</h1>
        <p>{data.total} anàlisis</p>
      </hgroup>

      <div className="grid" style={{ alignItems: 'center' }}>
        <form onSubmit={handleSearch} role="search" style={{ marginBottom: 0 }}>
          <input
            type="search"
            placeholder="Cercar..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Link to={`/${tipus}/nou`} role="button">Nova anàlisi</Link>
      </div>

      {loading ? (
        <p aria-busy="true">Carregant...</p>
      ) : (
        <>
          <AnalisisList
            tipus={tipus}
            analisis={data.items}
            columnes={config.columnes_llista}
            seccions={config.seccions}
            sortCol={sortCol}
            sortDir={sortDir}
            onSort={handleSort}
          />
          {data.pages > 1 && (
            <nav className="pagination">
              <button
                className="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <span>Pàgina {data.page} de {data.pages}</span>
              <button
                className="outline"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Següent
              </button>
            </nav>
          )}
        </>
      )}
    </>
  )
}
