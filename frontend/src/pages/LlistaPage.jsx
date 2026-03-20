import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { llistarAnalisis, obtenirConfig } from '../api/analisis'
import AnalisisList from '../components/AnalisisList'
import { useAuth } from '../context/AuthContext'

export default function LlistaPage() {
  const { tipus } = useParams()
  const { user } = useAuth()
  const isViewer = user?.role === 'viewer'
  const [config, setConfig] = useState(null)
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortCol, setSortCol] = useState('')
  const [sortDir, setSortDir] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({})

  const dialogRef = useRef(null)
  const [exportDateFrom, setExportDateFrom] = useState('')
  const [exportDateTo, setExportDateTo] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cfg, result] = await Promise.all([
        obtenirConfig(tipus),
        llistarAnalisis(tipus, { page, q, sort: sortCol, sort_dir: sortDir, filters }),
      ])
      setConfig(cfg)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tipus, page, q, sortCol, sortDir, filters])

  useEffect(() => {
    setPage(1)
    setQ('')
    setSearchInput('')
    setSortCol('')
    setSortDir('')
    setFilters({})
    setShowFilters(false)
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

  function openExportDialog() {
    setExportDateFrom('')
    setExportDateTo('')
    dialogRef.current?.showModal()
  }

  function closeExportDialog() {
    dialogRef.current?.close()
  }

  function handleExport() {
    const params = new URLSearchParams({ all_fields: '1' })
    if (q) params.set('q', q)
    if (exportDateFrom) params.set('date_from', exportDateFrom)
    if (exportDateTo) params.set('date_to', exportDateTo)
    window.location.href = `/api/analisis/${tipus}/export?${params.toString()}`
    closeExportDialog()
  }

  // Build filterable fields from config
  const filterableCamps = useMemo(() => {
    if (!config) return []
    const camps = []
    for (const sec of config.seccions) {
      for (const c of sec.camps) {
        if (c.type === 'date' || c.type === 'select') {
          camps.push(c)
        }
      }
    }
    return camps
  }, [config])

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  function updateFilter(key, val) {
    setPage(1)
    setFilters((prev) => {
      const next = { ...prev, [key]: val }
      if (!val) delete next[key]
      return next
    })
  }

  function clearFilters() {
    setPage(1)
    setFilters({})
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {filterableCamps.length > 0 && (
            <button
              className={activeFilterCount > 0 ? '' : 'outline'}
              onClick={() => setShowFilters((v) => !v)}
            >
              Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          )}
          {!isViewer && <Link to={`/${tipus}/nou`} role="button">Nou Anàlisi</Link>}
          <button className="outline" onClick={openExportDialog}>
            Exportar Excel
          </button>
        </div>
      </div>

      {showFilters && filterableCamps.length > 0 && (
        <div style={{ border: '1px solid var(--lab-border)', borderRadius: '0.375rem', padding: '0.75rem', marginBottom: '0.75rem', background: 'var(--lab-bg-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong style={{ fontSize: '0.85rem' }}>Filtres avançats</strong>
            {activeFilterCount > 0 && (
              <button className="outline secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', margin: 0 }} onClick={clearFilters}>
                Netejar filtres
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem 0.75rem' }}>
            {filterableCamps.map((c) => {
              if (c.type === 'date') {
                return (
                  <fieldset key={c.name} style={{ border: 'none', padding: 0, margin: 0, gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '0.15rem' }}>{c.label}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.3rem', alignItems: 'center' }}>
                      <input
                        type="date"
                        value={filters[`f_${c.name}_from`] || ''}
                        onChange={(e) => updateFilter(`f_${c.name}_from`, e.target.value)}
                        style={{ marginBottom: 0, padding: '0.25rem 0.4rem', fontSize: '0.85rem' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>—</span>
                      <input
                        type="date"
                        value={filters[`f_${c.name}_to`] || ''}
                        onChange={(e) => updateFilter(`f_${c.name}_to`, e.target.value)}
                        style={{ marginBottom: 0, padding: '0.25rem 0.4rem', fontSize: '0.85rem' }}
                      />
                    </div>
                  </fieldset>
                )
              }
              if (c.type === 'select') {
                return (
                  <fieldset key={c.name} style={{ border: 'none', padding: 0, margin: 0 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '0.15rem' }}>{c.label}</label>
                    <select
                      value={filters[`f_${c.name}`] || ''}
                      onChange={(e) => updateFilter(`f_${c.name}`, e.target.value)}
                      style={{ marginBottom: 0, padding: '0.25rem 0.4rem', fontSize: '0.85rem' }}
                    >
                      <option value="">Tots</option>
                      {(c.opcions || []).map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </fieldset>
                )
              }
              return null
            })}
          </div>
        </div>
      )}

      <dialog ref={dialogRef}>
        <article>
          <header>
            <button aria-label="Tancar" rel="prev" onClick={closeExportDialog}></button>
            <h3>Exportar Excel — {config.nom}</h3>
          </header>

          <label>
            De
            <input
              type="date"
              value={exportDateFrom}
              onChange={(e) => setExportDateFrom(e.target.value)}
            />
          </label>
          <label>
            A
            <input
              type="date"
              value={exportDateTo}
              onChange={(e) => setExportDateTo(e.target.value)}
            />
          </label>

          {q && (
            <p><small>Filtre de cerca actiu: <strong>{q}</strong></small></p>
          )}

          <footer>
            <button className="secondary" onClick={closeExportDialog}>Cancel·lar</button>
            <button onClick={handleExport}>Exportar</button>
          </footer>
        </article>
      </dialog>

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
