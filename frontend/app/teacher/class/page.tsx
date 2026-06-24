"use client"

import * as React from "react"
import { 
  Users, 
  Search, 
  Mail, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Student {
  id: string
  name: string
  email: string
  attendance: string
  gpa: number
  performance: "improving" | "stable" | "declining"
  status: "Excellent" | "Good" | "Needs Attention"
}

const mockStudents: Student[] = [
  { id: "STU-2026-01", name: "Aarav Mehta", email: "aarav.mehta@vidya.edu", attendance: "98.2%", gpa: 9.4, performance: "improving", status: "Excellent" },
  { id: "STU-2026-02", name: "Ananya Sen", email: "ananya.sen@vidya.edu", attendance: "94.5%", gpa: 8.8, performance: "stable", status: "Good" },
  { id: "STU-2026-03", name: "Kabir Joshi", email: "kabir.joshi@vidya.edu", attendance: "82.1%", gpa: 6.2, performance: "declining", status: "Needs Attention" },
  { id: "STU-2026-04", name: "Meera Nair", email: "meera.nair@vidya.edu", attendance: "96.8%", gpa: 9.1, performance: "improving", status: "Excellent" },
  { id: "STU-2026-05", name: "Rohan Verma", email: "rohan.verma@vidya.edu", attendance: "89.4%", gpa: 7.5, performance: "stable", status: "Good" },
  { id: "STU-2026-06", name: "Sneha Rao", email: "sneha.rao@vidya.edu", attendance: "95.0%", gpa: 8.9, performance: "improving", status: "Excellent" },
  { id: "STU-2026-07", name: "Vihaan Gupta", email: "vihaan.gupta@vidya.edu", attendance: "78.5%", gpa: 5.8, performance: "declining", status: "Needs Attention" },
]

export default function MyClassPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("All")

  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = statusFilter === "All" || student.status === statusFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            My Class: Grade 10-A
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Manage your classroom roster, track student engagement, grade standing, and daily attendance records.
          </p>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 lg:px-8">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
          <Input 
            type="text"
            placeholder="Search student name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/40 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Button 
            variant={statusFilter === "All" ? "default" : "outline"}
            onClick={() => setStatusFilter("All")}
            size="sm"
            className="text-xs rounded-lg cursor-pointer shrink-0"
          >
            All
          </Button>
          <Button 
            variant={statusFilter === "Excellent" ? "default" : "outline"}
            onClick={() => setStatusFilter("Excellent")}
            size="sm"
            className="text-xs rounded-lg cursor-pointer shrink-0"
          >
            Excellent
          </Button>
          <Button 
            variant={statusFilter === "Good" ? "default" : "outline"}
            onClick={() => setStatusFilter("Good")}
            size="sm"
            className="text-xs rounded-lg cursor-pointer shrink-0"
          >
            Good
          </Button>
          <Button 
            variant={statusFilter === "Needs Attention" ? "default" : "outline"}
            onClick={() => setStatusFilter("Needs Attention")}
            size="sm"
            className="text-xs rounded-lg cursor-pointer shrink-0"
          >
            Needs Attention
          </Button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-foreground">Student ID</TableHead>
                <TableHead className="font-semibold text-foreground">Name</TableHead>
                <TableHead className="font-semibold text-foreground">Email</TableHead>
                <TableHead className="font-semibold text-foreground">Attendance</TableHead>
                <TableHead className="font-semibold text-foreground">GPA</TableHead>
                <TableHead className="font-semibold text-foreground">Trend</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  return (
                    <TableRow key={student.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{student.id}</TableCell>
                      <TableCell className="font-bold text-foreground">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{student.email}</TableCell>
                      <TableCell className="text-foreground text-sm font-semibold">{student.attendance}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">{student.gpa} / 10</TableCell>
                      <TableCell>
                        {student.performance === "improving" && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <TrendingUp className="h-3.5 w-3.5" /> Improving
                          </span>
                        )}
                        {student.performance === "stable" && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            Stable
                          </span>
                        )}
                        {student.performance === "declining" && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                            <TrendingDown className="h-3.5 w-3.5" /> Declining
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.status === "Excellent" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Excellent
                          </span>
                        )}
                        {student.status === "Good" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                            Good
                          </span>
                        )}
                        {student.status === "Needs Attention" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                            Needs Attention
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md cursor-pointer" aria-label="Email Student">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md cursor-pointer" aria-label="Message Parent">
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                    No students matched "{searchQuery}".
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
