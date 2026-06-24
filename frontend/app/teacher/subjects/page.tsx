"use client"

import * as React from "react"
import { 
  Users, 
  Calendar, 
  Award, 
  Clock, 
  ArrowRight, 
  Search,
  BookMarked
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface SubjectClass {
  code: string
  name: string
  gradeClass: string
  studentsCount: number
  schedule: string
  avgGrade: string
  color: string
}

const mockSubjects: SubjectClass[] = [
  { code: "MAT-101", name: "Mathematics", gradeClass: "Grade 10-A", studentsCount: 42, schedule: "Mon, Wed, Fri • 09:00 AM", avgGrade: "A-", color: "from-blue-500 to-indigo-600" },
  { code: "PHY-101", name: "Physics", gradeClass: "Grade 10-A", studentsCount: 42, schedule: "Tue, Thu • 10:30 AM", avgGrade: "B+", color: "from-cyan-500 to-blue-600" },
  { code: "CSE-101", name: "Computer Programming", gradeClass: "Grade 10-B", studentsCount: 38, schedule: "Mon, Wed • 01:30 PM", avgGrade: "A+", color: "from-pink-500 to-rose-600" },
  { code: "MAT-102", name: "Advanced Algebra", gradeClass: "Grade 11-A", studentsCount: 35, schedule: "Tue, Thu • 08:00 AM", avgGrade: "A", color: "from-indigo-500 to-purple-600" },
]

export default function SubjectClassPage() {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredSubjects = mockSubjects.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.gradeClass.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <BookMarked className="h-8 w-8 text-primary" />
            Subject Classes
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Review your assigned subjects, class schedules, enrolled student lists, and performance analytics.
          </p>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-6 lg:px-8">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
          <Input 
            type="text"
            placeholder="Search subject, code, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/40 text-xs"
          />
        </div>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 px-6 lg:px-8">
        {filteredSubjects.length > 0 ? (
          filteredSubjects.map((sub) => {
            return (
              <div key={sub.code} className="group relative rounded-2xl border border-border bg-card/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                {/* Top Colored Bar Accent */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${sub.color}`} />
                
                {/* Content */}
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-muted-foreground uppercase bg-muted px-2.5 py-1 rounded-md">{sub.code}</span>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <Award className="h-3.5 w-3.5 mr-0.5 animate-pulse" /> Avg: {sub.avgGrade}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">{sub.name}</h3>
                    <p className="text-xs text-muted-foreground font-semibold">{sub.gradeClass}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                      <span>{sub.studentsCount} Students Enrolled</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                      <span>{sub.schedule}</span>
                    </div>
                  </div>
                </div>

                {/* Footer action button */}
                <div className="px-6 pb-6 pt-0 mt-auto">
                  <Button variant="outline" className="w-full text-xs rounded-lg group/btn cursor-pointer" asChild>
                    <Link href={`/teacher/subjects/${sub.code.toLowerCase()}`}>
                      View Class Register
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full py-16 text-center text-muted-foreground text-sm border border-dashed border-border rounded-2xl bg-card/10">
            No subject classes matched your search query.
          </div>
        )}
      </div>
    </div>
  )
}
