"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { OnboardingDialog } from "@/components/onboarding-dialog"

export default function StudentOnboardingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading student dashboard...</p>
          </div>
        </div>
      }
    >
      <StudentOnboardingContent />
    </React.Suspense>
  )
}

function StudentOnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = React.useState<{ username?: string | null; onboardingCompleted?: boolean } | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/profile/username")
      .then((res) => {
        if (!res.ok) {
          router.push("/login")
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (!data) return
        setProfile(data)
        setLoading(false)

        const forceOnboarding = searchParams.get("onboarding") === "true"

        if (data.username && data.onboardingCompleted && !forceOnboarding) {
          router.push(`/student/${data.username}`)
        } else if (!data.username || !data.onboardingCompleted) {
          router.push("/signup/onboarding")
        }
      })
      .catch(() => {
        router.push("/login")
      })
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const showOnboarding = searchParams.get("onboarding") === "true" || !profile?.username || !profile?.onboardingCompleted

  return (
    <div className="relative w-full min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight animate-pulse">Vidya School</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Welcome back! Preparing your student workspace. Please complete the profile onboarding form to continue.
        </p>
      </div>

      {showOnboarding && (
        <OnboardingDialog
          userRole="student"
          userEmail=""
          onSuccess={(newUsername: string) => {
            router.push(`/student/${newUsername}`)
          }}
        />
      )}
    </div>
  )
}
