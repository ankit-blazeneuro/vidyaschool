import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await req.json()
  const { username, address, parentName, phoneNumber, city, state, pincode, parentPhone, parentEmail } = data

  try {
    const existingProfile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, session.user.id)
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const isClassChanged = data.class !== undefined && data.class !== existingProfile.class;
    const isSectionChanged = data.section !== undefined && data.section !== existingProfile.section;

    let classSectionLastUpdated = existingProfile.classSectionLastUpdated;

    if (isClassChanged || isSectionChanged) {
      if (existingProfile.classSectionLastUpdated) {
        const lastUpdated = new Date(existingProfile.classSectionLastUpdated);
        const now = new Date();
        const differenceInTime = now.getTime() - lastUpdated.getTime();
        const differenceInDays = differenceInTime / (1000 * 3600 * 24);

        if (differenceInDays < 365) {
          const nextAllowedDate = new Date(lastUpdated.getTime() + 365 * 24 * 60 * 60 * 1000);
          return NextResponse.json({
            error: `You can only change your class and section once a year. Next change allowed after ${nextAllowedDate.toLocaleDateString()}`
          }, { status: 400 });
        }
      }
      classSectionLastUpdated = new Date();
    }

    await db
      .update(userProfile)
      .set({
        username,
        address,
        parentName,
        phoneNumber,
        city,
        state,
        pincode,
        parentPhone,
        parentEmail,
        class: data.class !== undefined ? data.class : existingProfile.class,
        section: data.section !== undefined ? data.section : existingProfile.section,
        classSectionLastUpdated,
        updatedAt: new Date(),
      })
      .where(eq(userProfile.userId, session.user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
