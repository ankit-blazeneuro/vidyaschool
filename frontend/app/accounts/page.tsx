import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { userProfile } from "@/lib/schema"
import { eq } from "drizzle-orm"

export default async function AccountsRedirect() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  
  if (!session?.user) {
    redirect("/login")
  }
  
  const userData = session.user as any
  
  // Check if user has username/onboarding completed
  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, userData.id)
  })
  
  if (!profile?.username) {
    redirect("/accounts/onboarding")
  }
  
  redirect(`/accounts/${profile.username}`)
}
