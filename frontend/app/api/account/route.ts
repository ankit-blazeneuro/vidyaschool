import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user as userTable, session as sessionTable, userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET() {
  const hdrs = await headers()
  let session = null

  try {
    session = await auth.api.getSession({ headers: hdrs })
  } catch (e) {
    console.error("[api/account] getSession error:", e)
  }

  // Fallback to checking DB directly if auth.api.getSession is null
  if (!session?.user) {
    const rawCookie = hdrs.get('cookie')
    const cookieMatch = rawCookie?.match(/(?:__Secure-better-auth\.session_token|better-auth\.session_token)=([^;]+)/)
    const tokenVal = cookieMatch ? cookieMatch[1] : null

    if (tokenVal) {
      const cleanToken = decodeURIComponent(tokenVal).split('.')[0]
      try {
        const dbSession = await db.select().from(sessionTable).where(eq(sessionTable.token, cleanToken)).then(res => res[0])
        if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
          const dbUser = await db.select().from(userTable).where(eq(userTable.id, dbSession.userId)).then(res => res[0])
          if (dbUser) {
            session = { user: dbUser, session: dbSession }
          }
        }
      } catch (err) {
        console.error("[api/account] DB session fallback error:", err)
      }
    }
  }

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, session.user.id)
  })

  return NextResponse.json({ user: session.user, profile })
}
