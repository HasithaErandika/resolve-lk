import { useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { AdminAuthContext, type AdminUser } from './adminAuthContextDef'

function mapAuthError(error: { message?: string; status?: number } | null): string {
  const message = error?.message?.toLowerCase() ?? ''

  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please check your credentials and try again.'
  }
  if (message.includes('email not confirmed')) {
    return 'This account\'s email has not been confirmed yet. Please contact your system administrator.'
  }
  if (message.includes('rate limit')) {
    return 'Too many sign-in attempts. Please wait a moment and try again.'
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Could not reach the authentication server. Please check your connection and try again.'
  }
  return error?.message || 'Could not sign you in. Please try again.'
}

async function loadAdminProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', userId)
    .single()

  if (error || data?.role !== 'admin') return null
  return data
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const profile = await loadAdminProfile(session.user.id)
          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email ?? '',
              role: 'admin',
              fullName: profile.full_name ?? 'Municipal Admin',
            })
            setToken(session.access_token)
          }
        }
      } catch {
        // Supabase unreachable; leave user signed out
      }
      setIsLoading(false)
    }

    checkExistingSession()
  }, [])

  async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error || !data.session || !data.user) {
        setIsLoading(false)
        return { success: false, error: mapAuthError(error) }
      }

      const profile = await loadAdminProfile(data.user.id)
      if (!profile) {
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
      setIsLoading(false)
      return { success: true }
    } catch (err: unknown) {
      setIsLoading(false)
      const message = err instanceof Error ? err.message : 'Failed to authenticate with Supabase.'
      return { success: false, error: mapAuthError({ message }) }
    }
  }

  async function signOut() {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore network errors on sign out
    }
    setUser(null)
    setToken(null)
    setIsLoading(false)
  }

  return (
    <AdminAuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
