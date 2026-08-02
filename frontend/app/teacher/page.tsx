'use client'

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { OnboardingDialog } from "@/components/onboarding-dialog"
import { Loader2Icon } from "lucide-react"

function TeacherOnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch('/api/profile/username')
      .then(res => {
        if (!res.ok) {
          router.push("/login")
          return null
        }
        return res.json()
      })
      .then(data => {
        if (!data) return
        setProfile(data)
        setLoading(false)

        if (data.username && data.onboardingCompleted) {
          if (searchParams.get("onboarding") !== "true") {
            router.push(`/teacher/${data.username}`)
          }
        } else {
          if (searchParams.get("onboarding") !== "true") {
            router.replace("/teacher?onboarding=true")
          }
        }
      })
      .catch(() => {
        router.push("/login")
      })
  }, [router, searchParams])

  if (loading) {
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
          Welcome back! Preparing your educator workspace. Please complete the profile onboarding form to continue.
        </p>
      </div>

      {showOnboarding && (
        <OnboardingDialog
          userRole="teacher"
          userEmail=""
          onSuccess={(newUsername) => {
            router.push(`/teacher/${newUsername}`)
          }}
        />
      )}
    </div>
  )
}

export default function TeacherRootPage() {
  return (
    <React.Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <TeacherOnboardingContent />
    </React.Suspense>
  )
}
