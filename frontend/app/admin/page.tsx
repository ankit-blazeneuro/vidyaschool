import { requireRole } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { userProfile } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { SelectUsernameDialog } from "./select-username-dialog"

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminRootPage({ searchParams }: PageProps) {
  // Ensure only admins can access this
  const currentUser = await requireRole(['admin'])

  // Check if admin profile with username exists
  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, currentUser.id)
  })

  const resolvedSearchParams = await searchParams
  const selectQuery = resolvedSearchParams?.select

  if (profile?.username) {
    redirect(`/admin/${profile.username}`)
  } else {
    redirect('/signup/onboarding')
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-6 lg:px-8 bg-background min-h-screen font-sans">
      <SelectUsernameDialog isOpen={selectQuery === "username"} />
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <h1 className="text-xl font-semibold">Setting up your Admin Account...</h1>
        <p className="text-muted-foreground text-sm">Please follow the instructions in the dialog to choose a username.</p>
      </div>
    </div>
  )
}
