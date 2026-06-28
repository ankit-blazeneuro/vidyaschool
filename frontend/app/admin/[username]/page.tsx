import { requireRole } from "@/lib/auth-helpers"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import studentData from "../../student/[username]/data.json"
import { headers } from "next/headers"

interface PageProps {
  params: Promise<{ username: string }>
}

const performanceChartConfig = {
  classAverage: {
    label: "Class Average",
    color: "hsl(var(--primary))",
  },
  schoolAverage: {
    label: "School Average",
    color: "hsl(var(--chart-2))",
  },
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { username } = await params
  // Ensure only admins can access this page
  const currentUser = await requireRole(['admin'])

  let totalFeesPaid = 0
  let expectedFeesToCollect = 0
  let activeAccounts = 0

  let performanceData = []
  let schoolAverage = 78.5

  const cookieHeader = (await headers()).get("cookie") || ""

  // Fetch stats and performance in parallel to significantly reduce latency!
  try {
    const [statsRes, perfRes] = await Promise.all([
      fetch("http://localhost:8000/api/admin/stats", {
        headers: {
          "cookie": cookieHeader,
        },
        cache: "no-store",
      }).catch(err => {
        console.error("Stats fetch error:", err)
        return null
      }),
      fetch("http://localhost:8000/api/admin/performance", {
        headers: {
          "cookie": cookieHeader,
        },
        cache: "no-store",
      }).catch(err => {
        console.error("Performance fetch error:", err)
        return null
      })
    ])

    if (statsRes && statsRes.ok) {
      const stats = await statsRes.json()
      totalFeesPaid = stats.total_fee_received || 0
      expectedFeesToCollect = stats.expected_fee_to_collect || 0
      activeAccounts = stats.active_accounts || 0
    }

    if (perfRes && perfRes.ok) {
      const perf = await perfRes.json()
      performanceData = perf.performance || []
      schoolAverage = perf.school_average || 78.5
    }
  } catch (err) {
    console.error("Failed to fetch admin stats in parallel:", err)
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 bg-background min-h-screen font-sans">
      <div className="px-4 lg:px-6">
        <h2 className="text-lg font-semibold mb-2">Welcome, {currentUser.name}!</h2>
        <p className="text-sm text-muted-foreground">Role: {currentUser.role}</p>
      </div>
      <SectionCards 
        card1={{
          title: "Total Fee Received",
          value: `₹${totalFeesPaid.toLocaleString()}`,
          trend: undefined,
          footer1: undefined,
          footer2: "Successfully processed payments"
        }}
        card2={{
          title: "Expected Fee to Collect",
          value: `₹${expectedFeesToCollect.toLocaleString()}`,
          trend: undefined,
          footer1: undefined,
          footer2: "Outstanding and upcoming payments"
        }}
        card3={{
          title: "Active Accounts",
          value: activeAccounts.toLocaleString(),
          trend: undefined,
          footer1: undefined,
          footer2: "Total registered users in system"
        }}
      />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive 
          title="School Academic Performance"
          descriptionLine1="Class averages compared to overall school average"
          descriptionLine2={`Overall School Average: ${schoolAverage}%`}
          data={performanceData}
          config={performanceChartConfig}
          xAxisKey="class"
          dataKey1="classAverage"
          dataKey2="schoolAverage"
          hideTimeRangeToggle={true}
        />
      </div>
      <DataTable data={studentData} />
    </div>
  )
}
