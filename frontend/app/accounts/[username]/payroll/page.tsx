import { Suspense } from "react"
import { PayrollClient } from "./payroll-client"

export default async function PayrollPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading School Payroll...</div>}>
      <PayrollClient username={username} />
    </Suspense>
  )
}
