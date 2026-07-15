'use client'

import * as React from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation"
import { OnboardingDialog } from "@/components/onboarding-dialog"
import { StudentDashboardSkeleton } from "@/components/student-dashboard-skeleton"

// ─── localStorage cache helpers ────────────────────────────────────────────
// Key is per-user so switching accounts never leaks stale data.
const CACHE_KEY = (userId: string) => `vs_ob_${userId}`

interface OnboardingCache {
  onboardingCompleted: boolean
  username: string
}

function readCache(userId: string): OnboardingCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY(userId))
    if (!raw) return null
    return JSON.parse(raw) as OnboardingCache
  } catch {
    return null
  }
}

function writeCache(userId: string, data: OnboardingCache) {
  try {
    localStorage.setItem(CACHE_KEY(userId), JSON.stringify(data))
  } catch {
    // localStorage unavailable (private mode / quota exceeded) — silently ignore
  }
}

function clearCache(userId: string) {
  try {
    localStorage.removeItem(CACHE_KEY(userId))
  } catch {}
}
// ───────────────────────────────────────────────────────────────────────────

function StudentOnboardingContent() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = React.useState<OnboardingCache | null>(null)
  const [loadingProfile, setLoadingProfile] = React.useState(true)

  React.useEffect(() => {
    if (isPending) return
    if (!session?.user) {
      router.push("/login")
      return
    }

    const userId = session.user.id
    const forceOnboarding = searchParams.get("onboarding") === "true"

    // ── Fast path: read cache first ──────────────────────────────────────
    // Only use cache if not explicitly forced back to onboarding
    if (!forceOnboarding) {
      const cached = readCache(userId)
      if (cached?.onboardingCompleted && cached.username) {
        // Already onboarded — redirect instantly without any network call
        router.push(`/student/${cached.username}`)
        return
      }
    }

    // ── Slow path: fetch from API ────────────────────────────────────────
    fetch('/api/profile/username')
      .then(res => res.json())
      .then(data => {
        setProfile(data)
        setLoadingProfile(false)

        if (data.username && data.onboardingCompleted) {
          // Cache the result for future instant redirects
          writeCache(userId, {
            onboardingCompleted: true,
            username: data.username,
          })
          if (!forceOnboarding) {
            router.push(`/student/${data.username}`)
          }
        } else {
          // Not onboarded — clear any stale cache
          clearCache(userId)
          if (!forceOnboarding) {
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
            // Write to cache immediately on success so next visit is instant
            writeCache(session.user.id, {
              onboardingCompleted: true,
              username: newUsername,
            })
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
