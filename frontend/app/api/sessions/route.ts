import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { session as sessionTable } from '@/lib/schema'
import { eq, ne, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET() {
  const currentSession = await auth.api.getSession({ headers: await headers() })
  
  if (!currentSession?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activeSessions = await db
    .select()
    .from(sessionTable)
    .where(eq(sessionTable.userId, currentSession.user.id))

  return NextResponse.json({
    currentSessionId: currentSession.session.id,
    sessions: activeSessions,
  })
}

export async function DELETE(req: NextRequest) {
  const currentSession = await auth.api.getSession({ headers: await headers() })
  
  if (!currentSession?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const targetSessionId = searchParams.get('id')

  if (targetSessionId === 'other') {
    // Revoke all other sessions (logout from other devices)
    await db
      .delete(sessionTable)
      .where(
        and(
          eq(sessionTable.userId, currentSession.user.id),
          ne(sessionTable.id, currentSession.session.id)
        )
      )
    return NextResponse.json({ success: true, message: 'Logged out of all other devices' })
  }

  if (!targetSessionId) {
    return NextResponse.json({ error: 'Missing session ID' }, { status: 400 })
  }

  // Revoke specific session
  await db
    .delete(sessionTable)
    .where(
      and(
        eq(sessionTable.id, targetSessionId),
        eq(sessionTable.userId, currentSession.user.id)
      )
    )

  return NextResponse.json({ success: true, message: 'Session revoked' })
}
