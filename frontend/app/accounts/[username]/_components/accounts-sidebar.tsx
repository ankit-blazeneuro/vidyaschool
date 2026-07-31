"use client"

import {
  LayoutDashboard, Users, CreditCard, Wallet, Receipt, FileText,
  TrendingUp, Settings, DollarSign, Archive, Award, AlertCircle, Lock
} from "lucide-react"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface MenuItem {
  icon: any
  label: string
  href: string
  unlocked: boolean
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "", unlocked: true },
  { icon: Users, label: "Student Fees", href: "/fees", unlocked: true },
  { icon: CreditCard, label: "Fee Structures", href: "/structures", unlocked: true },
  { icon: DollarSign, label: "Payments", href: "/payments", unlocked: false },
  { icon: Wallet, label: "Expenses", href: "/expenses", unlocked: false },
  { icon: TrendingUp, label: "Income", href: "/income", unlocked: false },
  { icon: Users, label: "Payroll", href: "/payroll", unlocked: false },
  { icon: FileText, label: "Ledgers", href: "/ledgers", unlocked: false },
  { icon: Archive, label: "Bank Accounts", href: "/banks", unlocked: false },
  { icon: Receipt, label: "Invoices", href: "/invoices", unlocked: false },
  { icon: Receipt, label: "Receipts", href: "/receipts", unlocked: false },
  { icon: AlertCircle, label: "Refunds", href: "/refunds", unlocked: false },
  { icon: Award, label: "Scholarships", href: "/scholarships", unlocked: false },
  { icon: FileText, label: "Reports", href: "/reports", unlocked: false },
  { icon: Settings, label: "Settings", href: "/settings", unlocked: false },
]

export function AccountsSidebar({ username }: { username: string }) {
  const pathname = usePathname()

  const handleLockedClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault()
    toast.info(`${label} Module Locked`, {
      description: "This feature is coming soon. Only Dashboard, Student Fees, and Fee Structures are currently active.",
    })
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <Wallet className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm font-semibold">Accounts</p>
            <p className="text-xs text-muted-foreground">{username}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Financial Management</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => {
              const fullHref = `/accounts/${username}${item.href}`
              const isActive =
                item.href === ""
                  ? pathname === `/accounts/${username}` || pathname === `/accounts/${username}/`
                  : pathname.startsWith(fullHref)

              if (item.unlocked) {
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={fullHref} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }

              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    onClick={(e) => handleLockedClick(e, item.label)}
                    className="w-full flex items-center justify-between text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30 cursor-not-allowed group"
                  >
                    <div className="flex items-center gap-2 opacity-75 group-hover:opacity-100 transition-opacity">
                      <item.icon className="h-4 w-4" />
                      <span className="text-xs">{item.label}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium shrink-0">
                      <Lock className="h-2.5 w-2.5" /> Coming Soon
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
