"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const AcademicPerformanceChart = dynamic(
  () => import("@/components/academic-performance-chart").then(mod => mod.AcademicPerformanceChart),
  {
    ssr: false,
    loading: () => (
      <div className="px-4 lg:px-6">
        <Skeleton className="h-[250px] w-full rounded-2xl" />
      </div>
    ),
  }
)

const StudentNotes = dynamic(
  () => import("@/components/student-notes").then(mod => mod.StudentNotes),
  {
    ssr: false,
    loading: () => (
      <div className="mx-4 lg:mx-6">
        <Skeleton className="h-[180px] w-full rounded-2xl" />
      </div>
    ),
  }
)

const StudentCalendar = dynamic(
  () => import("@/components/student-calendar").then(mod => mod.StudentCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="mx-4 lg:mx-6">
        <Skeleton className="h-[220px] w-full rounded-2xl" />
      </div>
    ),
  }
)

const StudentWidgets = dynamic(
  () => import("@/components/student-widgets").then(mod => mod.StudentWidgets),
  {
    ssr: false,
    loading: () => (
      <div className="px-4 lg:px-6">
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </div>
    ),
  }
)

export function StudentDashboardClient() {
  return (
    <>
      <StudentNotes />
      <StudentCalendar />
      <StudentWidgets />
      <AcademicPerformanceChart />
    </>
  )
}
