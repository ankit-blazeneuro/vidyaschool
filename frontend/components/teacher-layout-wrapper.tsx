"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { TeacherAIInput } from "@/components/teacher-ai-input"

export function TeacherLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChatPage = pathname?.includes("/tasks/")

  return (
    <div className={`flex flex-1 flex-col relative ${isChatPage ? "pb-0" : "pb-20"}`}>
      <div className="@container/main flex flex-1 flex-col gap-2">
        {children}
      </div>
      <TeacherAIInput />
    </div>
  )
}
