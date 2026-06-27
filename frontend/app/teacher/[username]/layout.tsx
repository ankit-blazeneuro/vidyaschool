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

  // Get current user's profile
  const currentProfile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, user.id)
  })

  // If the current user has no completed profile, send them to onboarding
  if (!currentProfile?.onboardingCompleted || !currentProfile.username) {
    redirect('/teacher?onboarding=true')
  }

  // Check if the requested username exists in the DB
  const requestedProfile = await db.query.userProfile.findFirst({
    where: eq(userProfile.username, username)
  })

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
