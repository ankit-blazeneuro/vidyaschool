import { Suspense } from "react"
import { ReceiptsClient } from "./receipts-client"

export default async function ReceiptsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading Receipts...</div>}>
      <ReceiptsClient username={username} />
    </Suspense>
  )
}
