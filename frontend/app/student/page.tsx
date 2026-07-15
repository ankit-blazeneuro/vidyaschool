'use client'

import * as React from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation"
import { OnboardingDialog } from "@/components/onboarding-dialog"
import { Loader2Icon } from "lucide-react"

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 w-full min-h-screen bg-background">
      {/* 1. Greetings block */}
      <div className="px-4 lg:px-6 space-y-1">
        <div className="h-10 w-72 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="h-4 w-40 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md animate-pulse" />
      </div>

      {/* 2. StudentNotes skeleton */}
      <section className="rounded-2xl bg-zinc-100 dark:bg-[#121212] mx-4 lg:mx-6 overflow-hidden">
        <div className="px-6 pt-5 pb-4">
          <h2 className="font-heading text-base leading-snug font-medium mb-4 text-foreground">
            Notes
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-hidden px-6 pb-0 -mr-6 scrollbar-none mb-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="relative min-w-[280px] max-w-[280px] shrink-0 bg-white dark:bg-[#1e1e1e] border-0 ring-0
                         rounded-t-xl rounded-b-none shadow-none flex flex-col p-5 h-44 animate-pulse gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="size-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-full shrink-0" />
                  <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
                <div className="h-2.5 w-10 bg-zinc-200/60 dark:bg-zinc-800/60 rounded shrink-0" />
              </div>
              <div className="h-5 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded mt-1" />
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                  <div className="h-3.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                  <div className="h-3.5 w-5/6 bg-zinc-100 dark:bg-zinc-900 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. StudentCalendar skeleton */}
      <section className="mx-4 lg:mx-6 rounded-2xl bg-zinc-100 dark:bg-[#121212] overflow-hidden">
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-base leading-snug font-medium text-foreground">Calendar</h2>
            <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1 h-7 w-36" />
          </div>

          <div className="relative bg-zinc-200/40 dark:bg-black/35 rounded-xl p-4 border border-border/30 min-h-[220px]">
            <div className="flex min-w-max relative pt-1 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-1 min-w-[95px] flex flex-col items-start relative gap-3">
                  <div className="absolute top-[26px] left-0 size-2.5 rounded-full border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-[#121212] z-20 -translate-x-[5px] -translate-y-[4px]" />
                  <div className="h-3 w-10 bg-zinc-200 dark:bg-zinc-800 rounded pl-2 z-10" />
                  <div className="w-full border-l border-dashed border-zinc-200/80 dark:border-zinc-800/80 min-h-[150px] pt-1">
                    {i === 0 && (
                      <div className="absolute inset-x-1.5 top-2 h-24 rounded-lg bg-emerald-100/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-2 flex flex-col justify-between" />
                    )}
                    {i === 2 && (
                      <div className="absolute inset-x-1.5 top-4 h-24 rounded-lg bg-blue-100/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-2 flex flex-col justify-between" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. StudentWidgets skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 lg:px-6">
        {/* Tasks Card Skeleton */}
        <div className="rounded-2xl bg-zinc-100 dark:bg-[#121212] p-5 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base leading-snug font-medium text-foreground">
              Tasks
            </h2>
            <div className="size-6 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800/60 flex-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
                <div className="size-4 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1e1e1e]" />
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Scratch Pad Card Skeleton */}
        <div className="rounded-2xl bg-zinc-100 dark:bg-[#121212] p-5 flex flex-col min-h-[300px] relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base leading-snug font-medium text-foreground">
              Scratch Pad
            </h2>
            <div className="size-6 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="flex-1 flex flex-col gap-2 pt-1">
            <div className="h-3.5 w-11/12 bg-zinc-200/50 dark:bg-zinc-800/50 rounded" />
            <div className="h-3.5 w-4/5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded" />
            <div className="h-3.5 w-3/4 bg-zinc-200/50 dark:bg-zinc-800/50 rounded" />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 rounded-full shadow-md w-36 h-8.5" />
        </div>
      </div>

      {/* 5. ChartAreaInteractive skeleton */}
      <div className="px-4 lg:px-6">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm overflow-hidden">
          <div className="flex flex-row items-center justify-between p-6 pb-2">
            <div className="space-y-1.5">
              <div className="h-5 w-44 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-56 bg-zinc-200/50 dark:bg-zinc-800/50 rounded animate-pulse" />
            </div>
            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          </div>
          <div className="px-6 pt-4 pb-6 h-[250px] flex items-end gap-3.5 animate-pulse">
            {[...Array(12)].map((_, i) => {
              const heights = ["60px", "90px", "75px", "110px", "85px", "130px", "100px", "150px", "120px", "170px", "135px", "160px"]
              return (
                <div 
                  key={i} 
                  className="flex-1 rounded-t-md bg-zinc-100 dark:bg-zinc-900 transition-all duration-300"
                  style={{ height: heights[i % heights.length] }} 
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* 6. DataTable skeleton */}
      <div className="w-full flex-col justify-start gap-6 mb-6">
        <div className="flex items-center justify-between px-4 lg:px-6 mb-4">
          <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-8 w-44 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex flex-col px-4 lg:px-6">
          <div className="overflow-hidden rounded-xl border border-border bg-zinc-100 dark:bg-[#121212] shadow-sm animate-pulse">
            <div className="bg-muted/50 h-10 border-b border-border flex items-center px-4 justify-between">
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 border-b border-border last:border-b-0 flex items-center px-4 justify-between bg-white dark:bg-[#1c1c1c]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded bg-zinc-200 dark:bg-zinc-800 block shrink-0" />
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                  <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
                <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

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
    return <DashboardSkeleton />
  }

  const showOnboarding = searchParams.get("onboarding") === "true" || !profile?.onboardingCompleted

  return (
    <div className="relative w-full min-h-screen">
      {/* Background Dashboard Skeleton */}
      <DashboardSkeleton />

      {/* Onboarding Dialog Overlay */}
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
    <React.Suspense fallback={<DashboardSkeleton />}>
      <StudentOnboardingContent />
    </React.Suspense>
  )
}
