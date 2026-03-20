// --- Tipus & config ---

export async function llistarTipus() {
  const res = await fetch('/api/tipus', { credentials: 'include' })
  if (!res.ok) throw new Error('Error carregant tipus')
  return res.json()
}

export async function obtenirConfig(tipus) {
  const res = await fetch(`/api/tipus/${tipus}/config`, { credentials: 'include' })
  if (!res.ok) throw new Error(`Error carregant config de ${tipus}`)
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
  const res = await fetch(`/api/analisis/${tipus}?${params}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Error carregant anàlisis')
  return res.json()
}

export async function obtenirAnalisi(tipus, id) {
  const res = await fetch(`/api/analisis/${tipus}/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Error carregant anàlisi')
  return res.json()
}

export async function crearAnalisi(tipus, data) {
  const res = await fetch(`/api/analisis/${tipus}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const info = await res.json().catch(() => null)
    throw new Error(info?.error || 'Error creant anàlisi')
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
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (res.status === 409) {
    const info = await res.json()
    const err = new Error(info.message || 'Conflicte de concurrència')
    err.conflict = info
    throw err
  }
  if (!res.ok) {
    const info = await res.json().catch(() => null)
    throw new Error(info?.error || 'Error editant anàlisi')
  }
  return res.json()
}

export async function acquireLock(tipus, id) {
  const res = await fetch(`/api/analisis/${tipus}/${id}/lock`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) return null
  return res.json()
}

export async function releaseLock(tipus, id) {
  try {
    await fetch(`/api/analisis/${tipus}/${id}/lock`, {
      method: 'DELETE',
      credentials: 'include',
    })
  } catch {
    // best-effort cleanup
  }
}

export async function eliminarAnalisi(tipus, id) {
  const res = await fetch(`/api/analisis/${tipus}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Error eliminant anàlisi')
  return res.json()
}
