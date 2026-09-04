import { createContext } from 'react'

export interface AdminUser {
  id: string
  email: string
  role: 'admin'
  fullName?: string
}

export interface AdminAuthContextType {
  user: AdminUser | null
  token: string | null
  isLoading: boolean
  isDemoMode: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signInAsDemo: () => void
  signOut: () => Promise<void>
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)
