const BASE = '/api/admin'

// ---- Tipus ----

export async function llistarTipusAdmin() {
  const res = await fetch(`${BASE}/tipus`, { credentials: 'include' })
  if (!res.ok) throw new Error('Error carregant tipus')
  return res.json()
}

export async function obtenirTipusAdmin(id) {
  const res = await fetch(`${BASE}/tipus/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Error carregant tipus')
  return res.json()
}

export async function crearTipus(data) {
  const res = await fetch(`${BASE}/tipus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error creant tipus')
  return res.json()
}

export async function editarTipus(id, data) {
  const res = await fetch(`${BASE}/tipus/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error editant tipus')
  return res.json()
}

export async function eliminarTipus(id) {
  const res = await fetch(`${BASE}/tipus/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Error eliminant tipus')
  return res.json()
}

// ---- Seccions ----

export async function llistarSeccions(tipusId) {
  const res = await fetch(`${BASE}/tipus/${tipusId}/seccions`, { credentials: 'include' })
  if (!res.ok) throw new Error('Error carregant seccions')
  return res.json()
}

export async function crearSeccio(tipusId, data) {
  const res = await fetch(`${BASE}/tipus/${tipusId}/seccions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error creant seccio')
  return res.json()
}

export async function editarSeccio(id, data) {
  const res = await fetch(`${BASE}/seccions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error editant seccio')
  return res.json()
}

export async function eliminarSeccio(id) {
  const res = await fetch(`${BASE}/seccions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Error eliminant seccio')
  return res.json()
}

export async function reordenarSeccions(tipusId, orderedIds) {
  const res = await fetch(`${BASE}/tipus/${tipusId}/seccions/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ order: orderedIds }),
  })
  if (!res.ok) throw new Error('Error reordenant seccions')
  return res.json()
}

// ---- Camps ----

export async function llistarCamps(seccioId) {
  const res = await fetch(`${BASE}/seccions/${seccioId}/camps`, { credentials: 'include' })
  if (!res.ok) throw new Error('Error carregant camps')
  return res.json()
}

export async function crearCamp(seccioId, data) {
  const res = await fetch(`${BASE}/seccions/${seccioId}/camps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error creant camp')
  return res.json()
}

export async function editarCamp(id, data) {
  const res = await fetch(`${BASE}/camps/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error editant camp')
  return res.json()
}

export async function reordenarCamps(seccioId, orderedIds) {
  const res = await fetch(`${BASE}/seccions/${seccioId}/camps/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ order: orderedIds }),
  })
  if (!res.ok) throw new Error('Error reordenant camps')
  return res.json()
}

export async function eliminarCamp(id) {
  const res = await fetch(`${BASE}/camps/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Error eliminant camp')
  return res.json()
}

// ---- Importacio Excel ----

export async function importarAnalisis(tipusId, file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE}/tipus/${tipusId}/import`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error importat fitxer")
  return data
}

// ---- Usuaris ----

export async function llistarUsers() {
  const res = await fetch(`${BASE}/users`, { credentials: 'include' })
  if (!res.ok) throw new Error('Error carregant usuaris')
  return res.json()
}

export async function crearUser(data) {
  const res = await fetch(`${BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.description || err.error || 'Error creant usuari')
  }
  return res.json()
}

export async function editarUser(id, data) {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.description || err.error || 'Error editant usuari')
  }
  return res.json()
}

export async function eliminarUser(id) {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.description || err.error || 'Error eliminant usuari')
  }
  return res.json()
}
