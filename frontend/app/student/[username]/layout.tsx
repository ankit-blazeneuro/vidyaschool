import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import * as React from 'react'

export default async function UsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await requireRole(['student', 'admin'])

  // Get current user's profile
  const currentProfile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, user.id)
  })

  // If the current user has no completed profile, send them to onboarding
  if (!currentProfile?.onboardingCompleted || !currentProfile.username) {
    redirect('/student/onboarding')
  }

  // Check if the requested username exists in the DB
  const requestedProfile = await db.query.userProfile.findFirst({
    where: eq(userProfile.username, username)
  })

  // If the requested username doesn't exist, redirect everyone to their own profile
  if (!requestedProfile) {
    redirect(`/student/${currentProfile.username}`)
  }

  // Students can only view their own profile; admins can view any
  if (user.role === 'student' && currentProfile.username !== username) {
    redirect(`/student/${currentProfile.username}`)
  }

  return <>{children}</>
}
