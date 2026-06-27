import { Suspense } from "react"
import { PaymentsClient } from "./payments-client"

export default async function PaymentsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading Payments Ledger...</div>}>
      <PaymentsClient username={username} />
    </Suspense>
  )
}
