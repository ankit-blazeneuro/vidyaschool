import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, session.user.id)
    })

    return NextResponse.json({ 
      username: profile?.username || null,
      onboardingCompleted: profile?.onboardingCompleted || false 
    })
  } catch (error) {
    return NextResponse.json({ username: null, onboardingCompleted: false })
  }
}
