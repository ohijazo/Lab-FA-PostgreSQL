import i18n from '../i18n/index.js'

const BASE = '/api/admin'

function langHeaders() {
  return { 'Accept-Language': i18n.language || 'ca' }
}

// ---- Tipus ----

export async function llistarTipusAdmin() {
  const res = await fetch(`${BASE}/tipus`, { credentials: 'include', headers: langHeaders() })
  if (!res.ok) throw new Error(i18n.t('errors.carregant_tipus'))
  return res.json()
}

export async function obtenirTipusAdmin(id) {
  const res = await fetch(`${BASE}/tipus/${id}`, { credentials: 'include', headers: langHeaders() })
  if (!res.ok) throw new Error(i18n.t('errors.carregant_tipus'))
  return res.json()
}

export async function crearTipus(data) {
  const res = await fetch(`${BASE}/tipus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(i18n.t('errors.creant_tipus'))
  return res.json()
}

export async function editarTipus(id, data) {
  const res = await fetch(`${BASE}/tipus/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(i18n.t('errors.editant_tipus'))
  return res.json()
}

export async function eliminarTipus(id) {
  const res = await fetch(`${BASE}/tipus/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: langHeaders(),
  })
  if (!res.ok) throw new Error(i18n.t('errors.eliminant_tipus'))
  return res.json()
}

// ---- Seccions ----

export async function llistarSeccions(tipusId) {
  const res = await fetch(`${BASE}/tipus/${tipusId}/seccions`, { credentials: 'include', headers: langHeaders() })
  if (!res.ok) throw new Error(i18n.t('errors.carregant_seccions'))
  return res.json()
}

export async function crearSeccio(tipusId, data) {
  const res = await fetch(`${BASE}/tipus/${tipusId}/seccions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(i18n.t('errors.creant_seccio'))
  return res.json()
}

export async function editarSeccio(id, data) {
  const res = await fetch(`${BASE}/seccions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(i18n.t('errors.editant_seccio'))
  return res.json()
}

export async function eliminarSeccio(id) {
  const res = await fetch(`${BASE}/seccions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: langHeaders(),
  })
  if (!res.ok) throw new Error(i18n.t('errors.eliminant_seccio'))
  return res.json()
}

export async function reordenarSeccions(tipusId, orderedIds) {
  const res = await fetch(`${BASE}/tipus/${tipusId}/seccions/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify({ order: orderedIds }),
  })
  if (!res.ok) throw new Error(i18n.t('errors.reordenant_seccions'))
  return res.json()
}

// ---- Camps ----

export async function llistarCamps(seccioId) {
  const res = await fetch(`${BASE}/seccions/${seccioId}/camps`, { credentials: 'include', headers: langHeaders() })
  if (!res.ok) throw new Error(i18n.t('errors.carregant_camps'))
  return res.json()
}

export async function crearCamp(seccioId, data) {
  const res = await fetch(`${BASE}/seccions/${seccioId}/camps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(i18n.t('errors.creant_camp'))
  return res.json()
}

export async function editarCamp(id, data) {
  const res = await fetch(`${BASE}/camps/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(i18n.t('errors.editant_camp'))
  return res.json()
}

export async function reordenarCamps(seccioId, orderedIds) {
  const res = await fetch(`${BASE}/seccions/${seccioId}/camps/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify({ order: orderedIds }),
  })
  if (!res.ok) throw new Error(i18n.t('errors.reordenant_camps'))
  return res.json()
}

export async function eliminarCamp(id) {
  const res = await fetch(`${BASE}/camps/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: langHeaders(),
  })
  if (!res.ok) throw new Error(i18n.t('errors.eliminant_camp'))
  return res.json()
}

// ---- Plantilla Excel ----

export async function descarregarPlantilla(tipusId) {
  const res = await fetch(`${BASE}/tipus/${tipusId}/plantilla`, { credentials: 'include', headers: langHeaders() })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || i18n.t('errors.descarregant_plantilla'))
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = res.headers.get('content-disposition')?.match(/filename=(.+)/)?.[1] || 'plantilla.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

// ---- Duplicar tipus ----

export async function duplicarTipus(id) {
  const res = await fetch(`${BASE}/tipus/${id}/duplicar`, {
    method: 'POST',
    credentials: 'include',
    headers: langHeaders(),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || i18n.t('errors.duplicant_tipus'))
  }
  return res.json()
}

// ---- Estadistiques ----

export async function obtenirEstadistiques() {
  const res = await fetch(`${BASE}/estadistiques`, { credentials: 'include', headers: langHeaders() })
  if (!res.ok) throw new Error(i18n.t('errors.carregant_estadistiques'))
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
  if (!res.ok) throw new Error(data.error || i18n.t('errors.importat_fitxer'))
  return data
}

// ---- Usuaris ----

export async function llistarUsers() {
  const res = await fetch(`${BASE}/users`, { credentials: 'include', headers: langHeaders() })
  if (!res.ok) throw new Error(i18n.t('errors.carregant_usuaris'))
  return res.json()
}

export async function crearUser(data) {
  const res = await fetch(`${BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.description || err.error || i18n.t('errors.creant_usuari'))
  }
  return res.json()
}

export async function editarUser(id, data) {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.description || err.error || i18n.t('errors.editant_usuari'))
  }
  return res.json()
}

export async function eliminarUser(id) {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: langHeaders(),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.description || err.error || i18n.t('errors.eliminant_usuari'))
  }
  return res.json()
}
