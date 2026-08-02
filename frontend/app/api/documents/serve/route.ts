import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { user as userTable, session as sessionTable, userDocument } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { generatePresignedDownloadUrl, isS3Configured } from "@/lib/s3"
import { readFile, stat } from "fs/promises"
import path from "path"

async function getAuthenticatedSession() {
  const hdrs = await headers()
  let session = null

  try {
    session = await auth.api.getSession({ headers: hdrs })
  } catch (e) {
    console.error("[api/documents/serve] getSession error:", e)
  }

  if (!session?.user) {
    const rawCookie = hdrs.get("cookie")
    const cookieMatch = rawCookie?.match(/(?:__Secure-better-auth\.session_token|better-auth\.session_token)=([^;]+)/)
    const tokenVal = cookieMatch ? cookieMatch[1] : null

    if (tokenVal) {
      const cleanToken = decodeURIComponent(tokenVal).split(".")[0]
      try {
        const dbSession = await db.select().from(sessionTable).where(eq(sessionTable.token, cleanToken)).then(res => res[0])
        if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
          const dbUser = await db.select().from(userTable).where(eq(userTable.id, dbSession.userId)).then(res => res[0])
          if (dbUser) {
            session = { user: dbUser, session: dbSession }
          }
        }
      } catch (err) {
        console.error("[api/documents/serve] DB session fallback error:", err)
      }
    }
  }

  return session
}

export async function GET(req: NextRequest) {
  // Step 1: Enforce Session Authentication
  const session = await getAuthenticatedSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const docId = searchParams.get("docId")

  if (!docId) {
    return NextResponse.json({ error: "docId is required" }, { status: 400 })
  }

  try {
    // Step 2: Query Document Record from DB
    const docs = await db
      .select()
      .from(userDocument)
      .where(eq(userDocument.id, docId))

    if (!docs || docs.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const doc = docs[0]

    // Step 3: Enforce Role-Based Authorization (RBAC)
    const isOwner = session.user.id === doc.userId
    const isAdmin = session.user.role === "admin"
    const isTeacher = session.user.role === "teacher"

    if (!isOwner && !isAdmin && !isTeacher) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to view this document" }, { status: 403 })
    }

    // Step 4: AWS S3 Storage Handling (Presigned Signed URLs for Private Buckets)
    let s3Key = doc.fileKey

    // Extract S3 key if file_key was not stored on legacy records
    if (!s3Key && doc.fileUrl && doc.fileUrl.includes("amazonaws.com/")) {
      s3Key = doc.fileUrl.split("amazonaws.com/")[1]
    } else if (!s3Key && doc.fileUrl && /^https?:\/\//i.test(doc.fileUrl)) {
      try {
        const parsedUrl = new URL(doc.fileUrl)
        s3Key = parsedUrl.pathname.replace(/^\/+/, "")
      } catch {
        s3Key = null
      }
    }

    if (s3Key && isS3Configured()) {
      const presignedViewUrl = await generatePresignedDownloadUrl(s3Key, 900) // 15 mins expiry
      if (presignedViewUrl) {
        return NextResponse.redirect(presignedViewUrl, 307)
      }
    }

    // Direct HTTP(S) URL Fallback if S3 presigned generation isn't available
    if (/^https?:\/\//i.test(doc.fileUrl)) {
      return NextResponse.redirect(doc.fileUrl, 307)
    }

    // Step 5: Local File Storage Handling
    let filePath: string | null = null

    if (doc.fileUrl.startsWith("/uploads/private/")) {
      const relativePath = doc.fileUrl.replace("/uploads/private/", "")
      filePath = path.join(process.cwd(), "private_uploads", "documents", relativePath)
    } else if (doc.fileUrl.startsWith("/uploads/")) {
      const relativePath = doc.fileUrl.replace("/uploads/", "")
      const privatePath = path.join(process.cwd(), "private_uploads", "documents", relativePath)
      try {
        await stat(privatePath)
        filePath = privatePath
      } catch {
        filePath = path.join(process.cwd(), "public", "uploads", relativePath)
      }
    }

    if (!filePath) {
      return NextResponse.json({ error: "File path unresolvable" }, { status: 404 })
    }

    // Path Traversal Security Verification
    const normalizedPath = path.normalize(filePath)
    const allowedPrivateDir = path.normalize(path.join(process.cwd(), "private_uploads"))
    const allowedPublicDir = path.normalize(path.join(process.cwd(), "public", "uploads"))

    if (!normalizedPath.startsWith(allowedPrivateDir) && !normalizedPath.startsWith(allowedPublicDir)) {
      return NextResponse.json({ error: "Access Denied: Path Traversal Detected" }, { status: 403 })
    }

    // Read file from disk
    const fileBuffer = await readFile(normalizedPath)

    // Step 6: Return Response with Security Headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": doc.fileType || "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    })
  } catch (error: any) {
    console.error("Error serving secure document:", error)
    return NextResponse.json({ error: "Failed to serve document" }, { status: 500 })
  }
}
