import { Link } from 'react-router-dom'

export default function AnalisisList({ analisis }) {
  if (analisis.length === 0) {
    return <p>No hi ha anàlisis registrades.</p>
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Codi</th>
          <th>Farina</th>
          <th>Lot</th>
          <th>Analista</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {analisis.map((a) => (
          <tr key={a.id}>
            <td>{a.data}</td>
            <td>{a.codi}</td>
            <td>{a.farina}</td>
            <td>{a.lot}</td>
            <td>{a.analista}</td>
            <td><Link to={`/analisis/${a.id}`}>Veure</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
