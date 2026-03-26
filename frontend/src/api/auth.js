import i18n from '../i18n/index.js'

function langHeaders() {
  return { 'Accept-Language': i18n.language || 'ca' }
}

export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...langHeaders() },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || i18n.t('errors.login'))
  }
  return res.json()
}

export async function logout() {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: langHeaders(),
  })
  if (!res.ok) throw new Error(i18n.t('errors.logout'))
  return res.json()
}

export async function getMe() {
  const res = await fetch('/api/auth/me', {
    credentials: 'include',
    headers: langHeaders(),
  })
  if (!res.ok) return null
  return res.json()
}
