import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'

// Public routes - accessible without authentication
const publicRoutes = ['/', '/login', '/signup', '/unauthorized']

// FIREWALL: Protected routes with required roles
const protectedRoutes = {
  '/student': ['student', 'admin'],
  '/teacher': ['teacher', 'admin'],
  '/admin': ['admin'],
  '/account': ['account', 'admin'],
}

// Routes that bypass role check (but still require auth)
const authOnlyRoutes = ['/student/onboarding']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public routes and API auth routes
  if (publicRoutes.some(route => pathname === route) || pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Allow auth-only routes (like onboarding)
  if (authOnlyRoutes.some(route => pathname.startsWith(route))) {
    const session = await auth.api.getSession({
      headers: request.headers
    })
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // FIREWALL CHECK: Is this a protected route?
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  )

  // Get session
  const session = await auth.api.getSession({
    headers: request.headers
  })

  // FIREWALL RULE 1: Block ALL unauthenticated users from /student and /teacher
  if (isProtectedRoute && !session?.user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // FIREWALL RULE 2: Check role permissions for authenticated users
  if (session?.user) {
    for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(session.user.role as string)) {
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
}
