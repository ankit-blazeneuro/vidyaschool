import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export default async function StudentRootPage() {
  const user = await requireRole(['student', 'admin'])
  
  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, user.id)
  })

  if (!profile?.onboardingCompleted || !profile.username) {
    redirect('/student/onboarding')
  }

  redirect(`/student/${profile.username}`)
}
