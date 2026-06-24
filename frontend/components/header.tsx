"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Sun, Moon, Menu, X, Terminal, Monitor, Laptop, ChevronDown } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Theme Toggle Component (Standard Shadcn Style)
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-8 w-8 rounded-md bg-muted/20 border border-border" />
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="cursor-pointer"
      aria-label="Toggle theme"
    >
      <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
      <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
    </Button>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 transition-colors duration-200",
      isScrolled ? "border-b border-border" : "border-b border-transparent"
    )}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand/Logo */}
        <div className="flex items-center gap-6">
          <Link id="header-brand-logo" href="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight text-foreground hover:opacity-90">
            <span className="font-semibold text-sm">VidyaSchool</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center flex-1 px-8">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              
              {/* Portals Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Portals
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem href="/student" title="Student Portal">
                      Access your reports, marks, academic fees, and announcements.
                    </ListItem>
                    <ListItem href="/teacher" title="Teacher Portal">
                      Manage class registers, students, and post notices.
                    </ListItem>
                    <ListItem href="/student/library" title="Library Catalog">
                      Search library books, view reservations, and issue status.
                    </ListItem>
                    <ListItem href="/student/fees" title="Fees Portal">
                      View details of student tuition, fees structures, and history.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Academics Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Academics & Life
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem href="/student/notice" title="Circulars & Notices">
                      Latest announcements and circulars for students and parents.
                    </ListItem>
                    <ListItem href="/student/marks" title="Curriculum & Exams">
                      Exams, syllabus outlines, and student assessment schemes.
                    </ListItem>
                    <ListItem href="/docs/admissions" title="Admissions Guide">
                      Enrollment instructions, registration forms, and policy guides.
                    </ListItem>
                    <ListItem href="/docs/co-curriculars" title="Co-Curricular Activities">
                      Indian performing arts, choral singing, music, and robotics.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Direct Links */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/student/notice" className="text-foreground/80 hover:text-foreground text-sm font-medium">
                    Notices
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/support" className="text-foreground/80 hover:text-foreground text-sm font-medium">
                    Help & Support
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Controls */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link id="header-student-portal-btn" href="/student">
              Student Portal
            </Link>
          </Button>
          <Button variant="default" asChild>
            <Link id="header-teacher-portal-btn" href="/teacher">
              Teacher Portal
            </Link>
          </Button>
        </div>

        {/* Mobile Hamburg Trigger & Controls */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

      </div>

      {/* Mobile Drawer Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-4">
          
          {/* Portals Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Portals</div>
            <div className="grid gap-1">
              <Link href="/student" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Student Portal
              </Link>
              <Link href="/teacher" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Teacher Portal
              </Link>
              <Link href="/student/library" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Library Catalog
              </Link>
              <Link href="/student/fees" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Fees Portal
              </Link>
            </div>
          </div>

          {/* Academics & Life Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Academics & Life</div>
            <div className="grid gap-1">
              <Link href="/student/notice" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Circulars & Notices
              </Link>
              <Link href="/student/marks" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Curriculum & Exams
              </Link>
              <Link href="/docs/admissions" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Admissions Guide
              </Link>
              <Link href="/docs/co-curriculars" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Co-Curricular Activities
              </Link>
            </div>
          </div>

          {/* Direct Links Panel */}
          <div className="border-t border-border pt-3 space-y-1">
            <Link href="/student/notice" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
              Notices
            </Link>
            <Link href="/support" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
              Help & Support
            </Link>
          </div>

          {/* Action Buttons Panel */}
          <div className="border-t border-border pt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" asChild className="w-full">
              <Link href="/student" onClick={() => setMobileMenuOpen(false)}>
                Student Portal
              </Link>
            </Button>
            <Button variant="default" asChild className="w-full">
              <Link href="/teacher" onClick={() => setMobileMenuOpen(false)}>
                Teacher Portal
              </Link>
            </Button>
          </div>

        </div>
      )}
    </header>
  )
}

interface ListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  title: string
}

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, title, children, href, ...props }, ref) => {
    return (
      <li className="list-none">
        <NavigationMenuLink asChild>
          <Link
            href={href || "/"}
            ref={ref}
            className={cn(
              "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none text-foreground">{title}</div>
            <p className="line-clamp-2 text-xs leading-normal text-muted-foreground mt-1">
              {children}
            </p>
          </Link>
        </NavigationMenuLink>
      </li>
    )
  }
)
ListItem.displayName = "ListItem"
