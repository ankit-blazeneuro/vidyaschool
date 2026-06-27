import { Suspense } from "react"
import { ReportsClient } from "./reports-client"

export default async function ReportsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading Reports...</div>}>
      <ReportsClient username={username} />
    </Suspense>
  )
}
