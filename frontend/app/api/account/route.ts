import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '')

export async function GET(req: NextRequest) {
  const hdrs = await headers()
  const cookieHeader = hdrs.get('cookie') || ''
  const authHeader = hdrs.get('authorization') || ''

  try {
    const res = await fetch(`${BACKEND_URL}/api/account`, {
      headers: {
        'cookie': cookieHeader,
        ...(authHeader && { 'authorization': authHeader }),
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      const errText = await res.text()
      let detail = errText
      try {
        const parsed = JSON.parse(errText)
        detail = parsed.detail || errText
      } catch {}
      return NextResponse.json({ error: detail || 'Failed to fetch account' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[api/account] FastAPI proxy error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
