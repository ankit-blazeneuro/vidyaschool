/**
 * QR Login Callback — POST /api/auth/qr-callback
 *
 * Exchanging the QR authentication session for a valid Drizzle/Better-Auth
 * database session & HttpOnly session cookie on the web browser.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user as userTable, session as sessionTable } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const { session_token, user } = await req.json()

    if (!session_token || typeof session_token !== "string") {
      return NextResponse.json({ error: "Missing session_token" }, { status: 400 })
    }

    const email = user?.email ? String(user.email).trim().toLowerCase() : null
    const name = user?.name ? String(user.name) : (email ? email.split("@")[0] : "User")
    const role = (user?.role ? String(user.role) : "student") as "student" | "teacher" | "admin" | "account" | "librarian"
    const image = user?.image ? String(user.image) : null

    let userId: string

    if (email) {
      // Find existing user in PostgreSQL database
      const existingUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, email))
        .then((res) => res[0])

      if (existingUser) {
        userId = existingUser.id
      } else {
        // Create user record in PostgreSQL database if not present
        userId = user?.id ? String(user.id) : crypto.randomUUID()
        await db.insert(userTable).values({
          id: userId,
          email,
          name,
          role,
          image,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    } else {
      userId = user?.id ? String(user.id) : crypto.randomUUID()
    }

    // Insert session into Drizzle PostgreSQL session table so Better Auth & middleware recognize it
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "Unknown IP"
    const userAgent = req.headers.get("user-agent") || "QR Login via VidyaSchool App"

    // Check if session token already exists in DB
    const existingSession = await db
      .select()
      .from(sessionTable)
      .where(eq(sessionTable.token, session_token))
      .then((res) => res[0])

    if (!existingSession) {
      await db.insert(sessionTable).values({
        id: crypto.randomUUID(),
        token: session_token,
        userId: userId,
        expiresAt: expiresAt,
        ipAddress: clientIp,
        userAgent: userAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Prepare response with HttpOnly session cookies
    const response = NextResponse.json({
      ok: true,
      user: { id: userId, email, name, role },
      message: "QR session successfully established",
    })

    const isProd = process.env.NODE_ENV === "production"
    
    // Set both cookie variants for maximum compatibility across SSL / proxy setups
    response.cookies.set("better-auth.session_token", session_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    if (isProd) {
      response.cookies.set("__Secure-better-auth.session_token", session_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return response
  } catch (err: any) {
    console.error("[qr-callback] Error establishing session:", err)
    return NextResponse.json({ error: "Failed to establish QR session", details: err?.message }, { status: 500 })
  }
}
