"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface PageHeaderProps {
  title: string
  onToggleSidebar?: () => void
  actions?: React.ReactNode
}

export function PageHeader({ title, onToggleSidebar, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
