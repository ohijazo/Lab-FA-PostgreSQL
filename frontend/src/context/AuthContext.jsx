import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then((u) => setUser(u))
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const u = await apiLogin(email, password)
    setUser(u)
    return u
  }

  async function logout() {
    await apiLogout()
    setUser(null)
  }

  if (loading) return null

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
