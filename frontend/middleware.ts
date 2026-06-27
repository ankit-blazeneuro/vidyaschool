import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'

// Public routes - accessible without authentication
const publicRoutes = ['/', '/login', '/signup', '/unauthorized']

// FIREWALL: Protected routes with required roles
const protectedRoutes = {
  '/community': ['admin', 'teacher'],
  '/student': ['student', 'admin'],
  '/teacher': ['teacher', 'admin'],
  '/admin': ['admin'],
  '/accounts': ['admin', 'account'],
  '/login-accounts': ['student', 'teacher', 'admin', 'account'],
}

// Routes that bypass role check (but still require auth)
const authOnlyRoutes = ['/student/onboarding', '/auth/waiting-room']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public routes and API auth routes
  if (publicRoutes.some(route => pathname === route) || pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Allow auth-only routes (like onboarding and waiting room) - check auth first
  if (authOnlyRoutes.some(route => pathname.startsWith(route))) {
    const session = await auth.api.getSession({
      headers: request.headers
    })
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Allow access to waiting room regardless of role
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
    const user = session.user as any
    
    // Special handling for teacher approval flow
    if (user.preferredRole === 'teacher' && user.teacherApprovalStatus === 'pending') {
      if (!pathname.startsWith('/auth/waiting-room') && !pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL('/auth/waiting-room', request.url))
      }
      if (pathname.startsWith('/auth/waiting-room')) {
        return NextResponse.next()
      }
    }
    
    const sortedRoutes = Object.entries(protectedRoutes).sort((a, b) => b[0].length - a[0].length)
    for (const [route, allowedRoles] of sortedRoutes) {
      if (pathname.startsWith(route)) {
        if (allowedRoles.includes(user.role as string)) {
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
}
