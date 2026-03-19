export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Error de login')
  }
  return res.json()
}

export async function logout() {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Error al tancar sessio')
  return res.json()
}

export async function getMe() {
  const res = await fetch('/api/auth/me', {
    credentials: 'include',
  })
  if (!res.ok) return null
  return res.json()
}
