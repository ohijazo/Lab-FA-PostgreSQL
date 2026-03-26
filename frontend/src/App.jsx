import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LlistaPage from './pages/LlistaPage'
import NouAnalisiPage from './pages/NouAnalisiPage'
import EditarAnalisiPage from './pages/EditarAnalisiPage'
import DetallPage from './pages/DetallPage'
import DashboardPage from './pages/DashboardPage'
import AdminTipusPage from './pages/AdminTipusPage'
import AdminSeccionsPage from './pages/AdminSeccionsPage'
import AdminCampsPage from './pages/AdminCampsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminImportPage from './pages/AdminImportPage'
import LoginPage from './pages/LoginPage'
import AjudaPage from './pages/AjudaPage'

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function WriteRoute({ children }) {
  const { user } = useAuth()
  if (user?.role === 'viewer') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  if (!user) return <LoginPage />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/tipus" element={<AdminRoute><AdminTipusPage /></AdminRoute>} />
        <Route path="/admin/tipus/:tipusId/seccions" element={<AdminRoute><AdminSeccionsPage /></AdminRoute>} />
        <Route path="/admin/seccions/:seccioId/camps" element={<AdminRoute><AdminCampsPage /></AdminRoute>} />
        <Route path="/admin/tipus/:tipusId/import" element={<AdminRoute><AdminImportPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/ajuda" element={<AjudaPage />} />
        <Route path="/dashboard/:tipus" element={<DashboardPage />} />
        <Route path="/:tipus" element={<LlistaPage />} />
        <Route path="/:tipus/nou" element={<WriteRoute><NouAnalisiPage /></WriteRoute>} />
        <Route path="/:tipus/:id" element={<DetallPage />} />
        <Route path="/:tipus/:id/editar" element={<WriteRoute><EditarAnalisiPage /></WriteRoute>} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  )
}
