// Redimensiona imatges al navegador abans de pujar-les.
//
// Una foto de tauleta fa 3-8 MB i 12 MP. Pujar-la tal qual vol dir minuts de
// pujada per WiFi, desenes de MB per galeria i molta memòria per descodificar.
// Amb canvas es resol al client, sense cap dependència ni cap feina al servidor.

const MAX_ORIGINAL_PX = 2000   // suficient per imprimir en A4 i per veure-la en gran
const MAX_THUMB_PX = 480
const Q_ORIGINAL = 0.85
const Q_THUMB = 0.72

function midaDestí(w, h, max) {
  if (w <= max && h <= max) return [w, h]
  return w >= h
    ? [max, Math.round((h * max) / w)]
    : [Math.round((w * max) / h), max]
}

async function aBitmap(file) {
  // imageOrientation: sense això el canvas perd l'EXIF i les fotos verticals
  // de tauleta surten girades.
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return null
  }
}

async function redimensiona(bitmap, maxPx, quality) {
  const [w, h] = midaDestí(bitmap.width, bitmap.height, maxPx)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

/**
 * Prepara un fitxer per pujar-lo.
 * Torna { file, thumb }: si alguna cosa falla, torna l'original sense miniatura
 * (el backend accepta que no n'hi hagi).
 *
 * @param {File} file
 * @param {boolean} qualitatOriginal  Si true, no toca el fitxer (només fa miniatura)
 */
export async function prepararAdjunt(file, qualitatOriginal = false) {
  if (!file.type.startsWith('image/')) return { file, thumb: null }

  const bitmap = await aBitmap(file)
  if (!bitmap) return { file, thumb: null }

  try {
    const thumbBlob = await redimensiona(bitmap, MAX_THUMB_PX, Q_THUMB)
    const thumb = thumbBlob ? new File([thumbBlob], 'thumb.jpg', { type: 'image/jpeg' }) : null

    if (qualitatOriginal) return { file, thumb }

    const gran = await redimensiona(bitmap, MAX_ORIGINAL_PX, Q_ORIGINAL)
    // Si el resultat no és més petit (imatge ja petita), val més l'original
    if (!gran || gran.size >= file.size) return { file, thumb }

    const nom = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return { file: new File([gran], nom, { type: 'image/jpeg' }), thumb }
  } catch {
    return { file, thumb: null }
  } finally {
    bitmap.close?.()
  }
}

export function formatarMida(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
