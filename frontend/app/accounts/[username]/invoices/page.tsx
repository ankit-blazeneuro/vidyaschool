import { Suspense } from "react"
import { InvoicesClient } from "./invoices-client"

export default async function InvoicesPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading Invoices...</div>}>
      <InvoicesClient username={username} />
    </Suspense>
  )
}
