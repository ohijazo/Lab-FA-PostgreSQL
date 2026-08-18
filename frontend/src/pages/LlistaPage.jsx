import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { llistarAnalisis, obtenirConfig, desarColumnesUsuari, restablirColumnesUsuari } from '../api/analisis'
import AnalisisList from '../components/AnalisisList'
import Icon from '../components/Icon'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Skeleton from '../components/ui/Skeleton'
import LoadingBlock from '../components/ui/LoadingBlock'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

function SortableColumnItem({ id, label, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <li ref={setNodeRef} style={style} className="cols-item">
      <span {...attributes} {...listeners} className="drag-handle cols-item-drag"><Icon name="GripVertical" size={14} /></span>
      <span className="cols-item-label">{label}</span>
      <button
        type="button"
        className="cols-item-remove"
        onClick={onRemove}
        aria-label="treure"
      ><Icon name="X" size={14} /></button>
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

  const [exportOpen, setExportOpen] = useState(false)
  const [exportDateFrom, setExportDateFrom] = useState('')
  const [exportDateTo, setExportDateTo] = useState('')

  const [colsOpen, setColsOpen] = useState(false)
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

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    setQ(searchInput)
  }

  // Cerca live amb debounce de 300ms — Intro segueix funcionant per cerca instantània
  useEffect(() => {
    if (searchInput === q) return
    const timeout = setTimeout(() => {
      setPage(1)
      setQ(searchInput)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchInput, q])

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
    setExportOpen(true)
  }

  function closeExportDialog() {
    setExportOpen(false)
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
    setColsOpen(true)
  }

  function closeColumnesDialog() {
    setColsOpen(false)
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

  if (loading && !config) return <LoadingBlock label={t('common.carregant')} />
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
          <div className="search-input-wrap">
            <Icon name="Search" size={14} className="search-input-icon" />
            <input
              type="search"
              placeholder={t('llista.cercar')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
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
            <Button
              variant={activeFilterCount > 0 ? 'primary' : 'outline'}
              size="sm"
              icon={<Icon name="Filter" size={12} />}
              onClick={() => setShowFilters((v) => !v)}
            >
              {activeFilterCount > 0 ? t('llista.filtres_count', { count: activeFilterCount }) : t('llista.filtres')}
            </Button>
          )}
          <Button
            variant={config?.columnes_llista_personalitzat ? 'primary' : 'outline'}
            size="sm"
            icon={<Icon name="Columns3" size={12} />}
            onClick={openColumnesDialog}
            title={t('llista.columnes_title')}
          >
            {t('llista.columnes')}
          </Button>
          {!isViewer && (
            <Link to={`/${tipus}/nou`} className="btn btn-primary btn-sm">
              <Icon name="Plus" size={12} />
              <span>{t('llista.nou_analisi')}</span>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={<Icon name="Download" size={12} />}
            onClick={openExportDialog}
          >
            {t('llista.exportar_excel')}
          </Button>
        </div>
      </div>

      {showFilters && filterableCamps.length > 0 && (
        <div className="llista-filters-panel">
          <div className="llista-filters-header">
            <strong>{t('llista.filtres_avancats')}</strong>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {t('llista.netejar_filtres')}
              </Button>
            )}
          </div>
          <div className="llista-filters-grid">
            {filterableCamps.map((c) => {
              if (c.type === 'date') {
                return (
                  <fieldset key={c.name} className="filter-field filter-field-date">
                    <label className="filter-label">{c.label}</label>
                    <div className="filter-date-range">
                      <input
                        type="date"
                        value={filters[`f_${c.name}_from`] || ''}
                        onChange={(e) => updateFilter(`f_${c.name}_from`, e.target.value)}
                        className="filter-input"
                      />
                      <span className="filter-date-sep">—</span>
                      <input
                        type="date"
                        value={filters[`f_${c.name}_to`] || ''}
                        onChange={(e) => updateFilter(`f_${c.name}_to`, e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </fieldset>
                )
              }
              if (c.type === 'select') {
                return (
                  <fieldset key={c.name} className="filter-field">
                    <label className="filter-label">{c.label}</label>
                    <select
                      value={filters[`f_${c.name}`] || ''}
                      onChange={(e) => updateFilter(`f_${c.name}`, e.target.value)}
                      className="filter-input"
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

      <Modal
        open={colsOpen}
        onClose={closeColumnesDialog}
        title={t('llista.columnes_titol', { nom: config.nom })}
        size="lg"
        footer={
          <div className="cols-modal-footer">
            <Button
              variant="outline"
              onClick={handleResetColumnes}
              disabled={savingColumnes || !config.columnes_llista_personalitzat}
            >
              {t('llista.columnes_restablir')}
            </Button>
            <div className="cols-modal-footer-actions">
              <Button variant="ghost" onClick={closeColumnesDialog} disabled={savingColumnes}>
                {t('common.cancellar')}
              </Button>
              <Button variant="primary" onClick={handleSaveColumnes} loading={savingColumnes}>
                {t('common.desar_canvis')}
              </Button>
            </div>
          </div>
        }
      >
        <p className="cols-desc"><small>{t('llista.columnes_desc')}</small></p>

        {columnesError && <p className="form-error-text">{columnesError}</p>}

        <section className="cols-section">
          <h6 className="cols-section-title">{t('llista.columnes_seleccionades')}</h6>
          {editColumnes.length === 0 ? (
            <p className="cols-empty"><small>{t('llista.columnes_cap_seleccionada')}</small></p>
          ) : (
            <DndContext sensors={colsSensors} collisionDetection={closestCenter} onDragEnd={handleColumnesDragEnd}>
              <SortableContext items={editColumnes} strategy={verticalListSortingStrategy}>
                <ul className="cols-list">
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
          <h6 className="cols-section-title">{t('llista.columnes_disponibles')}</h6>
          {config.seccions.filter((s) => s.camps.some((c) => !editColumnes.includes(c.name))).map((s) => (
            <div key={s.id} className="cols-avail-group">
              <div className="cols-avail-title">{s.titol}</div>
              <div className="cols-avail-chips">
                {s.camps.filter((c) => !editColumnes.includes(c.name)).map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className="btn btn-outline btn-sm cols-avail-chip"
                    onClick={() => afegirColumna(c.name)}
                  >
                    <Icon name="Plus" size={12} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {config.seccions.every((s) => s.camps.every((c) => editColumnes.includes(c.name))) && (
            <p className="cols-empty"><small>{t('llista.columnes_totes_seleccionades')}</small></p>
          )}
        </section>
      </Modal>

      <Modal
        open={exportOpen}
        onClose={closeExportDialog}
        title={t('llista.exportar_excel_titol', { nom: config.nom })}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeExportDialog}>{t('common.cancellar')}</Button>
            <Button
              variant="primary"
              icon={<Icon name="Download" size={14} />}
              onClick={handleExport}
            >
              {t('common.exportar')}
            </Button>
          </>
        }
      >
        <div className="export-date-row">
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
        </div>

        {q && (
          <p style={{ marginTop: '0.75rem' }}><small>{t('llista.filtre_cerca_actiu', { q })}</small></p>
        )}
      </Modal>

      {loading ? (
        <div className="llista-skeleton">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="llista-skeleton-row"><Skeleton height="0.9rem" /></div>
          ))}
        </div>
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
            tipusConfig={config}
            canCreate={!isViewer}
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
