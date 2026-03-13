const BASE = '/api/analisis'

export async function llistarAnalisis() {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error('Error carregant anàlisis')
  return res.json()
}

export async function obtenirAnalisi(id) {
  const res = await fetch(`${BASE}/${id}`)
  if (!res.ok) throw new Error('Error carregant anàlisi')
  return res.json()
}

export async function crearAnalisi(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error creant anàlisi')
  return res.json()
}

export async function editarAnalisi(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error editant anàlisi')
  return res.json()
}

export async function eliminarAnalisi(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error eliminant anàlisi')
  return res.json()
}
