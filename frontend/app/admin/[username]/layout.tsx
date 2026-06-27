import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import * as React from 'react'

export default async function AdminUsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<any>
}) {
  const { username } = (await params) as { username: string }
  const user = await requireRole(['admin'])

  // Get current user's profile
  const currentProfile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, user.id)
  })

  // If no username is set, send to onboarding
  if (!currentProfile?.onboardingCompleted || !currentProfile.username) {
    redirect('/admin?select=username')
  }

  // If requested username does not match, redirect to their own
  if (currentProfile.username !== username) {
    redirect(`/admin/${currentProfile.username}`)
  }

  return <>{children}</>
}
