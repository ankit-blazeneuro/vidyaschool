import { redirect } from 'next/navigation'
import { auth } from './auth'
import { headers } from 'next/headers'

export type Role = 'student' | 'teacher' | 'admin' | 'account'

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  
  return session?.user || null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

export async function requireRole(allowedRoles: Role | Role[]) {
  const user = await requireAuth()
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  
  if (!roles.includes(user.role as Role)) {
    redirect('/unauthorized')
  }
  
  return user
}

export function checkRole(userRole: string, allowedRoles: Role | Role[]): boolean {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  return roles.includes(userRole as Role)
}
