export async function fetchDashboardGlobal() {
  const res = await fetch('/api/dashboard/global', { credentials: 'include' })
  if (!res.ok) throw new Error('Error carregant dashboard global')
  return res.json()
}

export async function fetchDashboard(slug, params = {}) {
  const qs = new URLSearchParams()
  if (params.data_inici) qs.set('data_inici', params.data_inici)
  if (params.data_fi) qs.set('data_fi', params.data_fi)
  if (params.filtre) qs.set('filtre', params.filtre)
  const url = `/api/dashboard/${slug}` + (qs.toString() ? `?${qs}` : '')
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Error carregant dashboard')
  return res.json()
}
