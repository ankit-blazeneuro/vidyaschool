import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()

    // Check username uniqueness if it changed
    if (data.username) {
      const trimmed = data.username.trim().toLowerCase()
      const existing = await db.query.userProfile.findFirst({
        where: eq(userProfile.username, trimmed)
      })
      if (existing && existing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }
      data.username = trimmed
    }

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

    await db.update(userProfile)
      .set({
        username:    data.username    ?? existingProfile.username,
        phoneNumber: data.phoneNumber ?? existingProfile.phoneNumber,
        parentName:  data.parentName  ?? existingProfile.parentName,
        parentPhone: data.parentPhone ?? existingProfile.parentPhone,
        parentEmail: data.parentEmail ?? existingProfile.parentEmail,
        address:     data.address     ?? existingProfile.address,
        city:        data.city        ?? existingProfile.city,
        state:       data.state       ?? existingProfile.state,
        pincode:     data.pincode     ?? existingProfile.pincode,
        secondaryRole: data.secondaryRole !== undefined ? data.secondaryRole : existingProfile.secondaryRole,
        class:       data.class       !== undefined ? data.class       : existingProfile.class,
        section:     data.section     !== undefined ? data.section     : existingProfile.section,
        classSectionLastUpdated,
        updatedAt: new Date(),
      })
      .where(eq(userProfile.userId, session.user.id))

    return NextResponse.json({ success: true, newUsername: data.username ?? existingProfile.username })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
