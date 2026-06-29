"use client"

import * as React from "react"
import Image from "next/image"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { OnboardingAlert } from "@/components/onboarding-alert"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon, BookOpenIcon, GraduationCapIcon, BellIcon, GitPullRequest, MessageSquare, AlertTriangle, ImageIcon } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { io } from "socket.io-client"

// Hook to get username-based URLs
function useStudentUrls() {
  const [username, setUsername] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch('/api/profile/username')
      .then(res => res.json())
      .then(data => {
        if (data.username) {
          setUsername(data.username)
        }
      })
      .catch(() => setUsername(null))
  }, [])

  const base = username ? `/student/${username}` : '/student'
  
  return {
    dashboard: base,
    fees: `${base}/fees`,
    library: `${base}/library`,
    marks: `${base}/marks`,
    notice: `${base}/notice`,
    account: `${base}/account`,
  }
}

// Hook to get username-based URLs for teachers
function useTeacherUrls() {
  const [username, setUsername] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch('/api/profile/username')
      .then(res => res.json())
      .then(data => {
        if (data.username) {
          setUsername(data.username)
        }
      })
      .catch(() => setUsername(null))
  }, [])

  const base = username ? `/teacher/${username}` : '/teacher'
  
  return {
    dashboard: base,
    class: `${base}/class`,
    subjects: `${base}/subjects`,
    requests: `${base}/requests`,
    notice: `${base}/notice`,
    account: `${base}/account`,
  }
}

// Hook to get username-based URLs for admins
function useAdminUrls() {
  const [username, setUsername] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch('/api/profile/username')
      .then(res => res.json())
      .then(data => {
        if (data.username) {
          setUsername(data.username)
        }
      })
      .catch(() => setUsername(null))
  }, [])

  const base = username ? `/admin/${username}` : '/admin'
  
  return {
    dashboard: base,
    students: `${base}/students`,
    teachers: `${base}/teacher`,
    requests: `${base}/requests`,
    feeManagement: `${base}/fee-management`,
    notices: `${base}/notice`,
    slider: `${base}/slider`,
  }
}

