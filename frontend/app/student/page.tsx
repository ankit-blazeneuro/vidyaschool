'use client'

import * as React from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation"
import { OnboardingDialog } from "@/components/onboarding-dialog"
import { StudentDashboardSkeleton } from "@/components/student-dashboard-skeleton"

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
    return <StudentDashboardSkeleton />
  }

  const showOnboarding = searchParams.get("onboarding") === "true" || !profile?.onboardingCompleted

  return (
    <div className="relative w-full min-h-screen">
      {/* Background Dashboard Skeleton while onboarding dialog is open */}
      <StudentDashboardSkeleton />

      {/* Onboarding Dialog Overlay */}
      {showOnboarding && session?.user && (
        <OnboardingDialog
          userRole="student"
          userEmail={session.user.email}
          onSuccess={(newUsername) => {
            router.push(`/student/${newUsername}`)
          }}
        />
      )}
    </div>
  )
}

export default function StudentRootPage() {
  return (
    <React.Suspense fallback={<StudentDashboardSkeleton />}>
      <StudentOnboardingContent />
    </React.Suspense>
  )
}
