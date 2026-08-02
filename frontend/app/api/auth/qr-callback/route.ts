/**
 * QR Login Callback  — POST /api/auth/qr-callback
 *
 * After the mobile app confirms a QR scan, the backend emits "qr_auth_confirmed"
 * via Socket.IO. The frontend receives the payload and calls this route to
 * exchange the backend session token for a proper browser cookie.
 *
 * The backend session token is accepted as-is; middleware validates it on
 * subsequent requests via the Authorization: Bearer header stored in the cookie.
 */

import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"   // fast, runs at the CDN edge

export async function POST(req: NextRequest) {
  try {
    const { session_token, user } = await req.json()

    if (!session_token || typeof session_token !== "string") {
      return NextResponse.json({ error: "Missing session_token" }, { status: 400 })
    }

    // Build the redirect response and set the session cookie
    // Use the same cookie name the backend / middleware expect
    const response = NextResponse.json({
      ok: true,
      user,
      message: "QR session established",
    })

    // Cookie settings — mirror what the mobile app + backend use
    const isProd = process.env.NODE_ENV === "production"
    const cookieName = isProd
      ? "__Secure-better-auth.session_token"
      : "better-auth.session_token"

    response.cookies.set(cookieName, session_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days — matches backend session TTL
    })

    return response
  } catch (err) {
    console.error("[qr-callback] error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
