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
  const { username, address, parentName, phoneNumber, city, state, pincode, parentPhone, parentEmail, secondaryRole } = data

  try {
    const existingProfile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, session.user.id)
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if username is unique
    if (username) {
      const existing = await db.query.userProfile.findFirst({
        where: eq(userProfile.username, username)
      })

      if (existing && existing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }
    }

    const isClassChanged = data.class !== undefined && data.class !== existingProfile.class;
    const isSectionChanged = data.section !== undefined && data.section !== existingProfile.section;

    let classSectionLastUpdated = existingProfile.classSectionLastUpdated;
    let classSectionChanges = existingProfile.classSectionChanges;

    if (isClassChanged || isSectionChanged) {
      const now = new Date();
      if (session.user.role === 'teacher') {
        let changes: string[] = [];
        try {
          if (existingProfile.classSectionChanges) {
            changes = JSON.parse(existingProfile.classSectionChanges);
          }
        } catch (e) {
          changes = [];
        }

        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        const activeChanges = changes
          .map(d => new Date(d))
          .filter(d => d >= oneYearAgo);

        if (activeChanges.length >= 2) {
          activeChanges.sort((a, b) => a.getTime() - b.getTime());
          const oldestChange = activeChanges[0];
          const nextAllowedDate = new Date(oldestChange.getTime() + 365 * 24 * 60 * 60 * 1000);
          return NextResponse.json({
            error: `Teachers cannot change class and section more than 2 times a year. Next change allowed after ${nextAllowedDate.toLocaleDateString()}`
          }, { status: 400 });
        }

        changes.push(now.toISOString());
        classSectionChanges = JSON.stringify(changes);
      } else {
        if (existingProfile.classSectionLastUpdated) {
          const lastUpdated = new Date(existingProfile.classSectionLastUpdated);
          const differenceInTime = now.getTime() - lastUpdated.getTime();
          const differenceInDays = differenceInTime / (1000 * 3600 * 24);

          if (differenceInDays < 365) {
            const nextAllowedDate = new Date(lastUpdated.getTime() + 365 * 24 * 60 * 60 * 1000);
            return NextResponse.json({
              error: `You can only change your class and section once a year. Next change allowed after ${nextAllowedDate.toLocaleDateString()}`
            }, { status: 400 });
          }
        }
        classSectionLastUpdated = now;
      }
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
        secondaryRole: secondaryRole !== undefined ? secondaryRole : existingProfile.secondaryRole,
        class: data.class !== undefined ? data.class : existingProfile.class,
        section: data.section !== undefined ? data.section : existingProfile.section,
        classSectionLastUpdated,
        classSectionChanges,
        updatedAt: new Date(),
      })
      .where(eq(userProfile.userId, session.user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
