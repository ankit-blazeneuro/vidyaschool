import { Suspense } from "react"
import { BanksClient } from "./banks-client"

export default async function BanksPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <Suspense fallback={<div className="p-8">Loading Bank Accounts...</div>}>
      <BanksClient username={username} />
    </Suspense>
  )
}
