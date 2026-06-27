'use client'

import * as React from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation"
import { OnboardingDialog } from "@/components/onboarding-dialog"
import { Loader2Icon } from "lucide-react"

function StudentOnboardingContent() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = React.useState<any>(null)
  const [loadingProfile, setLoadingProfile] = React.useState(true)

  React.useEffect(() => {
    if (isPending) return
    if (!session?.user) {
      router.push("/login")
      return
    }

    // Fetch user profile status
    fetch('/api/profile/username')
      .then(res => res.json())
      .then(data => {
        setProfile(data)
        setLoadingProfile(false)
        
        // If onboarding is completed, redirect to their username dashboard
        if (data.username && data.onboardingCompleted) {
          if (searchParams.get("onboarding") !== "true") {
            router.push(`/student/${data.username}`)
          }
        } else {
          // If they are not onboarded, force ?onboarding=true in the URL
          if (searchParams.get("onboarding") !== "true") {
            router.replace("/student?onboarding=true")
          }
        }
      })
      .catch(() => {
        setLoadingProfile(false)
      })
  }, [session, isPending, router, searchParams])

  if (isPending || loadingProfile) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const showOnboarding = searchParams.get("onboarding") === "true" || !profile?.onboardingCompleted

  return (
    <div className="min-h-screen bg-muted/30 relative flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight animate-pulse">Vidya School</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Welcome back! Preparing your student workspace. Please complete the profile onboarding form to continue.
        </p>
      </div>

      {showOnboarding && session?.user && (
        <OnboardingDialog
          userRole="student"
          userEmail={session.user.email}
          onSuccess={(newUsername) => {
            // Optimize page change without reload
            router.push(`/student/${newUsername}`)
          }}
        />
      )}
    </div>
  )
}

export default function StudentRootPage() {
  return (
    <React.Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <StudentOnboardingContent />
    </React.Suspense>
  )
}
