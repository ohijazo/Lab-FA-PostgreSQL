import { useEffect, useState } from 'react'

/**
 * QR Code generator — SVG pur, carrega qrcode-generator des de CDN.
 * Ideal per impressió (vectorial, sense pixelació).
 */

let qrGeneratorPromise = null
function loadQRGenerator() {
  if (!qrGeneratorPromise) {
    qrGeneratorPromise = import(
      /* @vite-ignore */
      'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm'
    ).then(m => m.default || m)
  }
  return qrGeneratorPromise
}

export default function QRCode({ value, size = 120 }) {
  const [rects, setRects] = useState(null)

  useEffect(() => {
    if (!value) return

    loadQRGenerator().then(qrcode => {
      const qr = qrcode(0, 'M')
      qr.addData(String(value))
      qr.make()

      const moduleCount = qr.getModuleCount()
      const cellSize = size / moduleCount
      const result = []

      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            result.push({ x: col * cellSize, y: row * cellSize, w: cellSize, h: cellSize })
          }
        }
      }

      setRects(result)
    }).catch(() => setRects(null))
  }, [value, size])

  if (!value || !rects) return null

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block' }}
    >
      <rect width={size} height={size} fill="#fff" />
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#000" />
      ))}
    </svg>
  )
}
