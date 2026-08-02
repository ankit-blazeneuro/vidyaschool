import { redirect } from 'next/navigation'
import { auth } from './auth'
import { headers } from 'next/headers'
import { db } from './db'
import { user as userTable, session as sessionTable } from './schema'
import { eq } from 'drizzle-orm'

export type Role = 'student' | 'teacher' | 'admin' | 'account' | 'librarian'

export async function getCurrentUser() {
  const hdrs = await headers()
  let session = null
  try {
    session = await auth.api.getSession({
      headers: hdrs
    })
  } catch (err) {
    console.error('[getCurrentUser] getSession error:', err)
  }

  // Robust Direct DB Fallback: If better-auth getSession returned null, check DB for session token cookie
  if (!session?.user) {
    const rawCookie = hdrs.get('cookie')
    const cookieMatch = rawCookie?.match(/(?:__Secure-better-auth\.session_token|better-auth\.session_token)=([^;]+)/)
    const tokenVal = cookieMatch ? cookieMatch[1] : null

    if (tokenVal) {
      const cleanToken = decodeURIComponent(tokenVal).split('.')[0]
      try {
        const dbSession = await db
          .select()
          .from(sessionTable)
          .where(eq(sessionTable.token, cleanToken))
          .then(res => res[0])

        if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
          const dbUser = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, dbSession.userId))
            .then(res => res[0])

          if (dbUser) {
            return dbUser
          }
        }
      } catch (e) {
        console.error('[getCurrentUser] DB fallback session check error:', e)
      }
    }
  }

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
  const rolesWithLibrarian = roles.includes('teacher') && !roles.includes('librarian')
    ? [...roles, 'librarian' as Role]
    : roles
  
  if (!rolesWithLibrarian.includes(user.role as Role)) {
    redirect('/unauthorized')
  }
  
  return user
}

export function checkRole(userRole: string, allowedRoles: Role | Role[]): boolean {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  const rolesWithLibrarian = roles.includes('teacher') && !roles.includes('librarian')
    ? [...roles, 'librarian' as Role]
    : roles
  return rolesWithLibrarian.includes(userRole as Role)
}
