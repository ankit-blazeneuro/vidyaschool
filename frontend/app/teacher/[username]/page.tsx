import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { requireRole } from "@/lib/auth-helpers"
import data from "../data.json"

export default async function TeacherDashboardPage() {
  const user = await requireRole(['teacher', 'admin'])
  
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h2 className="text-lg font-semibold mb-2">Teacher Dashboard - Welcome, {user.name}!</h2>
        <p className="text-sm text-muted-foreground">Role: {user.role}</p>
      </div>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </div>
  )
}
