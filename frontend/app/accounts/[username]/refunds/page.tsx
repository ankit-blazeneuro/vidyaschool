import { Suspense } from "react"
import { RefundsClient } from "./refunds-client"

export default async function RefundsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading Refunds...</div>}>
      <RefundsClient username={username} />
    </Suspense>
  )
}
