import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { subjectClassAssignment, userProfile, user } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, session.user.id),
  })

  if (!profile?.class || !profile?.section) {
    return NextResponse.json({ class: null, section: null, subjects: [], classTeacher: null })
  }

  const assignments = await db
    .select({
      subject: subjectClassAssignment.subject,
      teacherId: subjectClassAssignment.teacherId,
      teacherName: user.name,
    })
    .from(subjectClassAssignment)
    .innerJoin(user, eq(subjectClassAssignment.teacherId, user.id))
    .where(
      and(
        eq(subjectClassAssignment.class, profile.class),
        eq(subjectClassAssignment.section, profile.section)
      )
    )
    .orderBy(subjectClassAssignment.subject)

  // Class teacher = teacher with most subject assignments for this class
  const teacherCount: Record<string, { name: string; count: number }> = {}
  for (const a of assignments) {
    if (!teacherCount[a.teacherId]) teacherCount[a.teacherId] = { name: a.teacherName, count: 0 }
    teacherCount[a.teacherId].count++
  }
  const classTeacher = Object.values(teacherCount).sort((a, b) => b.count - a.count)[0] ?? null

  return NextResponse.json({
    class: profile.class,
    section: profile.section,
    subjects: assignments.map(a => ({ subject: a.subject, teacherName: a.teacherName })),
    classTeacher: classTeacher?.name ?? null,
  })
}
