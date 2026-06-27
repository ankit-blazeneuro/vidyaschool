import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import * as React from 'react'

export default async function TeacherUsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<any>
}) {
  const { username } = (await params) as { username: string }
  const user = await requireRole(['teacher', 'admin'])

  // Fetch profiles concurrently to optimize latency
  const [currentProfile, requestedProfile] = await Promise.all([
    db.query.userProfile.findFirst({
      where: eq(userProfile.userId, user.id)
    }),
    db.query.userProfile.findFirst({
      where: eq(userProfile.username, username)
    })
  ])

  // If the current user has no completed profile, send them to onboarding
  if (!currentProfile?.onboardingCompleted || !currentProfile.username) {
    redirect('/teacher?onboarding=true')
  }

  // If the requested username doesn't exist, redirect everyone to their own profile
  if (!requestedProfile) {
    redirect(`/teacher/${currentProfile.username}`)
  }

  // Teachers can only view their own profile/dashboard; admins can view any
  if (user.role === 'teacher' && currentProfile.username !== username) {
    redirect(`/teacher/${currentProfile.username}`)
  }

  return <>{children}</>
}
