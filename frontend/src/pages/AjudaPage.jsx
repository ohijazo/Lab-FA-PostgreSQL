import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

/* ── Inline SVG mockups ── */

function MockNavbar() {
  return (
    <svg viewBox="0 0 700 44" className="ajuda-mock">
      <rect width="700" height="44" rx="6" fill="#1e293b" />
      {/* logo */}
      <rect x="14" y="10" width="24" height="24" rx="4" fill="#3b82f6" />
      <text x="44" y="22" fill="#fff" fontSize="13" fontWeight="700">Lab FC</text>
      <text x="44" y="34" fill="#94a3b8" fontSize="8">Gestió d'anàlisis</text>
      {/* links */}
      <text x="320" y="26" fill="#94a3b8" fontSize="10">Escàner</text>
      <text x="385" y="26" fill="#94a3b8" fontSize="10">Exportar Excel</text>
      <text x="485" y="26" fill="#94a3b8" fontSize="10">Ajuda</text>
      <rect x="530" y="12" width="85" height="20" rx="4" fill="#334155" />
      <text x="542" y="26" fill="#94a3b8" fontSize="10">Configuració ▾</text>
      <text x="640" y="26" fill="#ef4444" fontSize="10">Sortir</text>
      <text x="635" y="38" fill="#64748b" fontSize="7">Nom Usuari</text>
    </svg>
  )
}

function MockHomePage() {
  return (
    <svg viewBox="0 0 700 340" className="ajuda-mock">
      <rect width="700" height="340" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
      {/* KPI cards */}
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <rect x={16 + i * 170} y="16" width="155" height="56" rx="8" fill="#fff" stroke="#e2e8f0" />
          <text x={94 + i * 170} y="38" fill="#64748b" fontSize="9" textAnchor="middle">
            {['Total anàlisis', 'Aquest any', 'Aquest mes', 'Últim anàlisi'][i]}
          </text>
          <text x={94 + i * 170} y="58" fill="#2563eb" fontSize="16" fontWeight="700" textAnchor="middle">
            {['1.247', '342', '28', '25/03/26'][i]}
          </text>
        </g>
      ))}
      {/* search */}
      <rect x="16" y="86" width="180" height="28" rx="4" fill="#fff" stroke="#cbd5e1" />
      <text x="28" y="104" fill="#94a3b8" fontSize="10">Cercar tipus...</text>
      {/* table */}
      <rect x="16" y="124" width="668" height="28" rx="4" fill="#2563eb" />
      <text x="30" y="142" fill="#fff" fontSize="10" fontWeight="600">Tipus</text>
      <text x="370" y="142" fill="#fff" fontSize="10" fontWeight="600">Total</text>
      <text x="440" y="142" fill="#fff" fontSize="10" fontWeight="600">Mes</text>
      <text x="500" y="142" fill="#fff" fontSize="10" fontWeight="600">Última</text>
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x="16" y={156 + i * 36} width="668" height="32" fill={i % 2 ? '#f1f5f9' : '#fff'} />
          <text x="30" y={176 + i * 36} fill="#2563eb" fontSize="10" fontWeight="600">
            {['Blats T1', 'Farines MC', 'Bases'][i]}
          </text>
          <text x="30" y={184 + i * 36} fill="#94a3b8" fontSize="7">
            {['Blats tipus 1', 'Farines de mixtura', 'Bases de producció'][i]}
          </text>
          <text x="378" y="176" fill="#1e293b" fontSize="11" fontWeight="700">{['485', '312', '150'][i]}</text>
          <text x="448" y="176" fill="#1e293b" fontSize="11" fontWeight="700">{['12', '8', '4'][i]}</text>
          <text x="500" y="176" fill="#64748b" fontSize="9">{['25/03', '24/03', '22/03'][i]}</text>
          {/* buttons */}
          <rect x={570} y={160 + i * 36} width="32" height="18" rx="3" fill="#2563eb" />
          <text x={578} y={173 + i * 36} fill="#fff" fontSize="7">Nou</text>
          <rect x={607} y={160 + i * 36} width="35" height="18" rx="3" fill="none" stroke="#2563eb" />
          <text x={613} y={173 + i * 36} fill="#2563eb" fontSize="7">Llista</text>
          <rect x={647} y={160 + i * 36} width="30" height="18" rx="3" fill="none" stroke="#64748b" />
          <text x={650} y={173 + i * 36} fill="#64748b" fontSize="6.5">Dash</text>
        </g>
      ))}
      {/* recent activity */}
      <text x="16" y="278" fill="#64748b" fontSize="10" fontWeight="600">▸ Activitat recent</text>
      <rect x="16" y="288" width="668" height="40" rx="4" fill="#fff" stroke="#e2e8f0" />
      <text x="30" y="306" fill="#64748b" fontSize="9">Blats T1 — Codi: BT-2026-042 — Analista: Joan — 25/03/2026 14:32 — per Maria</text>
      <text x="30" y="320" fill="#64748b" fontSize="9">Farines MC — Codi: FM-2026-018 — Analista: Pere — 25/03/2026 11:15 — per Joan</text>
    </svg>
  )
}

