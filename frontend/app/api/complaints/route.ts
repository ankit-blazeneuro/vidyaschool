import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { complaint, user } from '@/lib/schema'
import { eq, like } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') // 'teacher' or 'admin'
  
  try {
    let query = db.select({
      id: complaint.id,
      userId: complaint.userId,
      title: complaint.title,
      recipient: complaint.recipient,
      taggedPeople: complaint.taggedPeople,
      message: complaint.message,
      fileUrl: complaint.fileUrl,
      fileName: complaint.fileName,
      status: complaint.status,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      senderName: user.name,
      senderEmail: user.email,
      senderRole: user.role,
    })
    .from(complaint)
    .leftJoin(user, eq(complaint.userId, user.id))

    let results
    if (role === 'teacher') {
      results = await query.where(eq(complaint.recipient, 'Teacher'))
    } else if (role === 'admin') {
      results = await query.where(like(complaint.recipient, '%Admin%'))
    } else {
      results = await query
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Error fetching complaints:', error)
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const title = formData.get('title') as string
    const recipient = formData.get('recipient') as string
    const taggedPeople = formData.get('taggedPeople') as string
    const message = formData.get('message') as string
    const file = formData.get('file') as File | null

    if (!title || !recipient || !message) {
      return NextResponse.json({ error: 'Title, recipient, and message are required' }, { status: 400 })
    }

    let fileUrl: string | null = null
    let fileName: string | null = null

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Ensure directory exists
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadDir, { recursive: true })

      // Generate a unique filename to prevent collisions
      const uniqueFilename = `${crypto.randomUUID()}-${file.name}`
      const filePath = path.join(uploadDir, uniqueFilename)
      await writeFile(filePath, buffer)

      fileUrl = `/uploads/${uniqueFilename}`
      fileName = file.name
    }

    const complaintId = `comp-${crypto.randomUUID()}`
    await db.insert(complaint).values({
      id: complaintId,
      userId: session.user.id,
      title,
      recipient,
      taggedPeople: taggedPeople || null,
      message,
      fileUrl,
      fileName,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id: complaintId })
  } catch (error: any) {
    console.error('Error creating complaint:', error)
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
    }

    await db.update(complaint)
      .set({ status, updatedAt: new Date() })
      .where(eq(complaint.id, id))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating complaint:', error)
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 })
  }
}
