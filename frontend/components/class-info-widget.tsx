"use client"

import * as React from "react"
import { GraduationCapIcon, BookOpenIcon, UserIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ClassInfo {
  class: string | null
  section: string | null
  subjects: { subject: string; teacherName: string }[]
  classTeacher: string | null
}

export function ClassInfoWidget() {
  const [info, setInfo] = React.useState<ClassInfo | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/student/class-info")
      .then(r => r.json())
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="mx-4 lg:mx-6 rounded-2xl bg-zinc-100 dark:bg-[#121212] overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-base text-foreground flex items-center gap-2">
            <GraduationCapIcon className="h-4 w-4 text-primary" />
            My Class
          </h2>
          {loading ? (
            <Skeleton className="h-6 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          ) : info?.class ? (
            <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
              Class {info.class} – {info.section}
            </span>
          ) : null}
        </div>

        {/* Class Teacher */}
        <div className="mb-4 flex items-center gap-2.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-xl px-4 py-3">
          <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Class Teacher</span>
            {loading ? (
              <Skeleton className="h-4 w-32 rounded mt-0.5 bg-zinc-300 dark:bg-zinc-700" />
            ) : (
              <span className="text-sm font-medium text-foreground">{info?.classTeacher ?? "Not assigned"}</span>
            )}
          </div>
        </div>

        {/* Subjects */}
        <div className="flex items-center gap-1.5 mb-3">
          <BookOpenIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subjects</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
        ) : !info?.subjects?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">No subjects assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {info.subjects.map((s, i) => (
              <div
                key={i}
                className="flex flex-col gap-0.5 bg-white dark:bg-zinc-900/60 rounded-xl px-3.5 py-2.5 border border-zinc-200/60 dark:border-zinc-800/60"
              >
                <span className="text-sm font-semibold text-foreground leading-snug">{s.subject}</span>
                <span className="text-xs text-muted-foreground">{s.teacherName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