function MockListPage() {
  return (
    <svg viewBox="0 0 700 260" className="ajuda-mock">
      <rect width="700" height="260" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
      {/* header */}
      <text x="16" y="30" fill="#1e293b" fontSize="16" fontWeight="700">Blats T1</text>
      <text x="16" y="44" fill="#64748b" fontSize="9">Blats tipus 1 — 485 registres</text>
      {/* toolbar */}
      <rect x="16" y="56" width="180" height="28" rx="4" fill="#fff" stroke="#cbd5e1" />
      <text x="28" y="74" fill="#94a3b8" fontSize="10">Cercar...</text>
      <rect x="210" y="56" width="80" height="28" rx="4" fill="none" stroke="#cbd5e1" />
      <text x="222" y="74" fill="#64748b" fontSize="9">▸ Filtres avançats</text>
      <rect x="580" y="56" width="100" height="28" rx="4" fill="#2563eb" />
      <text x="600" y="74" fill="#fff" fontSize="10">Nova anàlisi</text>
      {/* table */}
      <rect x="16" y="96" width="668" height="24" rx="3" fill="#f1f5f9" />
      {['Data ↑', 'Codi', 'Analista', 'Humitat %', 'W', 'P/L'].map((h, i) => (
        <text key={i} x={30 + i * 110} y="112" fill="#64748b" fontSize="9" fontWeight="600">{h}</text>
      ))}
      {[0, 1, 2, 3, 4].map(i => (
        <g key={i}>
          <rect x="16" y={124 + i * 24} width="668" height="22" fill={i % 2 ? '#fafbfc' : '#fff'} />
          <text x="30" y={139 + i * 24} fill="#1e293b" fontSize="9">
            {`${25 - i}/03/2026`}
          </text>
          <text x="140" y={139 + i * 24} fill="#1e293b" fontSize="9">{`BT-2026-0${42 - i}`}</text>
          <text x="250" y={139 + i * 24} fill="#1e293b" fontSize="9">{['Joan', 'Pere', 'Maria', 'Joan', 'Pere'][i]}</text>
          <text x="360" y={139 + i * 24} fill="#1e293b" fontSize="9">{['14.2', '13.8', '15.1', '14.5', '13.9'][i]}</text>
          <text x="470" y={139 + i * 24} fill={i === 2 ? '#dc2626' : '#1e293b'} fontSize="9" fontWeight={i === 2 ? '700' : '400'}>
            {['185', '192', '248', '178', '195'][i]}
          </text>
          <text x="580" y={139 + i * 24} fill="#1e293b" fontSize="9">{['0.65', '0.72', '0.58', '0.81', '0.69'][i]}</text>
        </g>
      ))}
      {/* pagination */}
      <text x="310" y="252" fill="#64748b" fontSize="9" textAnchor="middle">← Anterior   Pàgina 1 de 25   Següent →</text>
    </svg>
  )
}

function MockDetailPage() {
  return (
    <svg viewBox="0 0 700 280" className="ajuda-mock">
      <rect width="700" height="280" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
      {/* toolbar */}
      <rect x="16" y="12" width="668" height="32" rx="4" fill="#fff" stroke="#e2e8f0" />
      <rect x="24" y="18" width="60" height="20" rx="3" fill="none" stroke="#cbd5e1" />
      <text x="36" y="32" fill="#64748b" fontSize="9">← Tornar</text>
      <rect x="94" y="18" width="50" height="20" rx="3" fill="#2563eb" />
      <text x="104" y="32" fill="#fff" fontSize="9">Editar</text>
      <rect x="152" y="18" width="60" height="20" rx="3" fill="none" stroke="#2563eb" />
      <text x="162" y="32" fill="#2563eb" fontSize="9">Duplicar</text>
      <rect x="220" y="18" width="60" height="20" rx="3" fill="none" stroke="#64748b" />
      <text x="230" y="32" fill="#64748b" fontSize="9">Eliminar</text>
      <rect x="620" y="18" width="55" height="20" rx="3" fill="none" stroke="#cbd5e1" />
      <text x="628" y="32" fill="#64748b" fontSize="9">Imprimir</text>
      {/* QR */}
      <rect x="620" y="50" width="60" height="60" rx="4" fill="#fff" stroke="#e2e8f0" />
      <text x="650" y="84" fill="#94a3b8" fontSize="8" textAnchor="middle">QR</text>
      {/* section 1 */}
      <text x="16" y="66" fill="#1e293b" fontSize="13" fontWeight="700">Identificació</text>
      <rect x="16" y="70" width="200" height="2" fill="#2563eb" />
      <g>
        <text x="30" y="92" fill="#64748b" fontSize="8">Data</text>
        <text x="30" y="104" fill="#1e293b" fontSize="10" fontWeight="600">25/03/2026</text>
        <text x="150" y="92" fill="#64748b" fontSize="8">Codi</text>
        <text x="150" y="104" fill="#1e293b" fontSize="10" fontWeight="600">BT-2026-042</text>
        <text x="300" y="92" fill="#64748b" fontSize="8">Analista</text>
        <text x="300" y="104" fill="#1e293b" fontSize="10" fontWeight="600">Joan García</text>
        <text x="450" y="92" fill="#64748b" fontSize="8">Proveïdor</text>
        <text x="450" y="104" fill="#1e293b" fontSize="10" fontWeight="600">Cereals del Pla</text>
      </g>
      {/* section 2 */}
      <text x="16" y="136" fill="#1e293b" fontSize="13" fontWeight="700">Resultats anàlisi</text>
      <rect x="16" y="140" width="200" height="2" fill="#2563eb" />
      <g>
        <text x="30" y="162" fill="#64748b" fontSize="8">Humitat %</text>
        <text x="30" y="174" fill="#1e293b" fontSize="10" fontWeight="600">14.2</text>
        <text x="120" y="162" fill="#64748b" fontSize="8">Proteïna %</text>
        <text x="120" y="174" fill="#1e293b" fontSize="10" fontWeight="600">12.8</text>
        <text x="210" y="162" fill="#64748b" fontSize="8">W</text>
        <text x="210" y="174" fill="#1e293b" fontSize="10" fontWeight="600">185</text>
        <text x="270" y="162" fill="#64748b" fontSize="8">P/L</text>
        <text x="270" y="174" fill="#1e293b" fontSize="10" fontWeight="600">0.65</text>
        {/* alert example */}
        <rect x="340" y="152" width="70" height="28" rx="4" fill="#fef2f2" stroke="#fca5a5" />
        <text x="350" y="166" fill="#64748b" fontSize="8">Cendres %</text>
        <text x="350" y="178" fill="#dc2626" fontSize="10" fontWeight="700">0.92</text>
      </g>
      {/* section 3 */}
      <text x="16" y="208" fill="#1e293b" fontSize="13" fontWeight="700">Alveograma</text>
      <rect x="16" y="212" width="200" height="2" fill="#2563eb" />
      <g>
        <text x="30" y="232" fill="#64748b" fontSize="8">P</text>
        <text x="30" y="244" fill="#1e293b" fontSize="10" fontWeight="600">78</text>
        <text x="100" y="232" fill="#64748b" fontSize="8">L</text>
        <text x="100" y="244" fill="#1e293b" fontSize="10" fontWeight="600">120</text>
        <text x="170" y="232" fill="#64748b" fontSize="8">G</text>
        <text x="170" y="244" fill="#1e293b" fontSize="10" fontWeight="600">24.3</text>
        <text x="240" y="232" fill="#64748b" fontSize="8">Ie</text>
        <text x="240" y="244" fill="#1e293b" fontSize="10" fontWeight="600">58.2</text>
      </g>
      {/* metadata */}
      <text x="16" y="272" fill="#94a3b8" fontSize="7">Creat per: Maria López — 25/03/2026 09:14  |  Modificat per: Joan García — 25/03/2026 14:32</text>
    </svg>
  )
}

