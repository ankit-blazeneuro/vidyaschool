import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '')

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || !['teacher', 'librarian', 'admin'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  // Get the session token from cookie to pass to Python backend
  const cookieHeader = req.headers.get('cookie') || ''

  const res = await fetch(`${BACKEND_URL}/api/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'cookie': cookieHeader,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
