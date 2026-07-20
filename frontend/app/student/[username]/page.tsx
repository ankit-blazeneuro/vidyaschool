import dynamic from "next/dynamic"
import { requireRole } from "@/lib/auth-helpers"
import { ClassInfoWidget } from "@/components/class-info-widget"
import { Skeleton } from "@/components/ui/skeleton"

// Defer the loading and mount of heavy client-side modules to optimize initial
// page load and fix the INP render block issue (272ms delay).
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

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

function getDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

export default async function StudentDashboardPage() {
  const user = await requireRole(['student'])
  const greeting = getGreeting()
  const date = getDate()
  
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h2 className="text-4xl font-bold mb-1 font-[family-name:var(--font-raleway)]">{greeting}, {user.name}!</h2>
        <p className="text-sm font-thin tracking-wide text-muted-foreground">{date}</p>
      </div>
      <StudentNotes />
      <StudentCalendar />
      <StudentWidgets />
      <AcademicPerformanceChart />
      <ClassInfoWidget />
    </div>
  )
}
