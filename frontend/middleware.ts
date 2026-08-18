import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'
import { db } from './lib/db'
import { user as userTable, session as sessionTable, userProfile } from './lib/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit } from './lib/rate-limit'

// Public routes - accessible without authentication
const publicRoutes = ['/', '/login', '/signup', '/unauthorized', '/downloads']

// Role → destination mapping for /dashboard and /[role] redirect
const roleDashboardMap: Record<string, string> = {
  teacher: '/teacher',
  librarian: '/librarian',
  admin: '/admin',
  account: '/accounts',
  student: '/student',
}

// FIREWALL: Protected routes with required roles
const protectedRoutes = {
  '/community': ['admin', 'teacher', 'librarian'],
  '/student': ['student'],
  '/teacher': ['teacher', 'admin', 'librarian'],
  '/librarian': ['librarian', 'admin'],
  '/admin': ['admin'],
  '/accounts': ['admin', 'account'],
  '/login-accounts': ['student', 'teacher', 'admin', 'account', 'librarian'],
}

async function resolveUserDestination(user: any) {
  try {
    const profile = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, user.id))
      .then(res => res[0])

    if (profile?.username) {
      const rolePrefix = roleDashboardMap[user.role as string] ?? '/student'
      return `${rolePrefix}/${profile.username}`
    }
  } catch (e) {
    console.error('[middleware] userProfile query error:', e)
  }
  return '/login'
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // RATE LIMITING FOR ALL NEXT.JS API ENDPOINTS (/api/*)
  if (pathname.startsWith('/api')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      '127.0.0.1'

    const isSensitive =
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/profile') ||
      pathname.startsWith('/api/admin')

    const limit = isSensitive ? 60 : 180
    const key = `next_api:${ip}:${isSensitive ? 'strict' : 'general'}`

    const { allowed, remaining, reset } = checkRateLimit(key, limit, 60000)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(reset),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      )
    }
  }

  // Allow static assets, API auth, docs, well-known, and search endpoints after rate-limit check
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/docs') ||
    pathname.startsWith('/api/search')
  ) {
    return NextResponse.next()
  }

  // Get session (single call — reused for /login redirect, /dashboard redirect AND firewall checks)
  let session: any = null
  try {
    session = await auth.api.getSession({
      headers: request.headers
    })
  } catch (err) {
    console.error('[middleware] getSession error:', err)
  }

  // Robust Fallback: If better-auth getSession returned null, but a session token cookie exists
  if (!session?.user) {
    const rawCookie = request.cookies.get('better-auth.session_token')?.value || 
                      request.cookies.get('__Secure-better-auth.session_token')?.value
    if (rawCookie) {
      const cleanToken = rawCookie.split('.')[0]
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
            session = {
              user: dbUser,
              session: dbSession
            }
          }
        }
      } catch (e) {
        console.error('[middleware] DB fallback session check error:', e)
      }
    }
  }

  // REDIRECT LOGGED-IN USERS AWAY FROM /login AND /signup DIRECTLY TO /[role]/[username]
  if ((pathname === '/login' || pathname === '/signup') && session?.user) {
    const user = session.user as any
    const destination = await resolveUserDestination(user)
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // Allow unauthenticated public routes ('/', '/login', '/signup', '/unauthorized', '/downloads')
  if (publicRoutes.some(route => pathname === route)) {
    return NextResponse.next()
  }

  // FAST /dashboard redirect — handled at edge with session & profile
  if (pathname === '/dashboard') {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const user = session.user as any
    const destination = await resolveUserDestination(user)
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // FIREWALL CHECK: Is this a protected route?
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  )

  // FIREWALL RULE 1: Block ALL unauthenticated users from protected routes
  if (isProtectedRoute && !session?.user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // FIREWALL RULE 2: Check role permissions and handle immediate /[role] -> /[role]/[username] redirect
  if (session?.user) {
    const user = session.user as any
    
    // Special handling for teacher/librarian approval flow
    if ((user.preferredRole === 'teacher' || user.preferredRole === 'librarian') && user.teacherApprovalStatus === 'pending') {
      if (!pathname.startsWith('/auth/waiting-room') && !pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL('/auth/waiting-room', request.url))
      }
      if (pathname.startsWith('/auth/waiting-room')) {
        return NextResponse.next()
      }
    }
    
    const roleBasePaths = Object.values(roleDashboardMap)
    const sortedRoutes = Object.entries(protectedRoutes).sort((a, b) => b[0].length - a[0].length)
    for (const [route, allowedRoles] of sortedRoutes) {
      if (pathname.startsWith(route)) {
        if (allowedRoles.includes(user.role as string)) {
          // FAST ROUTE HANDLING: If user hits root /[role] (e.g. /student, /teacher, /admin, /accounts, /librarian),
          // immediately redirect to /[role]/[username]
          if (roleBasePaths.includes(pathname)) {
            const destination = await resolveUserDestination(user)
            return NextResponse.redirect(new URL(destination, request.url))
          }
          return NextResponse.next()
        } else {
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!monitoring|_next/static|_next/image|favicon.ico|assets).*)'],
}
