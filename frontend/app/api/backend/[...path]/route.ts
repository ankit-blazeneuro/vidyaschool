import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '')

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const searchParams = req.nextUrl.searchParams.toString()
  const url = `${BACKEND_URL}/${pathStr}${searchParams ? `?${searchParams}` : ''}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const authHeader = req.headers.get('authorization') || ''
    const res = await fetch(url, {
      headers: {
        'cookie': cookieHeader,
        ...(authHeader && { 'authorization': authHeader }),
      },
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      let parsedError = errorText
      try {
        const jsonError = JSON.parse(errorText)
        parsedError = jsonError.detail || errorText
      } catch {}
      return NextResponse.json({ detail: parsedError }, { status: res.status })
    }
    
    if (res.headers.get('content-type')?.includes('text/event-stream')) {
      return new NextResponse(res.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const url = `${BACKEND_URL}/${pathStr}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const authHeader = req.headers.get('authorization') || ''
    const body = await req.json()
    console.log(`PROXY [POST] Request to ${url} with body:`, JSON.stringify(body))
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'cookie': cookieHeader,
        'Content-Type': 'application/json',
        ...(authHeader && { 'authorization': authHeader }),
      },
      body: JSON.stringify(body),
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error(`PROXY [POST] Error response from ${url} (status: ${res.status}):`, errorText)
      let parsedError = errorText
      try {
        const jsonError = JSON.parse(errorText)
        parsedError = jsonError.detail || errorText
      } catch {}
      return NextResponse.json({ detail: parsedError }, { status: res.status })
    }

    if (res.headers.get('content-type')?.includes('text/event-stream')) {
      return new NextResponse(res.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const url = `${BACKEND_URL}/${pathStr}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const authHeader = req.headers.get('authorization') || ''
    const body = await req.json()
    
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'cookie': cookieHeader,
        'Content-Type': 'application/json',
        ...(authHeader && { 'authorization': authHeader }),
      },
      body: JSON.stringify(body),
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      let parsedError = errorText
      try {
        const jsonError = JSON.parse(errorText)
        parsedError = jsonError.detail || errorText
      } catch {}
      return NextResponse.json({ detail: parsedError }, { status: res.status })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const url = `${BACKEND_URL}/${pathStr}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const authHeader = req.headers.get('authorization') || ''
    const body = await req.json()
    
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'cookie': cookieHeader,
        'Content-Type': 'application/json',
        ...(authHeader && { 'authorization': authHeader }),
      },
      body: JSON.stringify(body),
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      let parsedError = errorText
      try {
        const jsonError = JSON.parse(errorText)
        parsedError = jsonError.detail || errorText
      } catch {}
      return NextResponse.json({ detail: parsedError }, { status: res.status })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const url = `${BACKEND_URL}/${pathStr}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const authHeader = req.headers.get('authorization') || ''
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'cookie': cookieHeader,
        ...(authHeader && { 'authorization': authHeader }),
      },
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      let parsedError = errorText
      try {
        const jsonError = JSON.parse(errorText)
        parsedError = jsonError.detail || errorText
      } catch {}
      return NextResponse.json({ detail: parsedError }, { status: res.status })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 })
  }
}
