"use client"

import {
  LayoutDashboard, Users, CreditCard, Wallet, Receipt, FileText,
  TrendingUp, Settings, DollarSign, Archive, Award, AlertCircle
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

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "" },
  { icon: Users, label: "Student Fees", href: "/fees" },
  { icon: CreditCard, label: "Fee Structures", href: "/structures" },
  { icon: DollarSign, label: "Payments", href: "/payments" },
  { icon: Wallet, label: "Expenses", href: "/expenses" },
  { icon: TrendingUp, label: "Income", href: "/income" },
  { icon: Users, label: "Payroll", href: "/payroll" },
  { icon: FileText, label: "Ledgers", href: "/ledgers" },
  { icon: Archive, label: "Bank Accounts", href: "/banks" },
  { icon: Receipt, label: "Invoices", href: "/invoices" },
  { icon: Receipt, label: "Receipts", href: "/receipts" },
  { icon: AlertCircle, label: "Refunds", href: "/refunds" },
  { icon: Award, label: "Scholarships", href: "/scholarships" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function AccountsSidebar({ username }: { username: string }) {
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
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild>
                  <a href={`/accounts/${username}${item.href}`}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
