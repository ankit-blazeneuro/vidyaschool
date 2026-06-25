import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, session.user.id)
  })

  return NextResponse.json({ user: session.user, profile })
}
