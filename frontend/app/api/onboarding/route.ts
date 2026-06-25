import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()

    // Check if username is unique
    if (data.username) {
      const existing = await db.query.userProfile.findFirst({
        where: eq(userProfile.username, data.username)
      })

      if (existing && existing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }
    }

    // Check if admission number is unique
    if (data.admissionNumber) {
      const existing = await db.query.userProfile.findFirst({
        where: eq(userProfile.admissionNumber, data.admissionNumber)
      })

      if (existing && existing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Admission number already exists' }, { status: 400 })
      }
    }

    // Create or update profile
    const existingProfile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, session.user.id)
    })

    if (existingProfile) {
      await db.update(userProfile)
        .set({
          admissionNumber: data.admissionNumber,
          username: data.username,
          phoneNumber: data.phoneNumber,
          parentName: data.parentName,
          parentPhone: data.parentPhone,
          parentEmail: data.parentEmail,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          class: data.class,
          section: data.section,
          classSectionLastUpdated: new Date(),
          onboardingCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(userProfile.userId, session.user.id))
    } else {
      await db.insert(userProfile).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        admissionNumber: data.admissionNumber,
        username: data.username,
        phoneNumber: data.phoneNumber,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        class: data.class,
        section: data.section,
        classSectionLastUpdated: new Date(),
        onboardingCompleted: true,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
