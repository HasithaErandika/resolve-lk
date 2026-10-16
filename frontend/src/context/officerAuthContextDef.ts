import { createContext } from 'react'

export type OfficerRole = 'municipal_officer' | 'provincial_officer' | 'system_admin'

export interface OfficerUser {
  id: string
  email: string
  role: OfficerRole
  fullName?: string
  councilId?: string | null
  provinceId?: string | null
}

export interface OfficerAuthContextType {
  user: OfficerUser | null
  token: string | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

export const OfficerAuthContext = createContext<OfficerAuthContextType | undefined>(undefined)
