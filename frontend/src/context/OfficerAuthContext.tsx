import { useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { OfficerAuthContext, type OfficerUser, type OfficerRole } from './officerAuthContextDef'

const OFFICER_ROLES: OfficerRole[] = ['municipal_officer', 'provincial_officer', 'system_admin']

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

async function loadOfficerProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, full_name, council_id, province_id')
    .eq('id', userId)
    .single()

  if (error || !data || !OFFICER_ROLES.includes(data.role)) return null
  return data as { role: OfficerRole; full_name: string | null; council_id: string | null; province_id: string | null }
}

export function OfficerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<OfficerUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const profile = await loadOfficerProfile(session.user.id)
          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email ?? '',
              role: profile.role,
              fullName: profile.full_name ?? undefined,
              councilId: profile.council_id,
              provinceId: profile.province_id,
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

      const profile = await loadOfficerProfile(data.user.id)
      if (!profile) {
        await supabase.auth.signOut()
        setIsLoading(false)
        return {
          success: false,
          error: 'Access denied: this account does not have Municipal Officer, Provincial Officer, or System Administrator privileges.',
        }
      }

      setUser({
        id: data.user.id,
        email: data.user.email ?? email,
        role: profile.role,
        fullName: profile.full_name ?? undefined,
        councilId: profile.council_id,
        provinceId: profile.province_id,
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
    <OfficerAuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </OfficerAuthContext.Provider>
  )
}
