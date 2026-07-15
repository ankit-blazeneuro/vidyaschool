"use client"

import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
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
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon, BookOpenIcon, GraduationCapIcon, BellIcon, GitPullRequest, MessageSquare, AlertTriangle, MoonIcon, CircleUserRoundIcon, ChevronsUpDown, SunIcon, Laptop, ChevronRight } from "lucide-react"
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
import { Smartphone, Download, Plus } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { toast } from "sonner"

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
  const { isMobile, setOpenMobile } = useSidebar()
  const [profileLoading, setProfileLoading] = React.useState(true)
  const [isQrOpen, setIsQrOpen] = React.useState(false)
  const [appVersion, setAppVersion] = React.useState<string>("v1.0.52")
  const [downloadUrl, setDownloadUrl] = React.useState<string>(
    "https://github.com/ankit-blazeneuro/vidyaschool/releases/download/v1.0.52/app-debug.apk"
  )

  React.useEffect(() => {
    fetch('/api/profile/username')
      .then(() => setProfileLoading(false))
      .catch(() => setProfileLoading(false))

    fetch('https://api.github.com/repos/ankit-blazeneuro/vidyaschool/releases/latest')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch latest release')
        return res.json()
      })
      .then(data => {
        if (data.tag_name) {
          setAppVersion(data.tag_name)
          const apkAsset = data.assets?.find((asset: any) => asset.name?.endsWith('.apk'))
          if (apkAsset?.browser_download_url) {
            setDownloadUrl(apkAsset.browser_download_url)
          } else {
            setDownloadUrl(`https://github.com/ankit-blazeneuro/vidyaschool/releases/download/${data.tag_name}/app-debug.apk`)
          }
        }
      })
      .catch(() => {})
  }, [])

  const isLoading = isPending || profileLoading
  const userRole = session?.user?.role
  
  const isLibrarian = userRole === "librarian" || (userRole === undefined && pathname?.startsWith("/librarian"))
  const isTeacher = userRole === "teacher" || (userRole === undefined && pathname?.startsWith("/teacher"))
  const isAdmin = userRole === "admin" || (userRole === undefined && pathname?.startsWith("/admin"))
  const isAccount = userRole === "account" || (userRole === undefined && pathname?.startsWith("/accounts"))
  
  const adminUrls = useAdminUrls()
  const accountUrls = useAccountUrls()
  const urls = useStudentUrls()
  const teacherUrls = useTeacherUrls()
  const librarianUrls = useLibrarianUrls()

  const [profileUsername, setProfileUsername] = React.useState<string | null>(null)
  const [isCommandOpen, setIsCommandOpen] = React.useState(false)
  const [commandSearch, setCommandSearch] = React.useState("")
  const [isThemeHovered, setIsThemeHovered] = React.useState(false)
  const { setTheme } = useTheme()

  React.useEffect(() => {
    fetch('/api/profile/username')
      .then(res => res.json())
      .then(data => {
        if (data.username) setProfileUsername(data.username)
      })
      .catch(() => {})
  }, [])

  const accountUrl = userRole === 'admin'
    ? (profileUsername ? `/admin/${profileUsername}/account` : '/admin')
    : (userRole === 'teacher' || userRole === 'librarian')
    ? (profileUsername ? `/teacher/${profileUsername}/account` : '/teacher')
    : (profileUsername ? `/student/${profileUsername}/account` : '/student')

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const currentRoleValue = isTeacher
    ? "teacher"
    : isLibrarian
    ? "librarian"
    : isAdmin
    ? "admin"
    : isAccount
    ? "account"
    : "student"

  const handleRoleChange = (role: string) => {
    let targetUrl = "/student"
    if (role === "teacher") targetUrl = teacherUrls.dashboard
    else if (role === "librarian") targetUrl = librarianUrls.dashboard
    else if (role === "admin") targetUrl = adminUrls.dashboard
    else if (role === "account") targetUrl = accountUrls.dashboard
    else targetUrl = urls.dashboard

    window.location.href = targetUrl
  }

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

  // Global search shortcut listener for Cmd+F / Ctrl+F
  React.useEffect(() => {
    const handleSearchShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === "f") {
        e.preventDefault()
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
    }

    window.addEventListener("keydown", handleSearchShortcut)
    return () => window.removeEventListener("keydown", handleSearchShortcut)
  }, [])

  const baseNavMain = isAccount
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

  const navMain = [
    ...baseNavMain,
    {
      title: "Mobile App",
      url: "/downloads",
      icon: <Smartphone />,
    }
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-3 flex flex-col gap-5">
        {isLoading ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5 px-1 py-1.5 w-full">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-2 w-24 rounded" />
              </div>
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
            <div className="h-px bg-sidebar-border/60 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Command Trigger (Popover based) */}
            <Popover open={isCommandOpen} onOpenChange={setIsCommandOpen}>
              <PopoverTrigger asChild>
                <button
                  onClick={() => {
                    setCommandSearch("")
                  }}
                  className="w-full h-auto p-1 bg-transparent! dark:bg-transparent! border-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-0 focus-visible:border-0 focus:ring-0 focus:border-0 focus:outline-none flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-left min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name} />
                        <AvatarFallback className="rounded-lg bg-muted text-xs font-semibold text-foreground">
                          {session?.user?.name ? getInitials(session.user.name) : "VS"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 block size-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-[#1c1c1e]" />
                    </div>
                    <span className="truncate font-semibold text-foreground text-sm pl-1">
                      {session?.user?.name}
                    </span>
                  </div>
                  <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[var(--radix-popover-trigger-width)] min-w-[220px] p-0 overflow-hidden bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg shadow-md"
                align="start"
                sideOffset={4}
              >
                <div className="flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800/60 px-3 py-2">
                  <SearchIcon className="size-3.5 text-muted-foreground shrink-0" />
                  <input
                    value={commandSearch}
                    onChange={(e) => setCommandSearch(e.target.value)}
                    placeholder="Type a command..."
                    className="flex-1 bg-transparent border-0 outline-none text-xs placeholder:text-muted-foreground/60 text-foreground"
                  />
                </div>

                <ScrollArea className="h-[210px]">
                  <div className="p-1.5 space-y-1 pr-3">
                    <div className="space-y-1">
                      {/* General Group */}
                      <div className="px-2 py-0.5 text-[9px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
                        General
                      </div>
                      
                      {/* Account Button */}
                      {("account settings".includes(commandSearch.toLowerCase()) || "account".includes(commandSearch.toLowerCase())) && (
                        <button
                          onClick={() => {
                            setIsCommandOpen(false)
                            window.location.href = accountUrl
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                        >
                          <CircleUserRoundIcon className="size-3.5 text-muted-foreground" />
                          Account Settings
                        </button>
                      )}

                      {/* Theme Options */}
                      {("theme light dark system".includes(commandSearch.toLowerCase())) && (
                        <>
                          <button
                            onClick={() => {
                              setTheme("light")
                              setIsCommandOpen(false)
                              toast.success("Theme changed to Light")
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                          >
                            <SunIcon className="size-3.5 text-muted-foreground" />
                            Set Theme: Light
                          </button>
                          <button
                            onClick={() => {
                              setTheme("dark")
                              setIsCommandOpen(false)
                              toast.success("Theme changed to Dark")
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                          >
                            <MoonIcon className="size-3.5 text-muted-foreground" />
                            Set Theme: Dark
                          </button>
                          <button
                            onClick={() => {
                              setTheme("system")
                              setIsCommandOpen(false)
                              toast.success("Theme changed to System")
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                          >
                            <Laptop className="size-3.5 text-muted-foreground" />
                            Set Theme: System
                          </button>
                        </>
                      )}

                      {/* Notifications */}
                      {("notifications notice".includes(commandSearch.toLowerCase())) && (
                        <button
                          onClick={() => {
                            setIsCommandOpen(false)
                            toast.success("Notifications are up to date.")
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                        >
                          <BellIcon className="size-3.5 text-muted-foreground" />
                          Notifications
                        </button>
                      )}
                    </div>

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800/60 my-1.5" />

                    {/* Account Switcher Group */}
                    <div className="space-y-1">
                      <div className="px-2 py-0.5 text-[9px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
                        Accounts
                      </div>
                      
                      {("add account login switch".includes(commandSearch.toLowerCase())) && (
                        <button
                          onClick={() => {
                            setIsCommandOpen(false)
                            window.location.href = "/login"
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                        >
                          <Plus className="size-3.5 text-muted-foreground" />
                          Add Account
                        </button>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Quick Search Button */}
            <button
              onClick={() => {
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  code: "KeyK",
                  ctrlKey: true,
                  metaKey: true,
                  bubbles: true,
                  cancelable: true,
                })
                window.dispatchEvent(event)
                if (isMobile) {
                  setOpenMobile(false)
                }
              }}
              className="w-full h-9 flex items-center justify-between px-3 py-1.5 rounded-xl border border-border/80 bg-sidebar-foreground/5 hover:bg-sidebar-foreground/10 text-muted-foreground transition-all duration-150 text-xs cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-2.5">
                <SearchIcon className="size-4.5 shrink-0 text-muted-foreground/80" />
                <span className="text-muted-foreground/80 font-normal">Quick Search</span>
              </div>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-md border border-border bg-transparent dark:bg-transparent px-1.5 font-mono text-[9px] font-medium text-muted-foreground/60 shadow-none">
                <span>⌘</span><span>F</span>
              </kbd>
            </button>
            <div className="h-px bg-sidebar-border/60 w-full" />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
              <SidebarMenu>
                {/* File a Complaint button skeleton */}
                <SidebarMenuItem className="flex items-center gap-2 pointer-events-none">
                  <SidebarMenuButton className="min-w-8 bg-sidebar-foreground/5">
                    <Skeleton className="size-4 shrink-0 rounded bg-muted-foreground/20" />
                    <Skeleton className="h-4 w-28 rounded bg-muted-foreground/20" />
                  </SidebarMenuButton>
                  <div className="size-8 rounded-md bg-sidebar-foreground/5 flex items-center justify-center shrink-0">
                    <Skeleton className="size-4 rounded bg-muted-foreground/20" />
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarMenu className="space-y-1">
                {/* Menu items skeletons */}
                {[...Array(5)].map((_, i) => (
                  <SidebarMenuItem key={i} className="pointer-events-none">
                    <SidebarMenuButton>
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-4 shrink-0 rounded bg-muted-foreground/20" />
                        <Skeleton className={`h-4 rounded bg-muted-foreground/20 ${i % 2 === 0 ? 'w-24' : i % 3 === 0 ? 'w-20' : 'w-28'}`} />
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <NavMain items={navMain} />
            {!isAdmin && (
              <div className="px-3 py-2">
                <OnboardingAlert isTeacher={isTeacher} />
              </div>
            )}
          </>
        )}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="px-2 pt-0 pb-1.5">
        <div className="flex items-center justify-start gap-1 text-[10px] text-muted-foreground/80 font-normal w-full pl-1.5">
          <span>© {new Date().getFullYear()} VidyaSchool</span>
          <span>•</span>
          <a href="/terms" className="hover:text-foreground hover:underline transition-colors">Terms</a>
          <span>•</span>
          <a href="/privacy" className="hover:text-foreground hover:underline transition-colors">Privacy</a>
        </div>
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
              Scan the QR code below on your Android device to download and install the latest version ({appVersion}).
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-6 p-4 bg-white rounded-xl shadow-inner border border-muted/55">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(downloadUrl)}`} 
              alt="Download QR Code" 
              width={200}
              height={200}
              className="rounded-lg object-contain mx-auto"
            />
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <Button asChild variant="default" className="w-full gap-2">
              <a href={downloadUrl} download>
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
