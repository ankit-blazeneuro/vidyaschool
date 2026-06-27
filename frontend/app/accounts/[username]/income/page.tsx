import { Suspense } from "react"
import { IncomeClient } from "./income-client"

export default async function IncomePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading School Income...</div>}>
      <IncomeClient username={username} />
    </Suspense>
  )
}
