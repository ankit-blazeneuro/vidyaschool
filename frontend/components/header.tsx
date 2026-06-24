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
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight text-foreground hover:opacity-90">
            <span className="font-semibold text-sm">Antigravity</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center flex-1 px-8">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              
              {/* Products Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Products
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem href="/products/app" title="Antigravity 2.0">
                      Parallel desktop application with chat canvas.
                    </ListItem>
                    <ListItem href="/products/ide" title="IDE">
                      Standalone AI-first development environment.
                    </ListItem>
                    <ListItem href="/products/cli" title="Terminal & CLI">
                      Manage agents and tasks from your command line.
                    </ListItem>
                    <ListItem href="/products/sdk" title="SDK">
                      Programmatic leasing and orchestration APIs.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Documentation Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Documentation
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem href="/docs/skills" title="Skills">
                      Specialized agent tools and capability packs.
                    </ListItem>
                    <ListItem href="/docs/rules" title="Rules">
                      Behavior policies and coding style compliance guides.
                    </ListItem>
                    <ListItem href="/docs/hooks" title="Hooks & Plugins">
                      Lifecycle extension scripts and event hooks.
                    </ListItem>
                    <ListItem href="/docs/sidecars" title="Sidecars">
                      Cron schedules and background helper services.
                    </ListItem>
                    <ListItem href="/docs/mcp" title="Model Context Protocol (MCP)">
                      Integrate external services and databases.
                    </ListItem>
                    <ListItem href="/docs/browser" title="Browser Control">
                      End-to-end testing and autonomous browser automation.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Direct Link: Permissions */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/docs/agent-permissions" className="text-foreground/80 hover:text-foreground text-sm font-medium">
                    Permissions
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Direct Link: Changelog */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/changelog" className="text-foreground/80 hover:text-foreground text-sm font-medium">
                    Changelog
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Direct Link: Support */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/support" className="text-foreground/80 hover:text-foreground text-sm font-medium">
                    Support
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
            <Link href="/login">
              Sign In
            </Link>
          </Button>
          <Button variant="default" asChild>
            <Link href="/console">
              Console
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
          
          {/* Products Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Products</div>
            <div className="grid gap-1">
              <Link href="/products/app" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Antigravity 2.0
              </Link>
              <Link href="/products/ide" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                IDE
              </Link>
              <Link href="/products/cli" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Terminal & CLI
              </Link>
              <Link href="/products/sdk" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                SDK
              </Link>
            </div>
          </div>

          {/* Documentation Panel */}
          <div>
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Documentation</div>
            <div className="grid gap-1">
              <Link href="/docs/skills" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Skills
              </Link>
              <Link href="/docs/rules" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Rules
              </Link>
              <Link href="/docs/hooks" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Hooks & Plugins
              </Link>
              <Link href="/docs/sidecars" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Sidecars
              </Link>
              <Link href="/docs/mcp" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                MCP
              </Link>
              <Link href="/docs/browser" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
                Browser Control
              </Link>
            </div>
          </div>

          {/* Direct Links Panel */}
          <div className="border-t border-border pt-3 space-y-1">
            <Link href="/docs/agent-permissions" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
              Permissions
            </Link>
            <Link href="/changelog" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
              Changelog
            </Link>
            <Link href="/support" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-md">
              Support
            </Link>
          </div>

          {/* Action Buttons Panel */}
          <div className="border-t border-border pt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" asChild className="w-full">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
            </Button>
            <Button variant="default" asChild className="w-full">
              <Link href="/console" onClick={() => setMobileMenuOpen(false)}>
                Console
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
