import { Suspense } from "react"
import { ExpensesClient } from "./expenses-client"

export default async function ExpensesPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading School Expenses...</div>}>
      <ExpensesClient username={username} />
    </Suspense>
  )
}