// Hook to get username-based URLs for accounts
function useAccountUrls() {
  const [username, setUsername] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch('/api/profile/username')
      .then(res => res.json())
      .then(data => {
        if (data.username) {
          setUsername(data.username)
        }
      })
      .catch(() => setUsername(null))
  }, [])

  const base = username ? `/accounts/${username}` : '/accounts'
  
  return {
    dashboard: base,
    fees: `${base}/fees`,
    structures: `${base}/structures`,
    payments: `${base}/payments`,
    expenses: `${base}/expenses`,
    income: `${base}/income`,
    payroll: `${base}/payroll`,
    ledgers: `${base}/ledgers`,
    banks: `${base}/banks`,
    invoices: `${base}/invoices`,
    receipts: `${base}/receipts`,
    refunds: `${base}/refunds`,
    scholarships: `${base}/scholarships`,
    reports: `${base}/reports`,
    settings: `${base}/settings`,
  }
}

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/student",
      icon: (
        <LayoutDashboardIcon
        />
      ),
    },
    {
      title: "Fees",
      url: "/student/fees",
      icon: (
        <DatabaseIcon
        />
      ),
    },
    {
      title: "Library",
      url: "/student/library",
      icon: (
        <BookOpenIcon
        />
      ),
    },
    {
      title: "Marks",
      url: "/student/marks",
      icon: (
        <GraduationCapIcon
        />
      ),
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: (
        <CameraIcon
        />
      ),
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: (
        <FileTextIcon
        />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: (
        <FileTextIcon
        />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Sessions",
      url: "/login-accounts",
      icon: (
        <Settings2Icon
        />
      ),
    },
    {
      title: "Get Help",
      url: "#",
      icon: (
        <CircleHelpIcon
        />
      ),
    },
    {
      title: "Search",
      url: "#",
      icon: (
        <SearchIcon
        />
      ),
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: (
        <DatabaseIcon
        />
      ),
    },
    {
      name: "Reports",
      url: "#",
      icon: (
        <FileChartColumnIcon
        />
      ),
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: (
        <FileIcon
        />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role
  
  const isTeacher = userRole === "teacher" || (userRole === undefined && pathname?.startsWith("/teacher"))
  const isAdmin = userRole === "admin" || (userRole === undefined && pathname?.startsWith("/admin"))
  const isAccount = userRole === "account" || (userRole === undefined && pathname?.startsWith("/accounts"))
  
  const urls = useStudentUrls()
  const teacherUrls = useTeacherUrls()
  const adminUrls = useAdminUrls()
  const accountUrls = useAccountUrls()

  // Notification states
  const [unreadCommunity, setUnreadCommunity] = React.useState(false)
  const [unreadRequests, setUnreadRequests] = React.useState(false)
  const [unreadNotices, setUnreadNotices] = React.useState(false)
  const [unreadComplaints, setUnreadComplaints] = React.useState(false)

  // Clear notifications when visiting pages
  React.useEffect(() => {
    if (!pathname) return
    if (pathname === "/community") {
      setUnreadCommunity(false)
    }
    if (pathname.includes("/requests")) {
      setUnreadRequests(false)
    }
    if (pathname.includes("/notice")) {
      setUnreadNotices(false)
    }
    if (pathname.includes("/complaints")) {
      setUnreadComplaints(false)
    }
  }, [pathname])

  // Fetch initial pending status on mount and connect to Socket.IO
  React.useEffect(() => {
    if (!session?.user) return

    // 1. Fetch complaints status
    const roleParam = isTeacher ? "teacher" : isAdmin ? "admin" : ""
    if (roleParam) {
      fetch(`/api/complaints?role=${roleParam}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const hasPending = data.some(c => c.status === "pending")
            setUnreadComplaints(hasPending)
          }
        })
        .catch(() => {})
    }

    // 2. Fetch admin requests status
    if (isAdmin) {
      fetch('/api/backend/api/admin/requests')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const hasPending = data.some((r: any) => r.status === "pending")
            setUnreadRequests(hasPending)
          }
        })
        .catch(() => {})
    }

    // 3. Setup Socket.IO listener for real-time notification triggers
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000", {
      transports: ["websocket", "polling"]
    })

    socket.on("new_message", () => {
      if (pathname !== "/community") {
        setUnreadCommunity(true)
      }
    })

    socket.on("teacher_request_created", () => {
      if (isAdmin && !pathname?.includes("/requests")) {
        setUnreadRequests(true)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [session, pathname, isTeacher, isAdmin])

  // Trigger simulated new notice dot
  React.useEffect(() => {
    if (pathname?.includes("/notice")) {
      setUnreadNotices(false)
      return
    }
    const timer = setTimeout(() => {
      setUnreadNotices(true)
    }, 12000)
    return () => clearTimeout(timer)
  }, [pathname])

  const navMain = isAccount
    ? [
        {
          title: "Dashboard",
          url: accountUrls.dashboard,
          icon: <LayoutDashboardIcon />,
        },
        {
          title: "Student Fees",
          url: accountUrls.fees,
          icon: <UsersIcon />,
        },
        {
          title: "Fee Structures",
          url: accountUrls.structures,
          icon: <FileTextIcon />,
        },
        {
          title: "Payments",
          url: accountUrls.payments,
          icon: <DatabaseIcon />,
        },
        {
          title: "Expenses",
          url: accountUrls.expenses,
          icon: <FileChartColumnIcon />,
        },
        {
          title: "Income",
          url: accountUrls.income,
          icon: <ChartBarIcon />,
        },
        {
          title: "Payroll",
          url: accountUrls.payroll,
          icon: <UsersIcon />,
        },
        {
          title: "Ledgers",
          url: accountUrls.ledgers,
          icon: <BookOpenIcon />,
        },
        {
          title: "Bank Accounts",
          url: accountUrls.banks,
          icon: <DatabaseIcon />,
        },
        {
          title: "Invoices",
          url: accountUrls.invoices,
          icon: <FileTextIcon />,
        },
        {
          title: "Receipts",
          url: accountUrls.receipts,
          icon: <FileIcon />,
        },
        {
          title: "Refunds",
          url: accountUrls.refunds,
          icon: <CircleHelpIcon />,
        },
        {
          title: "Scholarships",
          url: accountUrls.scholarships,
          icon: <GraduationCapIcon />,
        },
        {
          title: "Reports",
          url: accountUrls.reports,
          icon: <FileChartColumnIcon />,
        },
        {
          title: "Settings",
          url: accountUrls.settings,
          icon: <Settings2Icon />,
        },
      ]
    : isTeacher
    ? [
        {
          title: "Dashboard",
          url: teacherUrls.dashboard,
          icon: <LayoutDashboardIcon />,
        },
        {
          title: "My Class",
          url: teacherUrls.class,
          icon: <UsersIcon />,
        },
        {
          title: "Subject Class",
          url: teacherUrls.subjects,
          icon: <BookOpenIcon />,
        },
        {
          title: "Requests",
          url: teacherUrls.requests,
          icon: <GitPullRequest />,
          hasNotification: unreadRequests,
        },
        {
          title: "Notices",
          url: teacherUrls.notice,
          icon: <BellIcon />,
          hasNotification: unreadNotices,
        },
        {
          title: "Community Chat",
          url: "/community",
          icon: <MessageSquare />,
          hasNotification: unreadCommunity,
        },
        {
          title: "Complaints",
          url: `${teacherUrls.dashboard}/complaints`,
          icon: <AlertTriangle />,
          hasNotification: unreadComplaints,
        },
      ]
    : isAdmin
    ? [
        {
          title: "Dashboard",
          url: adminUrls.dashboard,
          icon: <LayoutDashboardIcon />,
        },
        {
          title: "Students",
          url: adminUrls.students,
          icon: <GraduationCapIcon />,
        },
        {
          title: "Teachers",
          url: adminUrls.teachers,
          icon: <UsersIcon />,
        },
        {
          title: "Requests",
          url: adminUrls.requests,
          icon: <GitPullRequest />,
          hasNotification: unreadRequests,
        },
        {
          title: "Fee Management",
          url: adminUrls.feeManagement,
          icon: <DatabaseIcon />,
        },
        {
          title: "Community Chat",
          url: "/community",
          icon: <MessageSquare />,
          hasNotification: unreadCommunity,
        },
        {
          title: "Complaints",
          url: `${adminUrls.dashboard}/complaints`,
          icon: <AlertTriangle />,
          hasNotification: unreadComplaints,
        },
        {
          title: "Notices",
          url: adminUrls.notices,
          icon: <BellIcon />,
          hasNotification: unreadNotices,
        },
        {
          title: "Slider Banners",
          url: adminUrls.slider,
          icon: <ImageIcon />,
        },
      ]
    : [
        {
          title: "Dashboard",
          url: urls.dashboard,
          icon: <LayoutDashboardIcon />,
        },
        {
          title: "Fees",
          url: urls.fees,
          icon: <DatabaseIcon />,
        },
        {
          title: "Library",
          url: urls.library,
          icon: <BookOpenIcon />,
        },
        {
          title: "Marks",
          url: urls.marks,
          icon: <GraduationCapIcon />,
        },
        {
          title: "Notices",
          url: urls.notice,
          icon: <BellIcon />,
          hasNotification: unreadNotices,
        },
      ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <Image
                  src="/assets/vidyaschool/Logo/no_title.svg"
                  alt="Vidya School Logo"
                  width={20}
                  height={20}
                  className="size-5! object-contain grayscale brightness-0 dark:invert"
                />
                <span className="text-base font-semibold">Vidya School</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {!isAdmin && (
          <div className="px-3 py-2">
            <OnboardingAlert isTeacher={isTeacher} />
          </div>
        )}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
