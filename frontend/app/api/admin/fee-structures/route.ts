import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { getAuthenticatedSession } from "@/lib/auth-helpers"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'account')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cookieHeader = (await headers()).get("cookie") || ""

  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/fee-structures`, {
      headers: {
        cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("[fee-structures GET] Backend error:", errorText)
      return NextResponse.json({ error: "Failed to fetch fee structures" }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[fee-structures GET] Proxy error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
