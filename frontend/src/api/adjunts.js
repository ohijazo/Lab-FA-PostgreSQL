import i18n from '../i18n/index.js'

function langHeaders() {
  return { 'Accept-Language': i18n.language || 'ca' }
}

export async function llistarAdjunts(tipus, id) {
  const res = await fetch(`/api/analisis/${tipus}/${id}/adjunts`, {
    credentials: 'include',
    headers: langHeaders(),
  })
  if (!res.ok) throw new Error(i18n.t('errors.carregant_adjunts'))
  return res.json()
}

/**
 * Puja un adjunt amb progrés.
 *
 * Fa servir XMLHttpRequest i no fetch — és l'únic lloc del projecte on cal:
 * fetch no informa del progrés de pujada, i sense barra una pujada de 20 MB
 * des d'una tauleta sembla que l'aplicació s'ha penjat.
 */
export function pujarAdjunt(tipus, id, file, thumb, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    fd.append('file', file)
    if (thumb) fd.append('thumb', thumb)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/analisis/${tipus}/${id}/adjunts`)
    xhr.withCredentials = true
    xhr.setRequestHeader('Accept-Language', i18n.language || 'ca')

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let dades = null
      try { dades = JSON.parse(xhr.responseText) } catch { /* resposta no JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(dades)
      else reject(new Error(dades?.error || i18n.t('errors.pujant_adjunt')))
    }
    xhr.onerror = () => reject(new Error(i18n.t('errors.pujant_adjunt')))
    xhr.send(fd)
  })
}

export async function eliminarAdjunt(adjuntId) {
  const res = await fetch(`/api/adjunts/${adjuntId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: langHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || i18n.t('errors.eliminant_adjunt'))
  }
  return res.json()
}
