"use client"

import { usePathname } from "next/navigation"
import { StudentDashboardSkeleton } from "@/components/student-dashboard-skeleton"
import { Loader2 } from "lucide-react"

export default function StudentDashboardLoading() {
  const pathname = usePathname()
  
  const cleanPath = pathname?.replace(/\/$/, "") || ""
  const parts = cleanPath.split("/")
  
  // Dashboard path parts: ["", "student", "username"] -> length 3
  const isDashboard = parts.length === 3 && parts[1] === "student"

  if (isDashboard) {
    return <StudentDashboardSkeleton />
  }

  return (
    <div className="flex min-h-[400px] w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  )
}
