import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LlistaPage from './pages/LlistaPage'
import NouAnalisiPage from './pages/NouAnalisiPage'
import EditarAnalisiPage from './pages/EditarAnalisiPage'
import DetallPage from './pages/DetallPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/analisis" element={<LlistaPage />} />
        <Route path="/analisis/nou" element={<NouAnalisiPage />} />
        <Route path="/analisis/:id" element={<DetallPage />} />
        <Route path="/analisis/:id/editar" element={<EditarAnalisiPage />} />
      </Routes>
    </Layout>
  )
}
