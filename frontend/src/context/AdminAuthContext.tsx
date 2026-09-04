import { useState, useEffect, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AdminAuthContext, type AdminUser } from './adminAuthContextDef'

const DEMO_ADMIN: AdminUser = {
  id: 'admin-demo-uuid-001',
  email: 'admin.colombo@resolvelk.gov.lk',
  role: 'admin',
  fullName: 'Municipal Engineer Jayashan (Admin)',
}

const DEMO_TOKEN = 'demo-admin-token'
const STORAGE_KEY = 'resolve_lk_admin_session'

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function checkExistingSession() {
      // 1. Check local storage for demo session
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.isDemo) {
            setUser(DEMO_ADMIN)
            setToken(DEMO_TOKEN)
            setIsDemoMode(true)
            setIsLoading(false)
            return
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY)
        }
      }

      // 2. Check Supabase session if configured
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            // Check role in profiles
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, full_name')
              .eq('id', session.user.id)
              .single()

            if (profile?.role === 'admin') {
              setUser({
                id: session.user.id,
                email: session.user.email ?? '',
                role: 'admin',
                fullName: profile.full_name ?? 'Municipal Admin',
              })
              setToken(session.access_token)
              setIsDemoMode(false)
              setIsLoading(false)
              return
            }
          }
        } catch {
          // Supabase offline / network error
        }
      }

      setIsLoading(false)
    }

    checkExistingSession()
  }, [])

  async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    setIsLoading(true)

    // Check for demo credential shortcut
    if (
      email.trim().toLowerCase() === 'admin@resolvelk.gov.lk' ||
      email.trim().toLowerCase() === 'admin'
    ) {
      setUser(DEMO_ADMIN)
      setToken(DEMO_TOKEN)
      setIsDemoMode(true)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isDemo: true }))
      setIsLoading(false)
      return { success: true }
    }

    if (!isSupabaseConfigured) {
      setIsLoading(false)
      return {
        success: false,
        error:
          'Supabase is not configured yet. Please use "Quick Demo Admin" or configure VITE_SUPABASE_URL.',
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error || !data.session || !data.user) {
        setIsLoading(false)
        return { success: false, error: error?.message || 'Invalid email or password.' }
      }

      // Verify that this user's profile has role='admin'
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single()

      if (profileError || profile?.role !== 'admin') {
        await supabase.auth.signOut()
        setIsLoading(false)
        return {
          success: false,
          error: 'Access denied: this account does not have municipal admin privileges.',
        }
      }

      setUser({
        id: data.user.id,
        email: data.user.email ?? email,
        role: 'admin',
        fullName: profile.full_name ?? 'Municipal Admin',
      })
      setToken(data.session.access_token)
      setIsDemoMode(false)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isDemo: false }))
      setIsLoading(false)
      return { success: true }
    } catch (err: unknown) {
      setIsLoading(false)
      const msg = err instanceof Error ? err.message : 'Failed to authenticate with Supabase.'
      return { success: false, error: msg }
    }
  }

  function signInAsDemo() {
    setUser(DEMO_ADMIN)
    setToken(DEMO_TOKEN)
    setIsDemoMode(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ isDemo: true }))
  }

  async function signOut() {
    setIsLoading(true)
    localStorage.removeItem(STORAGE_KEY)
    if (isSupabaseConfigured && !isDemoMode) {
      try {
        await supabase.auth.signOut()
      } catch {
        // Ignore network errors on sign out
      }
    }
    setUser(null)
    setToken(null)
    setIsDemoMode(false)
    setIsLoading(false)
  }

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isDemoMode,
        signIn,
        signInAsDemo,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

