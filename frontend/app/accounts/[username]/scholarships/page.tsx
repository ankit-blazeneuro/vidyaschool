import { Suspense } from "react"
import { ScholarshipsClient } from "./scholarships-client"

export default async function ScholarshipsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading Scholarships...</div>}>
      <ScholarshipsClient username={username} />
    </Suspense>
  )
}
