import { Suspense } from "react"
import { LedgersClient } from "./ledgers-client"

export default async function LedgersPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading General Ledgers...</div>}>
      <LedgersClient username={username} />
    </Suspense>
  )
}
