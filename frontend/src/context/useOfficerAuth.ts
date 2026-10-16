import { useContext } from 'react'
import { OfficerAuthContext } from './officerAuthContextDef'

export function useOfficerAuth() {
  const context = useContext(OfficerAuthContext)
  if (!context) {
    throw new Error('useOfficerAuth must be used within an OfficerAuthProvider')
  }
  return context
}
