import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { llistarAdjunts, pujarAdjunt, eliminarAdjunt } from '../api/adjunts'
import { prepararAdjunt, formatarMida } from '../utils/imatges'
import Icon from './Icon'
import Button from './ui/Button'
import Modal from './ui/Modal'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'

export default function AdjuntsGaleria({ tipus, id, readOnly }) {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const confirm = useConfirm()

  const [adjunts, setAdjunts] = useState([])
  const [carregant, setCarregant] = useState(true)
  const [pujades, setPujades] = useState([])       // { nom, progres }
  const [qualitatOriginal, setQualitatOriginal] = useState(false)
  const [visor, setVisor] = useState(null)         // adjunt obert en gran
  const [arrossegant, setArrossegant] = useState(false)

  useEffect(() => {
    let viu = true
    setCarregant(true)
    llistarAdjunts(tipus, id)
      .then((res) => { if (viu) setAdjunts(res) })
      .catch(() => { if (viu) setAdjunts([]) })
      .finally(() => { if (viu) setCarregant(false) })
    return () => { viu = false }
  }, [tipus, id])

  const pujarFitxers = useCallback(async (fitxers) => {
    for (const original of Array.from(fitxers)) {
      const marca = { nom: original.name, progres: 0 }
      setPujades((p) => [...p, marca])
      const actualitza = (progres) =>
        setPujades((p) => p.map((x) => (x === marca ? { ...x, progres } : x)))
      try {
        const { file, thumb } = await prepararAdjunt(original, qualitatOriginal)
        const nou = await pujarAdjunt(tipus, id, file, thumb, actualitza)
        setAdjunts((prev) => [...prev, nou])
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setPujades((p) => p.filter((x) => x !== marca))
      }
    }
  }, [tipus, id, qualitatOriginal, addToast])

  function handleInput(e) {
    if (e.target.files?.length) pujarFitxers(e.target.files)
    e.target.value = ''   // permet tornar a triar el mateix fitxer
  }

  function handleDrop(e) {
    e.preventDefault()
    setArrossegant(false)
    if (readOnly) return
    if (e.dataTransfer.files?.length) pujarFitxers(e.dataTransfer.files)
  }

  async function handleEliminar(adjunt) {
    const ok = await confirm({
      title: t('adjunts.eliminar_titol'),
      message: t('adjunts.eliminar_confirm', { nom: adjunt.nom }),
      confirmLabel: t('common.eliminar'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await eliminarAdjunt(adjunt.id)
      setAdjunts((prev) => prev.filter((a) => a.id !== adjunt.id))
      if (visor?.id === adjunt.id) setVisor(null)
      addToast(t('adjunts.eliminat'))
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  function mou(delta) {
    const i = adjunts.findIndex((a) => a.id === visor?.id)
    if (i < 0) return
    const seguent = adjunts[(i + delta + adjunts.length) % adjunts.length]
    if (seguent) setVisor(seguent)
  }

  const imatges = adjunts.filter((a) => a.kind === 'image')
  const videos = adjunts.filter((a) => a.kind !== 'image')

  return (
    <>
      <section
        className={`detall-adjunts no-print${arrossegant ? ' is-dragover' : ''}`}
        onDragOver={(e) => { if (!readOnly) { e.preventDefault(); setArrossegant(true) } }}
        onDragLeave={() => setArrossegant(false)}
        onDrop={handleDrop}
      >
        <div className="detall-adjunts-header">
          <strong>
            <Icon name="Paperclip" size={14} /> {t('adjunts.titol')}
            {adjunts.length > 0 && ` (${adjunts.length})`}
          </strong>
          {!readOnly && (
            <div className="detall-adjunts-accions">
              <label className="adjunts-qualitat">
                <input
                  type="checkbox"
                  checked={qualitatOriginal}
                  onChange={(e) => setQualitatOriginal(e.target.checked)}
                />
                {t('adjunts.qualitat_original')}
              </label>
              {/* Etiqueta i no botó amb input.click(): el clic programàtic sobre un
                  input de fitxers el bloquegen alguns navegadors, i amb <label> el
                  diàleg s'obre sempre perquè el clic hi arriba de forma nativa. */}
              <label className="btn btn-outline btn-sm adjunts-boto">
                <span className="btn-icon"><Icon name="Camera" size={12} /></span>
                <span className="btn-label">{t('adjunts.fer_foto')}</span>
                <input type="file" accept="image/*" capture="environment"
                  onChange={handleInput} className="adjunts-input" />
              </label>
              <label className="btn btn-outline btn-sm adjunts-boto">
                <span className="btn-icon"><Icon name="Upload" size={12} /></span>
                <span className="btn-label">{t('adjunts.afegir')}</span>
                <input type="file" multiple accept="image/*,video/*"
                  onChange={handleInput} className="adjunts-input" />
              </label>
            </div>
          )}
        </div>

        {carregant ? (
          <p className="detall-adjunts-buit"><small>{t('common.carregant')}</small></p>
        ) : adjunts.length === 0 && pujades.length === 0 ? (
          <p className="detall-adjunts-buit">
            <small>{readOnly ? t('adjunts.cap') : t('adjunts.cap_arrossega')}</small>
          </p>
        ) : (
          <div className="adjunts-grid">
            {adjunts.map((a) => (
              <div key={a.id} className="adjunt-tile">
                <button type="button" className="adjunt-tile-obrir" onClick={() => setVisor(a)}
                  title={a.nom}>
                  {a.kind === 'image' ? (
                    <img
                      src={a.thumb_url || a.url}
                      alt={a.nom}
                      loading="lazy"
                      onError={(e) => { if (e.target.src !== a.url) e.target.src = a.url }}
                    />
                  ) : (
                    <span className="adjunt-tile-video">
                      <Icon name="Video" size={22} />
                      <span className="adjunt-tile-nom">{a.nom}</span>
                    </span>
                  )}
                </button>
                {!readOnly && (
                  <button type="button" className="adjunt-tile-treure"
                    onClick={() => handleEliminar(a)} aria-label={t('common.eliminar')}>
                    <Icon name="X" size={12} />
                  </button>
                )}
              </div>
            ))}
            {pujades.map((p, i) => (
              <div key={`pujada-${i}`} className="adjunt-tile adjunt-tile-pujant">
                <span className="adjunt-tile-nom">{p.nom}</span>
                <progress value={p.progres} max="100" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bloc d'impressió: es renderitza sempre (amagat a pantalla) perquè el
          navegador ja tingui les imatges descarregades quan es prem Imprimir. */}
      {adjunts.length > 0 && (
        <div className="print-adjunts">
          <h3 className="print-adjunts-titol">{t('adjunts.titol')}</h3>
          {imatges.length > 0 && (
            <div className="print-adjunts-grid">
              {imatges.map((a) => (
                <img key={a.id} className="print-adjunt-img" src={a.url} alt={a.nom} />
              ))}
            </div>
          )}
          {videos.length > 0 && (
            <p className="print-adjunts-videos">
              {t('adjunts.videos_impresos', { noms: videos.map((v) => v.nom).join(', ') })}
            </p>
          )}
        </div>
      )}

      <Modal
        open={!!visor}
        onClose={() => setVisor(null)}
        title={visor?.nom || ''}
        size="xl"
      >
        {visor && (
          <div className="adjunt-visor">
            {visor.kind === 'image' ? (
              <img src={visor.url} alt={visor.nom} />
            ) : (
              <video src={visor.url} controls playsInline preload="metadata" />
            )}
            <div className="adjunt-visor-peu">
              <small>
                {formatarMida(visor.mida)}
                {visor.pujat_per ? ` · ${t('adjunts.pujat_per', { nom: visor.pujat_per })}` : ''}
              </small>
              {adjunts.length > 1 && (
                <span className="adjunt-visor-nav">
                  <Button variant="ghost" size="sm" onClick={() => mou(-1)}
                    icon={<Icon name="ChevronLeft" size={14} />} aria-label={t('adjunts.anterior')} />
                  <Button variant="ghost" size="sm" onClick={() => mou(1)}
                    icon={<Icon name="ChevronRight" size={14} />} aria-label={t('adjunts.seguent')} />
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
