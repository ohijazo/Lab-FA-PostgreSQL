import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { llistarAnalisis, obtenirConfig, desarColumnesUsuari, restablirColumnesUsuari, marcarFinalitzat } from '../api/analisis'
import AnalisisList from '../components/AnalisisList'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

function SortableColumnItem({ id, label, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.4rem 0.6rem',
    border: '1px solid var(--lab-border)',
    borderRadius: '0.25rem',
    marginBottom: '0.25rem',
    background: 'var(--lab-bg, white)',
    listStyle: 'none',
  }
  return (
    <li ref={setNodeRef} style={style}>
      <span {...attributes} {...listeners} className="drag-handle" style={{ cursor: 'grab' }}>⠿</span>
      <span style={{ flex: 1 }}>{label}</span>
      <button
        type="button"
        className="outline secondary"
        style={{ padding: '0.1rem 0.5rem', fontSize: '0.85rem', margin: 0 }}
        onClick={onRemove}
        aria-label="treure"
      >×</button>
    </li>
  )
}

export default function LlistaPage() {
  const { t } = useTranslation()
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
  const [estat, setEstat] = useState('')  // '' = tots, 'pendent', 'finalitzat'

  const dialogRef = useRef(null)
  const [exportDateFrom, setExportDateFrom] = useState('')
  const [exportDateTo, setExportDateTo] = useState('')

  const colsDialogRef = useRef(null)
  const [editColumnes, setEditColumnes] = useState([])
  const [savingColumnes, setSavingColumnes] = useState(false)
  const [columnesError, setColumnesError] = useState(null)

  const colsSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cfg, result] = await Promise.all([
        obtenirConfig(tipus),
        llistarAnalisis(tipus, { page, q, sort: sortCol, sort_dir: sortDir, filters, estat }),
      ])
      setConfig(cfg)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tipus, page, q, sortCol, sortDir, filters, estat])

  useEffect(() => {
    setPage(1)
    setQ('')
    setSearchInput('')
    setSortCol('')
    setSortDir('')
    setFilters({})
    setShowFilters(false)
    setEstat('')
  }, [tipus])

  function changeEstat(nou) {
    setPage(1)
    setEstat(nou)
  }

  async function toggleRowFinalitzat(item) {
    try {
      const updated = await marcarFinalitzat(tipus, item.id, !item.finalitzat)
      setData((prev) => ({
        ...prev,
        items: prev.items.map((x) => (x.id === item.id ? { ...x, finalitzat: updated.finalitzat } : x)),
      }))
    } catch (err) {
      setError(err.message)
    }
  }

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

  // --- Configuració de columnes per usuari ---
  const campsByName = useMemo(() => {
    const m = {}
    if (!config) return m
    for (const s of config.seccions) for (const c of s.camps) m[c.name] = { ...c, seccioTitol: s.titol }
    return m
  }, [config])

  function openColumnesDialog() {
    setColumnesError(null)
    setEditColumnes(config?.columnes_llista || [])
    colsDialogRef.current?.showModal()
  }

  function closeColumnesDialog() {
    colsDialogRef.current?.close()
  }

  function afegirColumna(name) {
    setEditColumnes((prev) => (prev.includes(name) ? prev : [...prev, name]))
  }

  function treureColumna(name) {
    setEditColumnes((prev) => prev.filter((n) => n !== name))
  }

  function handleColumnesDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = editColumnes.indexOf(active.id)
    const newIndex = editColumnes.indexOf(over.id)
    if (oldIndex < 0 || newIndex < 0) return
    setEditColumnes(arrayMove(editColumnes, oldIndex, newIndex))
  }

  async function handleSaveColumnes() {
    setSavingColumnes(true)
    setColumnesError(null)
    try {
      await desarColumnesUsuari(tipus, editColumnes)
      closeColumnesDialog()
      await fetchData()
    } catch (err) {
      setColumnesError(err.message)
    } finally {
      setSavingColumnes(false)
    }
  }

  async function handleResetColumnes() {
    setSavingColumnes(true)
    setColumnesError(null)
    try {
      await restablirColumnesUsuari(tipus)
      closeColumnesDialog()
      await fetchData()
    } catch (err) {
      setColumnesError(err.message)
    } finally {
      setSavingColumnes(false)
    }
  }

  if (loading && !config) return <p aria-busy="true">{t('common.carregant')}</p>
  if (error) return <p>Error: {error}</p>
  if (!config) return <p>{t('common.tipus_no_trobat')}</p>

  return (
    <>
      <hgroup>
        <h1>{config.nom}</h1>
        <p>{t('llista.analisis_count', { count: data.total })}</p>
      </hgroup>

      <div className="llista-toolbar">
        <form onSubmit={handleSearch} role="search" className="llista-search">
          <input
            type="search"
            placeholder={t('llista.cercar')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <div className="estat-segmented" role="tablist" aria-label={t('llista.filtre_estat')}>
          <button
            type="button"
            className={estat === '' ? 'active' : ''}
            onClick={() => changeEstat('')}
          >{t('llista.estat_tots')}</button>
          <button
            type="button"
            className={estat === 'pendent' ? 'active' : ''}
            onClick={() => changeEstat('pendent')}
          >{t('llista.estat_pendents')}</button>
          <button
            type="button"
            className={estat === 'finalitzat' ? 'active' : ''}
            onClick={() => changeEstat('finalitzat')}
          >{t('llista.estat_finalitzats')}</button>
        </div>
        <div className="llista-toolbar-actions">
          {filterableCamps.length > 0 && (
            <button
              className={activeFilterCount > 0 ? '' : 'outline'}
              onClick={() => setShowFilters((v) => !v)}
            >
              {activeFilterCount > 0 ? t('llista.filtres_count', { count: activeFilterCount }) : t('llista.filtres')}
            </button>
          )}
          <button
            className={config?.columnes_llista_personalitzat ? '' : 'outline'}
            onClick={openColumnesDialog}
            title={t('llista.columnes_title')}
          >
            {t('llista.columnes')}
          </button>
          {!isViewer && <Link to={`/${tipus}/nou`} role="button">{t('llista.nou_analisi')}</Link>}
          <button className="outline" onClick={openExportDialog}>
            {t('llista.exportar_excel')}
          </button>
        </div>
      </div>

      {showFilters && filterableCamps.length > 0 && (
        <div style={{ border: '1px solid var(--lab-border)', borderRadius: '0.375rem', padding: '0.75rem', marginBottom: '0.75rem', background: 'var(--lab-bg-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong style={{ fontSize: '0.85rem' }}>{t('llista.filtres_avancats')}</strong>
            {activeFilterCount > 0 && (
              <button className="outline secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', margin: 0 }} onClick={clearFilters}>
                {t('llista.netejar_filtres')}
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
                      <option value="">{t('common.tots')}</option>
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

      <dialog ref={colsDialogRef}>
        <article className="cols-dialog-article">
          <header>
            <button aria-label={t('common.tancar')} rel="prev" onClick={closeColumnesDialog}></button>
            <h3>{t('llista.columnes_titol', { nom: config.nom })}</h3>
          </header>

          <p style={{ marginTop: 0 }}><small>{t('llista.columnes_desc')}</small></p>

          {columnesError && <p style={{ color: 'var(--pico-del-color)' }}>{columnesError}</p>}

          <section style={{ marginBottom: '1.25rem' }}>
            <h6 style={{ margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--pico-muted-color)' }}>
              {t('llista.columnes_seleccionades')}
            </h6>
            {editColumnes.length === 0 ? (
              <p style={{ margin: 0 }}><small>{t('llista.columnes_cap_seleccionada')}</small></p>
            ) : (
              <DndContext sensors={colsSensors} collisionDetection={closestCenter} onDragEnd={handleColumnesDragEnd}>
                <SortableContext items={editColumnes} strategy={verticalListSortingStrategy}>
                  <ul style={{ padding: 0, margin: 0 }}>
                    {editColumnes.map((name) => {
                      const c = campsByName[name]
                      if (!c) return null
                      return (
                        <SortableColumnItem
                          key={name}
                          id={name}
                          label={c.label}
                          onRemove={() => treureColumna(name)}
                        />
                      )
                    })}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </section>

          <section>
            <h6 style={{ margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--pico-muted-color)' }}>
              {t('llista.columnes_disponibles')}
            </h6>
            {config.seccions.filter((s) => s.camps.some((c) => !editColumnes.includes(c.name))).map((s) => (
              <div key={s.id} style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--pico-muted-color)', marginBottom: '0.3rem' }}>{s.titol}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {s.camps.filter((c) => !editColumnes.includes(c.name)).map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      className="outline"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}
                      onClick={() => afegirColumna(c.name)}
                    >
                      + {c.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {config.seccions.every((s) => s.camps.every((c) => editColumnes.includes(c.name))) && (
              <p style={{ margin: 0 }}><small>{t('llista.columnes_totes_seleccionades')}</small></p>
            )}
          </section>

          <div className="cols-dialog-footer">
            <button
              type="button"
              className="outline secondary"
              onClick={handleResetColumnes}
              disabled={savingColumnes || !config.columnes_llista_personalitzat}
            >
              {t('llista.columnes_restablir')}
            </button>
            <div className="cols-dialog-footer-actions">
              <button
                type="button"
                className="secondary"
                onClick={closeColumnesDialog}
                disabled={savingColumnes}
              >
                {t('common.cancellar')}
              </button>
              <button
                type="button"
                onClick={handleSaveColumnes}
                disabled={savingColumnes}
                aria-busy={savingColumnes}
              >
                {t('common.desar_canvis')}
              </button>
            </div>
          </div>
        </article>
      </dialog>

      <dialog ref={dialogRef}>
        <article>
          <header>
            <button aria-label={t('common.tancar')} rel="prev" onClick={closeExportDialog}></button>
            <h3>{t('llista.exportar_excel_titol', { nom: config.nom })}</h3>
          </header>

          <label>
            {t('common.de')}
            <input
              type="date"
              value={exportDateFrom}
              onChange={(e) => setExportDateFrom(e.target.value)}
            />
          </label>
          <label>
            {t('common.a')}
            <input
              type="date"
              value={exportDateTo}
              onChange={(e) => setExportDateTo(e.target.value)}
            />
          </label>

          {q && (
            <p><small>{t('llista.filtre_cerca_actiu', { q })}</small></p>
          )}

          <footer>
            <button className="secondary" onClick={closeExportDialog}>{t('common.cancellar')}</button>
            <button onClick={handleExport}>{t('common.exportar')}</button>
          </footer>
        </article>
      </dialog>

      {loading ? (
        <p aria-busy="true">{t('common.carregant')}</p>
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
            onToggleFinalitzat={isViewer ? null : toggleRowFinalitzat}
          />
          {data.pages > 1 && (
            <nav className="pagination">
              <button
                className="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('llista.anterior')}
              </button>
              <span>{t('llista.pagina_de', { page: data.page, pages: data.pages })}</span>
              <button
                className="outline"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('llista.seguent')}
              </button>
            </nav>
          )}
        </>
      )}
    </>
  )
}
