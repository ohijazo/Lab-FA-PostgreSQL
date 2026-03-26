import i18n from '../i18n/index.js'

function langHeaders() {
  return { 'Accept-Language': i18n.language || 'ca' }
}

// --- Tipus & config ---

export async function llistarTipus() {
  const res = await fetch('/api/tipus', { credentials: 'include', headers: langHeaders() })
  if (!res.ok) throw new Error(i18n.t('errors.carregant_tipus'))
  return res.json()
}

export async function obtenirConfig(tipus) {
  const res = await fetch(`/api/tipus/${tipus}/config`, { credentials: 'include', headers: langHeaders() })
  if (!res.ok) throw new Error(i18n.t('errors.carregant_config', { tipus }))
  return res.json()
}

// --- CRUD ---

export async function llistarAnalisis(tipus, { page = 1, per_page = 25, q = '', sort = '', sort_dir = '', filters = {} } = {}) {
  const params = new URLSearchParams({ page, per_page })
  if (q) params.set('q', q)
  if (sort) params.set('sort', sort)
  if (sort_dir) params.set('sort_dir', sort_dir)
  for (const [key, val] of Object.entries(filters)) {
    if (val) params.set(key, val)
  }
  const res = await fetch(`/api/analisis/${tipus}?${params}`, { credentials: 'include', headers: langHeaders() })
  if (!res.ok) throw new Error(i18n.t('errors.carregant_analisis'))
  return res.json()
}

export async function obtenirAnalisi(tipus, id) {
  const res = await fetch(`/api/analisis/${tipus}/${id}`, { credentials: 'include', headers: langHeaders() })
  if (!res.ok) throw new Error(i18n.t('errors.carregant_analisi'))
  return res.json()
}

export async function crearAnalisi(tipus, data) {
  const res = await fetch(`/api/analisis/${tipus}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const info = await res.json().catch(() => null)
    throw new Error(info?.error || i18n.t('errors.creant_analisi'))
  }
  return res.json()
}

export async function editarAnalisi(tipus, id, data, expectedUpdatedAt) {
  const body = { ...data }
  if (expectedUpdatedAt) {
    body._expected_updated_at = expectedUpdatedAt
  }
  const res = await fetch(`/api/analisis/${tipus}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (res.status === 409) {
    const info = await res.json()
    const err = new Error(info.message || i18n.t('errors.conflicte_concurrencia'))
    err.conflict = info
    throw err
  }
  if (!res.ok) {
    const info = await res.json().catch(() => null)
    throw new Error(info?.error || i18n.t('errors.editant_analisi'))
  }
  return res.json()
}

export async function acquireLock(tipus, id) {
  const res = await fetch(`/api/analisis/${tipus}/${id}/lock`, {
    method: 'POST',
    credentials: 'include',
    headers: langHeaders(),
  })
  if (!res.ok) return null
  return res.json()
}

export async function releaseLock(tipus, id) {
  try {
    await fetch(`/api/analisis/${tipus}/${id}/lock`, {
      method: 'DELETE',
      credentials: 'include',
      headers: langHeaders(),
    })
  } catch {
    // best-effort cleanup
  }
}

export async function findByCodi(codi) {
  const res = await fetch(`/api/analisis/find-by-codi?codi=${encodeURIComponent(codi)}`, { credentials: 'include', headers: langHeaders() })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error || i18n.t('common.no_trobat'))
  }
  return res.json()
}

export async function eliminarAnalisi(tipus, id) {
  const res = await fetch(`/api/analisis/${tipus}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: langHeaders(),
  })
  if (!res.ok) throw new Error(i18n.t('errors.eliminant_analisi'))
  return res.json()
}