function MockDashboard() {
  return (
    <svg viewBox="0 0 700 280" className="ajuda-mock">
      <rect width="700" height="280" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
      {/* filters */}
      <text x="16" y="28" fill="#1e293b" fontSize="14" fontWeight="700">Dashboard — Blats T1</text>
      <rect x="16" y="38" width="120" height="24" rx="4" fill="#fff" stroke="#cbd5e1" />
      <text x="28" y="54" fill="#64748b" fontSize="8">Data inici: 01/01/2026</text>
      <rect x="144" y="38" width="120" height="24" rx="4" fill="#fff" stroke="#cbd5e1" />
      <text x="156" y="54" fill="#64748b" fontSize="8">Data fi: 25/03/2026</text>
      <rect x="272" y="38" width="120" height="24" rx="4" fill="#fff" stroke="#cbd5e1" />
      <text x="284" y="54" fill="#64748b" fontSize="8">Proveïdor: Tots</text>
      {/* KPI cards */}
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <rect x={16 + i * 170} y="72" width="155" height="50" rx="6" fill="#fff" stroke="#e2e8f0" />
          <text x={94 + i * 170} y="92" fill="#64748b" fontSize="8" textAnchor="middle">
            {['Humitat % (mitjana)', 'W (mitjana)', 'P/L (mitjana)', 'Proteïna % (mitjana)'][i]}
          </text>
          <text x={94 + i * 170} y="112" fill="#2563eb" fontSize="14" fontWeight="700" textAnchor="middle">
            {['14.1', '189.5', '0.68', '12.4'][i]}
          </text>
        </g>
      ))}
      {/* chart 1 - line */}
      <rect x="16" y="132" width="330" height="136" rx="6" fill="#fff" stroke="#e2e8f0" />
      <text x="26" y="150" fill="#64748b" fontSize="9" fontWeight="600">Evolució temporal — W</text>
      <polyline points="40,240 80,230 120,220 160,235 200,210 240,205 280,215 320,200" fill="none" stroke="#3b82f6" strokeWidth="2" />
      {[40,80,120,160,200,240,280,320].map((x, i) => (
        <circle key={i} cx={x} cy={[240,230,220,235,210,205,215,200][i]} r="3" fill="#3b82f6" />
      ))}
      <text x="40" y="258" fill="#94a3b8" fontSize="7">Gen</text>
      <text x="120" y="258" fill="#94a3b8" fontSize="7">Feb</text>
      <text x="200" y="258" fill="#94a3b8" fontSize="7">Mar</text>
      {/* chart 2 - bars */}
      <rect x="360" y="132" width="324" height="136" rx="6" fill="#fff" stroke="#e2e8f0" />
      <text x="370" y="150" fill="#64748b" fontSize="9" fontWeight="600">Per proveïdor — Humitat %</text>
      {[0, 1, 2, 3].map(i => {
        const h = [65, 50, 75, 40][i]
        return (
          <g key={i}>
            <rect x={395 + i * 65} y={255 - h} width="35" height={h} rx="3" fill={['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'][i]} />
            <text x={412 + i * 65} y="268" fill="#94a3b8" fontSize="7" textAnchor="middle">
              {['Prov A', 'Prov B', 'Prov C', 'Prov D'][i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function MockFormPage() {
  return (
    <svg viewBox="0 0 700 240" className="ajuda-mock">
      <rect width="700" height="240" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
      <text x="16" y="28" fill="#1e293b" fontSize="14" fontWeight="700">Nova anàlisi — Blats T1</text>
      {/* Section: Identificació */}
      <rect x="16" y="40" width="668" height="86" rx="6" fill="#fff" stroke="#e2e8f0" />
      <text x="26" y="58" fill="#1e293b" fontSize="11" fontWeight="700">Identificació</text>
      <rect x="26" y="62" width="120" height="2" fill="#2563eb" />
      {/* fields row */}
      {['Data *', 'Codi *', 'Analista *', 'Proveïdor'].map((label, i) => (
        <g key={i}>
          <text x={30 + i * 160} y="82" fill="#64748b" fontSize="8">{label}</text>
          <rect x={30 + i * 160} y="86" width="140" height="22" rx="3" fill="#fff" stroke="#cbd5e1" />
          <text x={38 + i * 160} y="100" fill={i === 0 ? '#1e293b' : '#94a3b8'} fontSize="9">
            {i === 0 ? '25/03/2026' : ['', 'BT-2026-...', 'Nom...', 'Selecciona...'][i]}
          </text>
        </g>
      ))}
      {/* Section: Resultats */}
      <rect x="16" y="134" width="668" height="70" rx="6" fill="#fff" stroke="#e2e8f0" />
      <text x="26" y="152" fill="#1e293b" fontSize="11" fontWeight="700">Resultats anàlisi</text>
      <rect x="26" y="156" width="120" height="2" fill="#2563eb" />
      {['Humitat %', 'Proteïna %', 'W', 'P/L', 'Cendres %'].map((label, i) => (
        <g key={i}>
          <text x={30 + i * 130} y="176" fill="#64748b" fontSize="8">{label}</text>
          <rect x={30 + i * 130} y="180" width="110" height="18" rx="3" fill="#fff" stroke="#cbd5e1" />
        </g>
      ))}
      {/* submit */}
      <rect x="16" y="214" width="80" height="22" rx="4" fill="#2563eb" />
      <text x="34" y="229" fill="#fff" fontSize="10" fontWeight="600">Desar</text>
      <rect x="104" y="214" width="80" height="22" rx="4" fill="none" stroke="#64748b" />
      <text x="118" y="229" fill="#64748b" fontSize="10">Cancel·lar</text>
    </svg>
  )
}

function MockAdminPage() {
  return (
    <svg viewBox="0 0 700 220" className="ajuda-mock">
      <rect width="700" height="220" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
      <text x="16" y="28" fill="#1e293b" fontSize="14" fontWeight="700">Gestió de tipus d'anàlisi</text>
      <text x="16" y="42" fill="#64748b" fontSize="9">Crea, edita o elimina tipus d'anàlisi i les seves seccions i camps</text>
      {/* create button */}
      <rect x="16" y="52" width="90" height="24" rx="4" fill="#2563eb" />
      <text x="30" y="68" fill="#fff" fontSize="9">Nou tipus</text>
      {/* table */}
      <rect x="16" y="84" width="668" height="24" rx="3" fill="#f1f5f9" />
      {['Nom', 'Slug', 'Anàlisis', 'Última', 'Accions', 'Dades'].map((h, i) => (
        <text key={i} x={[30, 160, 280, 350, 440, 580][i]} y="100" fill="#64748b" fontSize="9" fontWeight="600">{h}</text>
      ))}
      {[0, 1].map(i => (
        <g key={i}>
          <rect x="16" y={112 + i * 48} width="668" height="44" fill={i % 2 ? '#fafbfc' : '#fff'} />
          <text x="30" y={132 + i * 48} fill="#1e293b" fontSize="10" fontWeight="600">
            {['Blats T1', 'Farines MC'][i]}
          </text>
          <text x="160" y={132 + i * 48} fill="#64748b" fontSize="9">{['blats_t1', 'farines_mc'][i]}</text>
          <text x="290" y={132 + i * 48} fill="#2563eb" fontSize="10" fontWeight="700">{['485', '312'][i]}</text>
          <text x="350" y={132 + i * 48} fill="#64748b" fontSize="9">{['25/03', '24/03'][i]}</text>
          {/* action buttons */}
          {['Seccions', 'Editar', 'Duplicar'].map((btn, j) => (
            <g key={j}>
              <rect x={430 + j * 48} y={122 + i * 48} width={j === 0 ? 44 : 42} height="16" rx="3" fill="none" stroke={j < 2 ? '#2563eb' : '#64748b'} />
              <text x={435 + j * 48} y={134 + i * 48} fill={j < 2 ? '#2563eb' : '#64748b'} fontSize="7">{btn}</text>
            </g>
          ))}
          {/* data buttons */}
          {['Plantilla', 'Importar'].map((btn, j) => (
            <g key={j}>
              <rect x={575 + j * 50} y={122 + i * 48} width={j === 0 ? 44 : 42} height="16" rx="3" fill="none" stroke="#64748b" />
              <text x={580 + j * 50} y={134 + i * 48} fill="#64748b" fontSize="7">{btn}</text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  )
}

function MockExportDialog() {
  return (
    <svg viewBox="0 0 360 240" className="ajuda-mock" style={{ maxWidth: 400 }}>
      <rect width="360" height="240" rx="10" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
      {/* header */}
      <rect x="0" y="0" width="360" height="36" rx="10" fill="#f8fafc" />
      <rect x="0" y="20" width="360" height="16" fill="#f8fafc" />
      <text x="20" y="24" fill="#1e293b" fontSize="12" fontWeight="700">Exportar Excel</text>
      <text x="330" y="22" fill="#94a3b8" fontSize="14">×</text>
      {/* dates */}
      <text x="20" y="56" fill="#64748b" fontSize="9">De</text>
      <rect x="20" y="60" width="150" height="22" rx="3" fill="#fff" stroke="#cbd5e1" />
      <text x="190" y="56" fill="#64748b" fontSize="9">A</text>
      <rect x="190" y="60" width="150" height="22" rx="3" fill="#fff" stroke="#cbd5e1" />
      {/* checkboxes */}
      <text x="20" y="104" fill="#64748b" fontSize="9" fontWeight="600">Tipus d'anàlisi</text>
      {['Seleccionar tots', 'Blats T1', 'Farines MC', 'Bases'].map((t, i) => (
        <g key={i}>
          <rect x="20" y={110 + i * 22} width="12" height="12" rx="2" fill={i < 2 ? '#2563eb' : '#fff'} stroke="#cbd5e1" />
          {i < 2 && <text x="23" y={120 + i * 22} fill="#fff" fontSize="9">✓</text>}
          <text x="38" y={120 + i * 22} fill="#1e293b" fontSize="9">{t}</text>
        </g>
      ))}
      {/* buttons */}
      <rect x="180" y="206" width="80" height="24" rx="4" fill="none" stroke="#64748b" />
      <text x="195" y="222" fill="#64748b" fontSize="9">Cancel·lar</text>
      <rect x="268" y="206" width="72" height="24" rx="4" fill="#2563eb" />
      <text x="282" y="222" fill="#fff" fontSize="9">Exportar</text>
    </svg>
  )
}

function MockScannerDialog() {
  return (
    <svg viewBox="0 0 320 240" className="ajuda-mock" style={{ maxWidth: 360 }}>
      <rect width="320" height="240" rx="10" fill="#1e293b" />
      <text x="160" y="24" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle">Escàner de codis</text>
      <text x="300" y="20" fill="#94a3b8" fontSize="14">×</text>
      {/* camera view */}
      <rect x="20" y="36" width="280" height="160" rx="6" fill="#0f172a" />
      {/* scan line */}
      <line x1="60" y1="116" x2="260" y2="116" stroke="#3b82f6" strokeWidth="2" opacity="0.7" />
      {/* corners */}
      <path d="M60,76 L60,60 L76,60" fill="none" stroke="#3b82f6" strokeWidth="2" />
      <path d="M260,76 L260,60 L244,60" fill="none" stroke="#3b82f6" strokeWidth="2" />
      <path d="M60,156 L60,172 L76,172" fill="none" stroke="#3b82f6" strokeWidth="2" />
      <path d="M260,156 L260,172 L244,172" fill="none" stroke="#3b82f6" strokeWidth="2" />
      {/* barcode illustration */}
      {[100,105,108,114,118,120,126,130,134,138,142,148,152,156,160,166,170,174,178,182,188,192,196,200,206,210,214,220].map((x, i) => (
        <rect key={i} x={x} y="90" width={i % 3 === 0 ? 3 : 1.5} height="52" fill="#94a3b8" opacity="0.3" />
      ))}
      {/* status */}
      <text x="160" y="212" fill="#94a3b8" fontSize="9" textAnchor="middle">Apunta la càmera al codi de barres</text>
      <rect x="80" y="220" width="160" height="14" rx="3" fill="#334155" />
      <text x="160" y="231" fill="#94a3b8" fontSize="8" textAnchor="middle">O escriu el codi manualment...</text>
    </svg>
  )
}

/* ── Info/tip boxes ── */

function InfoBox({ children }) {
  return (
    <div className="ajuda-info">
      <span className="ajuda-info-icon">i</span>
      <div>{children}</div>
    </div>
  )
}

function TipBox({ children }) {
  return (
    <div className="ajuda-tip">
      <span className="ajuda-tip-icon">&#9733;</span>
      <div>{children}</div>
    </div>
  )
}

function WarningBox({ children }) {
  return (
    <div className="ajuda-warning">
      <span className="ajuda-warning-icon">!</span>
      <div>{children}</div>
    </div>
  )
}

function StepList({ steps }) {
  return (
    <ol className="ajuda-steps">
      {steps.map((step, i) => (
        <li key={i} className="ajuda-step">
          <span className="ajuda-step-num">{i + 1}</span>
          <div className="ajuda-step-text">{step}</div>
        </li>
      ))}
    </ol>
  )
}

/* ── Main page ── */

export default function AjudaPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isViewer = user?.role === 'viewer'

  const sections = [
    { id: 'introduccio', title: t('ajuda.seccio_introduccio') },
    { id: 'navegacio', title: t('ajuda.seccio_navegacio') },
    { id: 'inici', title: t('ajuda.seccio_inici') },
    { id: 'llista', title: t('ajuda.seccio_llista') },
    { id: 'crear', title: t('ajuda.seccio_crear') },
    { id: 'detall', title: t('ajuda.seccio_detall') },
    { id: 'dashboard', title: t('ajuda.seccio_dashboard') },
    { id: 'escaner', title: t('ajuda.seccio_escaner') },
    { id: 'exportar', title: t('ajuda.seccio_exportar') },
    ...(isAdmin ? [
      { id: 'admin-tipus', title: t('ajuda.seccio_admin_tipus') },
      { id: 'admin-camps', title: t('ajuda.seccio_admin_camps') },
      { id: 'admin-importar', title: t('ajuda.seccio_admin_importar') },
      { id: 'admin-usuaris', title: t('ajuda.seccio_admin_usuaris') },
    ] : []),
    { id: 'rols', title: t('ajuda.seccio_rols') },
  ]

  return (
    <div className="ajuda-page">
      {/* Hero */}
      <div className="ajuda-hero">
        <h1>{t('ajuda.manual_usuari')}</h1>
        <p>{t('ajuda.guia_completa')}</p>
      </div>

      {/* Table of contents */}
      <nav className="ajuda-toc">
        <div className="ajuda-toc-title">{t('ajuda.contingut')}</div>
        <div className="ajuda-toc-grid">
          {sections.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className="ajuda-toc-item">
              <span className="ajuda-toc-num">{i + 1}</span>
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      {/* 1. Introducció */}
      <section id="introduccio" className="ajuda-section">
        <div className="ajuda-section-header">
          <span className="ajuda-section-num">1</span>
          <h2>{t('ajuda.seccio_introduccio')}</h2>
        </div>
        <p>
          <Trans i18nKey="ajuda.intro_p1"><strong>Lab FC</strong></Trans>
        </p>
        <div className="ajuda-features-grid">
          <div className="ajuda-feature">
            <div className="ajuda-feature-icon">&#9881;</div>
            <strong>{t('ajuda.feature_dinamic')}</strong>
            <p>{t('ajuda.feature_dinamic_desc')}</p>
          </div>
          <div className="ajuda-feature">
            <div className="ajuda-feature-icon">&#128202;</div>
            <strong>{t('ajuda.feature_dashboards')}</strong>
            <p>{t('ajuda.feature_dashboards_desc')}</p>
          </div>
          <div className="ajuda-feature">
            <div className="ajuda-feature-icon">&#128196;</div>
            <strong>{t('ajuda.feature_excel')}</strong>
            <p>{t('ajuda.feature_excel_desc')}</p>
          </div>
          <div className="ajuda-feature">
            <div className="ajuda-feature-icon">&#128247;</div>
            <strong>{t('ajuda.feature_escaner')}</strong>
            <p>{t('ajuda.feature_escaner_desc')}</p>
          </div>
        </div>
      </section>

      {/* 2. Navegació */}
      <section id="navegacio" className="ajuda-section">
        <div className="ajuda-section-header">
          <span className="ajuda-section-num">2</span>
          <h2>{t('ajuda.nav_title')}</h2>
        </div>
        <p>{t('ajuda.nav_desc')}</p>
        <figure className="ajuda-figure">
          <MockNavbar />
          <figcaption>{t('ajuda.nav_fig')}</figcaption>
        </figure>
        <table className="ajuda-ref-table">
          <thead>
            <tr>
              <th>{t('ajuda.nav_element')}</th>
              <th>{t('ajuda.nav_descripcio')}</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><strong>{t('ajuda.nav_logo')}</strong></td><td>{t('ajuda.nav_logo_desc')}</td></tr>
            <tr><td><strong>{t('ajuda.nav_escaner')}</strong></td><td>{t('ajuda.nav_escaner_desc')}</td></tr>
            <tr><td><strong>{t('ajuda.nav_exportar')}</strong></td><td>{t('ajuda.nav_exportar_desc')}</td></tr>
            <tr><td><strong>{t('ajuda.nav_ajuda')}</strong></td><td>{t('ajuda.nav_ajuda_desc')}</td></tr>
            {isAdmin && <tr><td><strong>{t('ajuda.nav_config')}</strong></td><td>{t('ajuda.nav_config_desc')}</td></tr>}
            <tr><td><strong>{t('ajuda.nav_sortir')}</strong></td><td>{t('ajuda.nav_sortir_desc')}</td></tr>
            <tr><td><strong>{t('ajuda.nav_usuari')}</strong></td><td>{t('ajuda.nav_usuari_desc')}</td></tr>
          </tbody>
        </table>
      </section>

      {/* 3. Pàgina d'inici */}
      <section id="inici" className="ajuda-section">
        <div className="ajuda-section-header">
          <span className="ajuda-section-num">3</span>
          <h2>{t('ajuda.inici_title')}</h2>
        </div>
        <p>
          {t('ajuda.inici_desc')}
        </p>
        <figure className="ajuda-figure">
          <MockHomePage />
          <figcaption>{t('ajuda.inici_fig')}</figcaption>
        </figure>
        <h3>{t('ajuda.inici_elements')}</h3>
        <table className="ajuda-ref-table">
          <thead>
            <tr><th>{t('ajuda.inici_zona')}</th><th>{t('ajuda.nav_descripcio')}</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>{t('ajuda.inici_kpi')}</strong></td><td>{t('ajuda.inici_kpi_desc')}</td></tr>
            <tr><td><strong>{t('ajuda.inici_cercador')}</strong></td><td>{t('ajuda.inici_cercador_desc')}</td></tr>
            <tr><td><strong>{t('ajuda.inici_taula')}</strong></td><td>{t('ajuda.inici_taula_desc')}</td></tr>
            <tr><td><strong>{t('ajuda.inici_activitat')}</strong></td><td>{t('ajuda.inici_activitat_desc')}</td></tr>
          </tbody>
        </table>
        <TipBox>{t('ajuda.inici_tip')}</TipBox>
      </section>

      {/* 4. Llista d'anàlisis */}
      <section id="llista" className="ajuda-section">
        <div className="ajuda-section-header">
          <span className="ajuda-section-num">4</span>
          <h2>{t('ajuda.llista_title')}</h2>
        </div>
        <p>{t('ajuda.llista_desc')}</p>
        <figure className="ajuda-figure">
          <MockListPage />
          <figcaption>{t('ajuda.llista_fig')}</figcaption>
        </figure>
        <h3>{t('ajuda.llista_func')}</h3>
        <ul>
          <li><strong>{t('ajuda.llista_cerca')}</strong>: {t('ajuda.llista_cerca_desc')}</li>
          <li><strong>{t('ajuda.llista_filtres')}</strong>: {t('ajuda.llista_filtres_desc')}</li>
          <li><strong>{t('ajuda.llista_ordenacio')}</strong>: {t('ajuda.llista_ordenacio_desc')}</li>
          <li><strong>{t('ajuda.llista_paginacio')}</strong>: {t('ajuda.llista_paginacio_desc')}</li>
          <li><strong>{t('ajuda.llista_alertes')}</strong>: {t('ajuda.llista_alertes_desc')}</li>
        </ul>
        <InfoBox>{t('ajuda.llista_info')}</InfoBox>
      </section>

      {/* 5. Crear */}
      <section id="crear" className="ajuda-section">
        <div className="ajuda-section-header">
          <span className="ajuda-section-num">5</span>
          <h2>{t('ajuda.crear_title')}</h2>
        </div>
        {isViewer ? (
          <WarningBox>{t('ajuda.crear_viewer_warning')}</WarningBox>
        ) : (
          <>
            <figure className="ajuda-figure">
              <MockFormPage />
              <figcaption>{t('ajuda.crear_fig')}</figcaption>
            </figure>
            <h3>{t('ajuda.crear_passos')}</h3>
            <StepList steps={[
              t('ajuda.crear_pas1'),
              <Trans i18nKey="ajuda.crear_pas2"><strong>Nova anàlisi</strong></Trans>,
              <Trans i18nKey="ajuda.crear_pas3"><strong>*</strong></Trans>,
              <Trans i18nKey="ajuda.crear_pas4"><strong>seccions</strong></Trans>,
              <Trans i18nKey="ajuda.crear_pas5"><strong>Desar</strong></Trans>,
            ]} />
            <TipBox>
              <Trans i18nKey="ajuda.crear_tip_data"><em>Data</em><strong>Duplicar</strong></Trans>
            </TipBox>
          </>
        )}
      </section>

      {/* 6. Detall i editar */}
      <section id="detall" className="ajuda-section">
        <div className="ajuda-section-header">
          <span className="ajuda-section-num">6</span>
          <h2>{t('ajuda.detall_title')}</h2>
        </div>
        <p>{t('ajuda.detall_desc')}</p>
        <figure className="ajuda-figure">
          <MockDetailPage />
          <figcaption>{t('ajuda.detall_fig')}</figcaption>
        </figure>
        <h3>{t('ajuda.detall_elements')}</h3>
        <table className="ajuda-ref-table">
          <thead>
            <tr><th>{t('ajuda.nav_element')}</th><th>{t('ajuda.nav_descripcio')}</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>{t('ajuda.detall_barra')}</strong></td><td>{t('ajuda.detall_barra_desc')}</td></tr>
            <tr><td><strong>{t('ajuda.detall_qr')}</strong></td><td>{t('ajuda.detall_qr_desc')}</td></tr>
            <tr><td><strong>{t('ajuda.detall_seccions')}</strong></td><td>{t('ajuda.detall_seccions_desc')}</td></tr>
            <tr><td><strong>{t('ajuda.detall_alertes')}</strong></td><td>{t('ajuda.detall_alertes_desc')}</td></tr>
            <tr><td><strong>{t('ajuda.detall_meta')}</strong></td><td>{t('ajuda.detall_meta_desc')}</td></tr>
          </tbody>
        </table>
        {!isViewer && (
          <>
            <h3>{t('ajuda.detall_edicio')}</h3>
            <p>
              <Trans i18nKey="ajuda.detall_edicio_desc"><strong>Editar</strong></Trans>
            </p>
            <WarningBox>
              <Trans i18nKey="ajuda.detall_bloqueig"><strong>Bloqueig d'edició</strong></Trans>
            </WarningBox>
          </>
        )}
        <TipBox>
          <Trans i18nKey="ajuda.detall_imprimir_tip"><strong>Imprimir</strong></Trans>
        </TipBox>
      </section>

      {/* 7. Dashboard */}
      <section id="dashboard" className="ajuda-section">
        <div className="ajuda-section-header">
          <span className="ajuda-section-num">7</span>
          <h2>{t('ajuda.dashboard_title')}</h2>
        </div>
        <p>
          {t('ajuda.dashboard_desc')}
        </p>
        <figure className="ajuda-figure">
          <MockDashboard />
          <figcaption>{t('ajuda.dashboard_fig')}</figcaption>
        </figure>
        <h3>{t('ajuda.dashboard_func')}</h3>
        <ul>
          <li><strong>{t('ajuda.dashboard_filtres_data')}</strong>: {t('ajuda.dashboard_filtres_data_desc')}</li>
          <li><strong>{t('ajuda.dashboard_filtres_cascada')}</strong>: {t('ajuda.dashboard_filtres_cascada_desc')}</li>
          <li><strong>{t('ajuda.dashboard_kpi')}</strong>: {t('ajuda.dashboard_kpi_desc')}</li>
          <li><strong>{t('ajuda.dashboard_linia')}</strong>: {t('ajuda.dashboard_linia_desc')}</li>
          <li><strong>{t('ajuda.dashboard_barres')}</strong>: {t('ajuda.dashboard_barres_desc')}</li>
          <li><strong>{t('ajuda.dashboard_taula')}</strong>: {t('ajuda.dashboard_taula_desc')}</li>
        </ul>
      </section>

      {/* 8. Escàner */}
      <section id="escaner" className="ajuda-section">
        <div className="ajuda-section-header">
          <span className="ajuda-section-num">8</span>
          <h2>{t('ajuda.escaner_title')}</h2>
        </div>
        <div className="ajuda-two-cols">
          <div>
            <p>
              {t('ajuda.escaner_desc')}
            </p>
            <StepList steps={[
              <Trans i18nKey="ajuda.escaner_pas1"><strong>Escàner</strong></Trans>,
              t('ajuda.escaner_pas2'),
              t('ajuda.escaner_pas3'),
              t('ajuda.escaner_pas4'),
            ]} />
            <InfoBox>{t('ajuda.escaner_info')}</InfoBox>
          </div>
          <figure className="ajuda-figure" style={{ margin: 0 }}>
            <MockScannerDialog />
            <figcaption>{t('ajuda.escaner_fig')}</figcaption>
          </figure>
        </div>
      </section>

      {/* 9. Exportar */}
      <section id="exportar" className="ajuda-section">
        <div className="ajuda-section-header">
          <span className="ajuda-section-num">9</span>
          <h2>{t('ajuda.exportar_title')}</h2>
        </div>
        <div className="ajuda-two-cols">
          <div>
            <p>
              {t('ajuda.exportar_desc')}
            </p>
            <StepList steps={[
              <Trans i18nKey="ajuda.exportar_pas1"><strong>Exportar Excel</strong></Trans>,
              t('ajuda.exportar_pas2'),
              t('ajuda.exportar_pas3'),
              <Trans i18nKey="ajuda.exportar_pas4"><strong>Exportar</strong></Trans>,
            ]} />
            <TipBox>
              {t('ajuda.exportar_tip')}
            </TipBox>
          </div>
          <figure className="ajuda-figure" style={{ margin: 0 }}>
            <MockExportDialog />
            <figcaption>{t('ajuda.exportar_fig')}</figcaption>
          </figure>
        </div>
      </section>

      {/* Admin sections */}
      {isAdmin && (
        <>
          {/* 10. Admin: Tipus */}
          <section id="admin-tipus" className="ajuda-section">
            <div className="ajuda-section-header">
              <span className="ajuda-section-num">10</span>
              <h2>{t('ajuda.admin_tipus_title')}</h2>
            </div>
            <p>
              <Trans i18nKey="ajuda.admin_tipus_desc">
                <Link to="/admin/tipus"><strong>Configuració → Tipus d'Anàlisi</strong></Link>
              </Trans>
            </p>
            <figure className="ajuda-figure">
              <MockAdminPage />
              <figcaption>{t('ajuda.admin_tipus_fig')}</figcaption>
            </figure>
            <h3>{t('ajuda.admin_tipus_accions')}</h3>
            <table className="ajuda-ref-table">
              <thead>
                <tr><th>{t('ajuda.admin_tipus_accio')}</th><th>{t('ajuda.nav_descripcio')}</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>{t('ajuda.admin_tipus_nou')}</strong></td><td>{t('ajuda.admin_tipus_nou_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_tipus_seccions')}</strong></td><td>{t('ajuda.admin_tipus_seccions_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_tipus_editar')}</strong></td><td>{t('ajuda.admin_tipus_editar_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_tipus_duplicar')}</strong></td><td>{t('ajuda.admin_tipus_duplicar_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_tipus_eliminar')}</strong></td><td>{t('ajuda.admin_tipus_eliminar_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_tipus_plantilla')}</strong></td><td>{t('ajuda.admin_tipus_plantilla_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_tipus_importar')}</strong></td><td>{t('ajuda.admin_tipus_importar_desc')}</td></tr>
              </tbody>
            </table>
          </section>

          {/* 11. Admin: Seccions i camps */}
          <section id="admin-camps" className="ajuda-section">
            <div className="ajuda-section-header">
              <span className="ajuda-section-num">11</span>
              <h2>{t('ajuda.admin_camps_title')}</h2>
            </div>
            <h3>{t('ajuda.admin_camps_seccions')}</h3>
            <p>
              {t('ajuda.admin_camps_seccions_desc')}
            </p>
            <ul>
              <li><strong>{t('ajuda.admin_camps_reordenar')}</strong>: {t('ajuda.admin_camps_reordenar_desc')}</li>
              <li><strong>{t('ajuda.admin_camps_columnes')}</strong>: {t('ajuda.admin_camps_columnes_desc')}</li>
            </ul>

            <h3>{t('ajuda.admin_camps_camps')}</h3>
            <p>{t('ajuda.admin_camps_camps_desc')}</p>
            <table className="ajuda-ref-table">
              <thead>
                <tr><th>{t('ajuda.admin_camps_prop')}</th><th>{t('ajuda.nav_descripcio')}</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>{t('ajuda.admin_camps_name')}</strong></td><td><Trans i18nKey="ajuda.admin_camps_name_desc"><code>humitat_pct</code></Trans></td></tr>
                <tr><td><strong>{t('ajuda.admin_camps_label')}</strong></td><td>{t('ajuda.admin_camps_label_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_camps_tipus')}</strong></td><td><Trans i18nKey="ajuda.admin_camps_tipus_desc"><code>text</code><code>number</code><code>date</code><code>textarea</code><code>checkbox</code><code>select</code></Trans></td></tr>
                <tr><td><strong>{t('ajuda.admin_camps_obligatori')}</strong></td><td>{t('ajuda.admin_camps_obligatori_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_camps_grup')}</strong></td><td>{t('ajuda.admin_camps_grup_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_camps_ordre')}</strong></td><td>{t('ajuda.admin_camps_ordre_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_camps_alerta')}</strong></td><td>{t('ajuda.admin_camps_alerta_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_camps_color')}</strong></td><td>{t('ajuda.admin_camps_color_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_camps_opcions')}</strong></td><td><Trans i18nKey="ajuda.admin_camps_opcions_desc"><code>select</code></Trans></td></tr>
              </tbody>
            </table>
            <TipBox>
              <Trans i18nKey="ajuda.admin_camps_tip"><strong>grup</strong></Trans>
            </TipBox>
          </section>

          {/* 12. Admin: Importar */}
          <section id="admin-importar" className="ajuda-section">
            <div className="ajuda-section-header">
              <span className="ajuda-section-num">12</span>
              <h2>{t('ajuda.admin_importar_title')}</h2>
            </div>
            <p>
              {t('ajuda.admin_importar_desc')}
            </p>
            <StepList steps={[
              <Trans i18nKey="ajuda.admin_importar_pas1"><strong>Plantilla</strong></Trans>,
              t('ajuda.admin_importar_pas2'),
              <Trans i18nKey="ajuda.admin_importar_pas3"><strong>Importar</strong></Trans>,
              t('ajuda.admin_importar_pas4'),
              t('ajuda.admin_importar_pas5'),
            ]} />
            <h3>{t('ajuda.admin_importar_matching')}</h3>
            <InfoBox>
              <Trans i18nKey="ajuda.admin_importar_matching_desc"><strong>label</strong><strong>name</strong></Trans>
            </InfoBox>
            <WarningBox>
              <Trans i18nKey="ajuda.admin_importar_warning"><strong>codi</strong></Trans>
            </WarningBox>
          </section>

          {/* 13. Admin: Usuaris */}
          <section id="admin-usuaris" className="ajuda-section">
            <div className="ajuda-section-header">
              <span className="ajuda-section-num">13</span>
              <h2>{t('ajuda.admin_usuaris_title')}</h2>
            </div>
            <p>
              <Trans i18nKey="ajuda.admin_usuaris_desc">
                <Link to="/admin/users"><strong>Configuració → Gestió d'Usuaris</strong></Link>
              </Trans>
            </p>
            <h3>{t('ajuda.admin_usuaris_crear')}</h3>
            <table className="ajuda-ref-table">
              <thead>
                <tr><th>{t('ajuda.admin_usuaris_camp')}</th><th>{t('ajuda.nav_descripcio')}</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>{t('ajuda.admin_usuaris_email')}</strong></td><td>{t('ajuda.admin_usuaris_email_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_usuaris_nom')}</strong></td><td>{t('ajuda.admin_usuaris_nom_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_usuaris_pwd')}</strong></td><td>{t('ajuda.admin_usuaris_pwd_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_usuaris_rol')}</strong></td><td>{t('ajuda.admin_usuaris_rol_desc')}</td></tr>
              </tbody>
            </table>
            <h3>{t('ajuda.admin_usuaris_correu')}</h3>
            <p>
              <Trans i18nKey="ajuda.admin_usuaris_correu_desc"><strong>Correu</strong></Trans>
            </p>
            <table className="ajuda-ref-table">
              <thead>
                <tr><th>{t('ajuda.admin_usuaris_camp')}</th><th>{t('ajuda.nav_descripcio')}</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>{t('ajuda.admin_usuaris_correu_nom')}</strong></td><td>{t('ajuda.admin_usuaris_correu_nom_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_usuaris_correu_email')}</strong></td><td>{t('ajuda.admin_usuaris_correu_email_desc')}</td></tr>
                <tr><td><strong>{t('ajuda.admin_usuaris_correu_smtp')}</strong></td><td>{t('ajuda.admin_usuaris_correu_smtp_desc')}</td></tr>
              </tbody>
            </table>
            <InfoBox>{t('ajuda.admin_usuaris_correu_info')}</InfoBox>
          </section>
        </>
      )}

      {/* Rols */}
      <section id="rols" className="ajuda-section">
        <div className="ajuda-section-header">
          <span className="ajuda-section-num">{isAdmin ? 14 : 10}</span>
          <h2>{t('ajuda.rols_title')}</h2>
        </div>
        <p>{t('ajuda.rols_desc')}</p>
        <div className="ajuda-roles-grid">
          <div className="ajuda-role-card ajuda-role-admin">
            <div className="ajuda-role-title">{t('ajuda.rol_admin')}</div>
            <ul>
              <li>{t('ajuda.rol_admin_1')}</li>
              <li>{t('ajuda.rol_admin_2')}</li>
              <li>{t('ajuda.rol_admin_3')}</li>
              <li>{t('ajuda.rol_admin_4')}</li>
              <li>{t('ajuda.rol_admin_5')}</li>
              <li>{t('ajuda.rol_admin_6')}</li>
            </ul>
          </div>
          <div className="ajuda-role-card ajuda-role-editor">
            <div className="ajuda-role-title">{t('ajuda.rol_editor')}</div>
            <ul>
              <li>{t('ajuda.rol_editor_1')}</li>
              <li>{t('ajuda.rol_editor_2')}</li>
              <li>{t('ajuda.rol_editor_3')}</li>
              <li>{t('ajuda.rol_editor_4')}</li>
              <li>{t('ajuda.rol_editor_5')}</li>
              <li style={{ color: '#94a3b8' }}>{t('ajuda.rol_editor_6')}</li>
            </ul>
          </div>
          <div className="ajuda-role-card ajuda-role-viewer">
            <div className="ajuda-role-title">{t('ajuda.rol_viewer')}</div>
            <ul>
              <li>{t('ajuda.rol_viewer_1')}</li>
              <li>{t('ajuda.rol_viewer_2')}</li>
              <li>{t('ajuda.rol_viewer_3')}</li>
              <li>{t('ajuda.rol_viewer_4')}</li>
              <li style={{ color: '#94a3b8' }}>{t('ajuda.rol_viewer_5')}</li>
              <li style={{ color: '#94a3b8' }}>{t('ajuda.rol_viewer_6')}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="ajuda-footer">
        <p>{t('ajuda.footer_dubtes')}</p>
        <p><Link to="/">{t('ajuda.footer_tornar')}</Link></p>
      </div>
    </div>
  )
}
