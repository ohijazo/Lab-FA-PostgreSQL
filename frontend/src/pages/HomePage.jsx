import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <>
      <h1>Lab FA</h1>
      <p>Sistema LIMS per al laboratori de la harinera.</p>
      <div className="grid">
        <Link to="/analisis/nou" role="button">Nova anàlisi Blat T1</Link>
        <Link to="/analisis" role="button" className="outline">Veure anàlisis</Link>
      </div>
    </>
  )
}
