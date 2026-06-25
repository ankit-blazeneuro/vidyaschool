import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const searchParams = req.nextUrl.searchParams.toString()
  const url = `http://localhost:8000/${pathStr}${searchParams ? `?${searchParams}` : ''}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const res = await fetch(url, {
      headers: {
        'cookie': cookieHeader,
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const url = `http://localhost:8000/${pathStr}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const body = await req.json()
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'cookie': cookieHeader,
        'Content-Type': 'application/json',
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const url = `http://localhost:8000/${pathStr}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const body = await req.json()
    
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'cookie': cookieHeader,
        'Content-Type': 'application/json',
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
  const url = `http://localhost:8000/${pathStr}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const body = await req.json()
    
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'cookie': cookieHeader,
        'Content-Type': 'application/json',
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
  const url = `http://localhost:8000/${pathStr}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'cookie': cookieHeader,
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
