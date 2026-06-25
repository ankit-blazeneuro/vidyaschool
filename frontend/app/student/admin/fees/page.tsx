"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react"
import { RoleGuard } from "@/components/role-guard"
import { useSession } from "@/lib/auth-client"
import StudentFeesPage from "../../[username]/fees/page"
import { 
  UsersIcon, 
  SearchIcon, 
  PlusIcon, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  CalendarIcon, 
  ChevronRightIcon, 
  FilterIcon, 
  Settings2Icon,
  CircleDollarSign,
  Clock,
  Printer,
  X,
  Loader2Icon,
  InfoIcon,
  LayersIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const BACKEND_URL = "/api/backend"

function AdminFeesContent() {
  const [students, setStudents] = React.useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = React.useState<any>(null)
  const [installments, setInstallments] = React.useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = React.useState(true)
  const [loadingInstallments, setLoadingInstallments] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [classFilter, setClassFilter] = React.useState("")
  const [sectionFilter, setSectionFilter] = React.useState("")
  const [error, setError] = React.useState("")
  const [successMsg, setSuccessMsg] = React.useState("")

  // Form states for Single Invoice
  const [singleMonth, setSingleMonth] = React.useState("January")
  const [singleYear, setSingleYear] = React.useState("2026")
  const [singleAmount, setSingleAmount] = React.useState("5000")
  const [singleDueDate, setSingleDueDate] = React.useState("")

  // Form states for Bulk Invoice
  const [bulkClass, setBulkClass] = React.useState("")
  const [bulkSection, setBulkSection] = React.useState("")
  const [bulkMonth, setBulkMonth] = React.useState("January")
  const [bulkYear, setBulkYear] = React.useState("2026")
  const [bulkAmount, setBulkAmount] = React.useState("5000")
  const [bulkDueDate, setBulkDueDate] = React.useState("")
  const [isCreatingBulk, setIsCreatingBulk] = React.useState(false)

  const fetchStudents = async () => {
    setLoadingStudents(true)
    setError("")
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/students`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      })
      if (!res.ok) {
        throw new Error("Failed to fetch students from backend server")
      }
      const data = await res.json()
      setStudents(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingStudents(false)
    }
  }

  React.useEffect(() => {
    fetchStudents()
  }, [])

  const fetchInstallments = async (student: any) => {
    setLoadingInstallments(true)
    setError("")
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/fees/${student.id}`, {
        credentials: "include"
      })
      if (!res.ok) {
        throw new Error("Failed to fetch installments")
      }
      const data = await res.json()
      setInstallments(data)
      setSelectedStudent(student)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingInstallments(false)
    }
  }

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
    setError("")
    setSuccessMsg("")

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          student_id: selectedStudent.id,
          month: singleMonth,
          year: singleYear,
          amount: parseInt(singleAmount),
          due_date: singleDueDate,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Failed to create invoice")
      }

      setSuccessMsg("Fee invoice created successfully!")
      fetchInstallments(selectedStudent)
      fetchStudents()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCreateBulk = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMsg("")
    setIsCreatingBulk(true)

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          student_class: bulkClass || null,
          student_section: bulkSection || null,
          month: bulkMonth,
          year: bulkYear,
          amount: parseInt(bulkAmount),
          due_date: bulkDueDate,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Failed to generate bulk invoices")
      }

      setSuccessMsg(`Bulk fee generation complete! Created ${data.created_count} invoices.`)
      if (selectedStudent) {
        fetchInstallments(selectedStudent)
      }
      fetchStudents()
      // reset form
      setBulkClass("")
      setBulkSection("")
      setBulkDueDate("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsCreatingBulk(false)
    }
  }

  const handleUpdateStatus = async (instId: string, status: string) => {
    setError("")
    setSuccessMsg("")
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/fees/${instId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || "Failed to update status")
      }

      setSuccessMsg(`Installment updated to ${status}!`)
      if (selectedStudent) {
        fetchInstallments(selectedStudent)
      }
      fetchStudents()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.admission_number && s.admission_number.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesClass = !classFilter || s.class === classFilter
    const matchesSection = !sectionFilter || s.section === sectionFilter
    return matchesSearch && matchesClass && matchesSection
  })

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Administrative Fees</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage billing schedules and verify student invoice records.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm rounded-lg bg-destructive/15 text-destructive font-medium border border-destructive/25 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 text-sm rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left side: Students Search & List */}
        <Card className="lg:col-span-4 h-[750px] flex flex-col">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-primary" />
              <span>Student Directory</span>
            </CardTitle>
            <CardDescription>Select a student to inspect invoices</CardDescription>
            <div className="space-y-2 mt-3">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, admission #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-background text-xs px-2"
                >
                  <option value="">All Classes</option>
                  {["Nursery", "KG", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString())].map(c => (
                    <option key={c} value={c}>{c === "Nursery" || c === "KG" ? c : `Class ${c}`}</option>
                  ))}
                </select>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-background text-xs px-2"
                >
                  <option value="">All Sections</option>
                  {["A", "B", "C", "D", "E", "F"].map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {loadingStudents ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading directory...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <InfoIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <span className="text-sm font-medium text-muted-foreground">No students found</span>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudent?.id === student.id
                  return (
                    <button
                      key={student.id}
                      onClick={() => fetchInstallments(student)}
                      className={`w-full text-left p-3.5 flex items-center justify-between transition-colors hover:bg-muted/30 ${
                        isSelected ? "bg-primary/5 hover:bg-primary/5 border-l-4 border-primary" : ""
                      }`}
                    >
                      <div className="space-y-0.5 max-w-[80%]">
                        <p className="font-semibold text-sm truncate">{student.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{student.email}</p>
                        <p className="text-[10px] text-primary/80 font-medium">
                          {student.class ? (student.class === "Nursery" || student.class === "KG" ? student.class : `Class ${student.class}`) : "No Class"} 
                          {student.section ? ` - ${student.section}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {student.outstanding_dues_count > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                            {student.outstanding_dues_count} Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                            Cleared
                          </span>
                        )}
                        <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right side: Detailed invoices & Actions */}
        <div className="lg:col-span-8 space-y-6">
          {selectedStudent ? (
            <>
              {/* Detailed Invoice Listing */}
              <Card>
                <CardHeader className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <CircleDollarSign className="h-5 w-5 text-primary" />
                      <span>Invoices for {selectedStudent.name}</span>
                    </CardTitle>
                    <CardDescription>
                      Admission Number: {selectedStudent.admission_number || "N/A"} | Outstanding dues to clear
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {loadingInstallments ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Retrieving audit schedule...</span>
                    </div>
                  ) : installments.length === 0 ? (
                    <div className="text-center py-12">
                      <InfoIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">No invoices assigned to this student</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border/60 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="font-semibold text-foreground">Billing Period</TableHead>
                            <TableHead className="font-semibold text-foreground">Amount</TableHead>
                            <TableHead className="font-semibold text-foreground">Due Date</TableHead>
                            <TableHead className="font-semibold text-foreground">Status</TableHead>
                            <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {installments.map((inst) => {
                            const isPaid = inst.status === "paid"
                            const isPending = inst.status === "pending"
                            const isOverdue = inst.status === "overdue"
                            const isUpcoming = inst.status === "upcoming"

                            return (
                              <TableRow key={inst.id} className="hover:bg-muted/5 transition-colors">
                                <TableCell className="font-bold text-foreground">
                                  {inst.month} {inst.year}
                                </TableCell>
                                <TableCell className="font-semibold">₹{inst.amount.toLocaleString("en-IN")}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(inst.due_date).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric"
                                  })}
                                </TableCell>
                                <TableCell>
                                  {isPaid && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                      Paid
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                      Pending
                                    </span>
                                  )}
                                  {isOverdue && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                                      Overdue
                                    </span>
                                  )}
                                  {isUpcoming && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                      Upcoming
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isPaid ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateStatus(inst.id, "pending")}
                                        className="text-xs h-7 px-2 border-border hover:bg-muted text-amber-600 dark:text-amber-400"
                                      >
                                        Revert Pending
                                      </Button>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleUpdateStatus(inst.id, "paid")}
                                          className="text-xs h-7 px-2 bg-emerald-600 hover:bg-emerald-650 text-white"
                                        >
                                          Mark Paid
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleUpdateStatus(inst.id, "overdue")}
                                          className="text-xs h-7 px-2 border-border hover:bg-muted text-destructive"
                                        >
                                          Overdue
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Create Single Invoice Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <PlusIcon className="h-4 w-4 text-primary" />
                    <span>Create Single Invoice</span>
                  </CardTitle>
                  <CardDescription>Assign an individual fee installment to {selectedStudent.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateSingle} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Month</Label>
                      <select
                        value={singleMonth}
                        onChange={(e) => setSingleMonth(e.target.value)}
                        className="h-9 w-full rounded-lg border border-input bg-background text-sm px-3"
                      >
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <select
                        value={singleYear}
                        onChange={(e) => setSingleYear(e.target.value)}
                        className="h-9 w-full rounded-lg border border-input bg-background text-sm px-3"
                      >
                        {["2025", "2026", "2027", "2028"].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (₹)</Label>
                      <Input
                        type="number"
                        value={singleAmount}
                        onChange={(e) => setSingleAmount(e.target.value)}
                        className="h-9"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={singleDueDate}
                        onChange={(e) => setSingleDueDate(e.target.value)}
                        className="h-9"
                        required
                      />
                    </div>
                    <div className="md:col-span-4 flex justify-end pt-2">
                      <Button type="submit" className="font-semibold">
                        Generate Invoice
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-[250px] flex items-center justify-center text-center">
              <CardContent className="space-y-2">
                <UsersIcon className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <h3 className="font-bold text-muted-foreground">Select a Student</h3>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Choose a student from the directory on the left to inspect invoices, record payments, and manage individual fee schedules.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Bulk Generation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <LayersIcon className="h-4 w-4 text-primary" />
                <span>Bulk Invoice Generation</span>
              </CardTitle>
              <CardDescription>Generate tuition installments for an entire Class or Section simultaneously</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBulk} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Target Class (Optional)</Label>
                    <select
                      value={bulkClass}
                      onChange={(e) => setBulkClass(e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-background text-sm px-3"
                    >
                      <option value="">All Classes</option>
                      {["Nursery", "KG", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString())].map(c => (
                        <option key={c} value={c}>{c === "Nursery" || c === "KG" ? c : `Class ${c}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Section (Optional)</Label>
                    <select
                      value={bulkSection}
                      onChange={(e) => setBulkSection(e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-background text-sm px-3"
                    >
                      <option value="">All Sections</option>
                      {["A", "B", "C", "D", "E", "F"].map(s => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <select
                      value={bulkMonth}
                      onChange={(e) => setBulkMonth(e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-background text-sm px-3"
                    >
                      {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <select
                      value={bulkYear}
                      onChange={(e) => setBulkYear(e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-background text-sm px-3"
                    >
                      {["2025", "2026", "2027", "2028"].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input
                      type="number"
                      value={bulkAmount}
                      onChange={(e) => setBulkAmount(e.target.value)}
                      className="h-9"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={bulkDueDate}
                      onChange={(e) => setBulkDueDate(e.target.value)}
                      className="h-9"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isCreatingBulk} className="font-semibold bg-primary hover:bg-primary/95 flex items-center gap-1.5">
                    {isCreatingBulk && <Loader2Icon className="h-4 w-4 animate-spin" />}
                    Generate Bulk Invoices
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  )
}

export default function AdminFeesPage() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2Icon className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">Loading session...</span>
      </div>
    )
  }

  if (session?.user?.role === "student") {
    return <StudentFeesPage />
  }

  return (
    <RoleGuard allowedRoles={["admin", "account"]} fallback={
      <div className="p-8 flex items-center justify-center text-center h-[500px]">
        <div className="space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <h3 className="font-bold text-lg">Unauthorized Access</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Only system administrators and members of the accounts department have permission to view or modify school billing schedules.
          </p>
        </div>
      </div>
    }>
      <AdminFeesContent />
    </RoleGuard>
  )
}
