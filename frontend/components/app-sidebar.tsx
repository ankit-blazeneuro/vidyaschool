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
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon, BookOpenIcon, GraduationCapIcon, BellIcon, GitPullRequest, MessageSquare, AlertTriangle } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { io } from "socket.io-client"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Smartphone, Download } from "lucide-react"

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

// Hook to get username-based URLs for librarians
function useLibrarianUrls() {
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

  const base = username ? `/librarian/${username}` : '/librarian'
  
  return {
    dashboard: base,
    books: `${base}/books`,
    borrowings: `${base}/borrowings`,
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
      url: "/docs",
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
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        if (typeof window !== "undefined") {
          const event = new KeyboardEvent("keydown", {
            key: "k",
            code: "KeyK",
            ctrlKey: true,
            metaKey: true,
            bubbles: true,
            cancelable: true,
          })
          window.dispatchEvent(event)
        }
      },
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
  const { data: session, isPending } = useSession()
  const [profileLoading, setProfileLoading] = React.useState(true)
  const [isQrOpen, setIsQrOpen] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/profile/username')
      .then(() => setProfileLoading(false))
      .catch(() => setProfileLoading(false))
  }, [])

  const isLoading = isPending || profileLoading
  const userRole = session?.user?.role
  
  const isLibrarian = userRole === "librarian" || (userRole === undefined && pathname?.startsWith("/librarian"))
  const isTeacher = userRole === "teacher" || (userRole === undefined && pathname?.startsWith("/teacher"))
  const isAdmin = userRole === "admin" || (userRole === undefined && pathname?.startsWith("/admin"))
  const isAccount = userRole === "account" || (userRole === undefined && pathname?.startsWith("/accounts"))
  
  const urls = useStudentUrls()
  const teacherUrls = useTeacherUrls()
  const librarianUrls = useLibrarianUrls()
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
    const roleParam = isTeacher || isLibrarian ? "teacher" : isAdmin ? "admin" : ""
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

    socket.on("complaint_created", () => {
      if (isAdmin && !pathname?.includes("/complaints")) {
        setUnreadComplaints(true)
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
    : isLibrarian
    ? [
        {
          title: "Dashboard",
          url: librarianUrls.dashboard,
          icon: <LayoutDashboardIcon />,
        },
        {
          title: "Manage Books",
          url: librarianUrls.books,
          icon: <BookOpenIcon />,
        },
        {
          title: "Book Issues",
          url: librarianUrls.borrowings,
          icon: <GitPullRequest />,
        },
        {
          title: "Notices",
          url: librarianUrls.notice,
          icon: <BellIcon />,
          hasNotification: unreadNotices,
        },
        {
          title: "Community Chat",
          url: "/community",
          icon: <MessageSquare />,
          hasNotification: unreadCommunity,
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
          icon: <CameraIcon />,
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
        {isLoading ? (
          <div className="space-y-4 px-4 py-2 flex-1">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-2">
                  <Skeleton className="h-5 w-5 rounded-md shrink-0 bg-muted-foreground/20" />
                  <Skeleton className="h-4 w-28 bg-muted-foreground/20" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <NavMain items={navMain} />
            {!isAdmin && (
              <div className="px-3 py-2">
                <OnboardingAlert isTeacher={isTeacher} />
              </div>
            )}
            {/* Mobile App Download Card */}
            <div className="px-3 py-2">
              <div 
                onClick={() => setIsQrOpen(true)}
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 p-3 transition-all duration-300 hover:border-primary/40 hover:shadow-sm dark:from-primary/10 dark:to-primary/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Smartphone className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">Download Android App</p>
                    <p className="text-[10px] text-muted-foreground truncate">Get the latest v1.0.51 build</p>
                  </div>
                  <Download className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
              </div>
            </div>
          </>
        )}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      {/* Dialog: Android App QR Code */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="sm:max-w-md text-center flex flex-col items-center p-6">
          <DialogHeader className="items-center">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Smartphone className="size-5 text-primary animate-bounce" />
              Download VidyaSchool App
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Scan the QR code below on your Android device to download and install the latest version (v1.0.51).
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-6 p-4 bg-white rounded-xl shadow-inner border border-muted/55">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fgithub.com%2Fankit-blazeneuro%2Fvidyaschool%2Freleases%2Fdownload%2Fv1.0.51%2Fapp-debug.apk" 
              alt="Download QR Code" 
              width={200}
              height={200}
              className="rounded-lg object-contain mx-auto"
            />
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <Button asChild variant="default" className="w-full gap-2">
              <a href="https://github.com/ankit-blazeneuro/vidyaschool/releases/download/v1.0.51/app-debug.apk" download>
                <Download className="size-4" />
                Direct Download (APK)
              </a>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setIsQrOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
