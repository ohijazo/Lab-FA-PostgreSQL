import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth'

const AuthContext = createContext(null)

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000 // 2 minuts

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    getMe()
      .then((u) => setUser(u))
      .finally(() => setLoading(false))
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search)
      apiLogout().finally(() => setUser(null))
    }, INACTIVITY_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    if (!user) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

    let throttleTimer = null
    function handleActivity() {
      if (throttleTimer) return
      throttleTimer = setTimeout(() => { throttleTimer = null }, 30000)
      resetTimer()
    }

    resetTimer()
    events.forEach(ev => window.addEventListener(ev, handleActivity, { passive: true }))

    return () => {
      events.forEach(ev => window.removeEventListener(ev, handleActivity))
      if (timerRef.current) clearTimeout(timerRef.current)
      if (throttleTimer) clearTimeout(throttleTimer)
    }
  }, [user, resetTimer])

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
