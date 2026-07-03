"use client"

import * as React from "react"
import { 
  GitPullRequest, 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  RefreshCw, 
  X,
  User,
  BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatDate } from "@/lib/date-formatter"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface Borrowing {
  id: string
  bookId: string
  userId: string
  issueDate: string
  dueDate: string
  returnDate: string | null
  renewalsCount: number
  status: "active" | "overdue" | "returned"
  bookTitle: string
  bookAuthor: string
  bookIsbn: string
  studentName: string
  studentEmail: string
  studentUsername: string | null
  studentClass: string | null
  studentSection: string | null
}

interface AvailableBook {
  id: string
  title: string
  author: string
  isbn: string
  availableQuantity: number
}

export default function LibrarianBorrowingsPage() {
  const [borrowings, setBorrowings] = React.useState<Borrowing[]>([])
  const [availableBooks, setAvailableBooks] = React.useState<AvailableBook[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "overdue" | "returned">("all")

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [studentIdentifier, setStudentIdentifier] = React.useState("")
  const [resolvedUser, setResolvedUser] = React.useState<any>(null)
  const [selectedBookId, setSelectedBookId] = React.useState("")
  const [bookSearchQuery, setBookSearchQuery] = React.useState("")
  const [showBookRecommendations, setShowBookRecommendations] = React.useState(false)
  const [dueDate, setDueDate] = React.useState<Date | undefined>(undefined)
  const [isSaving, setIsSaving] = React.useState(false)

  // Actions states
  const [isActionProcessing, setIsActionProcessing] = React.useState<string | null>(null)

  // Debounce hook to resolve student name or teacher name based on username/email
  React.useEffect(() => {
    if (!studentIdentifier.trim()) {
      setResolvedUser(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/backend/api/librarian/resolve-user?q=${encodeURIComponent(studentIdentifier)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.found) {
            setResolvedUser(data.user)
          } else {
            setResolvedUser(null)
          }
        }
      } catch (err) {}
    }, 300)
    return () => clearTimeout(timer)
  }, [studentIdentifier])

  // Filter available books based on search query
  const bookRecommendations = React.useMemo(() => {
    if (!bookSearchQuery.trim()) return availableBooks
    return availableBooks.filter(book => 
      book.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(bookSearchQuery.toLowerCase())
    )
  }, [bookSearchQuery, availableBooks])

  const fetchBorrowings = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/backend/api/librarian/borrowings")
      if (!res.ok) throw new Error("Failed to fetch borrowings")
      const data = await res.json()
      setBorrowings(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load borrowings")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAvailableBooks = async () => {
    try {
      const res = await fetch("/api/backend/api/librarian/books")
      if (res.ok) {
        const data = await res.json()
        // Filter for books with available stock
        setAvailableBooks(data.filter((b: any) => b.availableQuantity > 0))
      }
    } catch (err) {}
  }

  React.useEffect(() => {
    fetchBorrowings()
  }, [fetchBorrowings])

  const handleOpenIssueModal = () => {
    setStudentIdentifier("")
    setResolvedUser(null)
    setSelectedBookId("")
    setBookSearchQuery("")
    setShowBookRecommendations(false)
    
    // Default due date: 14 days from today
    const fourteenDaysLater = new Date()
    fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14)
    setDueDate(fourteenDaysLater)
    
    fetchAvailableBooks()
    setIsFormOpen(true)
  }

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentIdentifier.trim() || !selectedBookId || !dueDate) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/backend/api/librarian/borrowings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIdentifier: studentIdentifier.trim(),
          bookId: selectedBookId,
          dueDate: dueDate.toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to issue book")

      toast.success("Book issued successfully to student")
      setIsFormOpen(false)
      fetchBorrowings()
    } catch (err: any) {
      toast.error(err.message || "Failed to issue book")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReturn = async (id: string, title: string) => {
    if (!confirm(`Confirm return for "${title}"?`)) return
    
    setIsActionProcessing(id)
    try {
      const res = await fetch("/api/backend/api/librarian/borrowings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "return" }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to return book")

      toast.success(`Book "${title}" marked as returned`)
      fetchBorrowings()
    } catch (err: any) {
      toast.error(err.message || "Failed to complete return")
    } finally {
      setIsActionProcessing(null)
    }
  }

  const handleRenew = async (id: string, title: string) => {
    if (!confirm(`Extend borrowing for "${title}" by 14 days?`)) return

    setIsActionProcessing(id)
    try {
      const res = await fetch("/api/backend/api/librarian/borrowings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "renew" }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to renew book")

      toast.success(`Book "${title}" renewed successfully`)
      fetchBorrowings()
    } catch (err: any) {
      toast.error(err.message || "Failed to renew book")
    } finally {
      setIsActionProcessing(null)
    }
  }

  const filteredBorrowings = borrowings.filter((tx) => {
    const matchesSearch =
      tx.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.bookIsbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.studentUsername && tx.studentUsername.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || tx.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculations
  const activeCount = borrowings.filter((b) => b.status === "active").length
  const overdueCount = borrowings.filter((b) => b.status === "overdue").length
  const returnedCount = borrowings.filter((b) => b.status === "returned").length

  return (
    <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <GitPullRequest className="h-8 w-8 text-primary" />
            Book Loan Administration
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Coordinate student requests, issue new library holdings, process returns, and manage renewal limits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchBorrowings}
            variant="outline"
            size="sm"
            className="rounded-lg cursor-pointer flex items-center gap-1.5"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleOpenIssueModal} 
            className="rounded-lg cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Issue Book
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3 px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Loans</p>
            <h3 className="text-2xl font-bold text-foreground">{activeCount} Issue(s)</h3>
            <p className="text-[10px] text-muted-foreground">Borrowed within timeline</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue Returns</p>
            <h3 className="text-2xl font-bold text-foreground">{overdueCount} Book(s)</h3>
            <p className="text-[10px] text-muted-foreground">Pending return timeline</p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${overdueCount > 0 ? "bg-amber-500/10 text-amber-500 animate-pulse" : "bg-muted text-muted-foreground"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Handled</p>
            <h3 className="text-2xl font-bold text-foreground">{borrowings.length} Transaction(s)</h3>
            <p className="text-[10px] text-muted-foreground">Historical checkout events</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
          <Input 
            type="text"
            placeholder="Search by student name, book title, ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9.5 rounded-lg border-border focus:ring-1 focus:ring-primary w-full bg-card/40 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted/40 border border-border/40 rounded-lg self-start">
          {(["all", "active", "overdue", "returned"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all cursor-pointer ${statusFilter === tab ? "bg-card text-foreground shadow-xs border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-foreground">Student</TableHead>
                <TableHead className="font-semibold text-foreground">Book Checked Out</TableHead>
                <TableHead className="font-semibold text-foreground">Issue Date</TableHead>
                <TableHead className="font-semibold text-foreground">Due Date</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 text-muted-foreground text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Spinner size="lg" />
                      <span className="font-semibold text-xs text-muted-foreground mt-2">Loading transactions logs...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBorrowings.length > 0 ? (
                filteredBorrowings.map((tx) => {
                  const isActive = tx.status === "active"
                  const isOverdue = tx.status === "overdue"
                  const isReturned = tx.status === "returned"

                  return (
                    <TableRow key={tx.id} className="hover:bg-muted/10 transition-colors">
                      {/* Student Profile Info */}
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-xs">{tx.studentName}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            {tx.studentClass ? `Class ${tx.studentClass}-${tx.studentSection || "All"}` : tx.studentEmail}
                          </span>
                        </div>
                      </TableCell>

                      {/* Book Details */}
                      <TableCell className="py-3">
                        <div className="flex flex-col max-w-[220px]">
                          <span className="font-bold text-foreground text-xs truncate">{tx.bookTitle}</span>
                          <span className="text-[10px] font-mono text-muted-foreground mt-0.5">{tx.bookIsbn}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(tx.issueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>

                      <TableCell className="text-xs font-semibold">
                        {isReturned ? (
                          <span className="text-muted-foreground/60 font-medium">Returned</span>
                        ) : (
                          <span className={isOverdue ? "text-red-500 font-bold" : "text-foreground"}>
                            {new Date(tx.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Clock className="h-3 w-3" /> Active
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 animate-pulse">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </span>
                        )}
                        {isReturned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Returned
                          </span>
                        )}
                      </TableCell>

                      {/* Operations */}
                      <TableCell className="text-right">
                        {isReturned ? (
                          <span className="text-[10px] text-muted-foreground/50 pr-4">
                            Closed on {new Date(tx.returnDate!).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                          </span>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleRenew(tx.id, tx.bookTitle)}
                              disabled={isActionProcessing !== null}
                              className="text-[11px] h-8 font-semibold inline-flex items-center gap-1 rounded-lg hover:bg-muted cursor-pointer"
                            >
                              <RotateCcw className="h-3 w-3" /> Renew ({tx.renewalsCount})
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleReturn(tx.id, tx.bookTitle)}
                              disabled={isActionProcessing !== null}
                              className="text-[11px] h-8 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-0.5" /> Return
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border">
                    No borrowing transactions match the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Issue Book Dialog Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFormOpen(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Issue Book Transaction
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Assign a book checkout event to a registered student.
                  </p>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-full hover:bg-muted p-1 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleIssueBook} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="student-id" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    Student/Teacher Username or Email *
                  </label>
                  <Input
                    id="student-id"
                    type="text"
                    placeholder="e.g. arjun_mehta or arjun@example.com"
                    value={studentIdentifier}
                    onChange={(e) => setStudentIdentifier(e.target.value)}
                    className="h-10 rounded-lg border-border bg-card/60 text-xs"
                    required
                  />
                  {resolvedUser && (
                    <div className="mt-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Confirmed: {resolvedUser.name} ({resolvedUser.role === 'student' ? 'Student' : resolvedUser.role === 'teacher' ? 'Teacher' : resolvedUser.role})
                    </div>
                  )}
                  {!resolvedUser && studentIdentifier.trim() && (
                    <div className="mt-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
                      No registered user found with this username/email.
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex flex-col relative">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    Select Available Book *
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                    <Input
                      type="text"
                      placeholder="Type to search book title, author, or ISBN..."
                      value={bookSearchQuery}
                      onChange={(e) => {
                        setBookSearchQuery(e.target.value)
                        setShowBookRecommendations(true)
                        if (selectedBookId) setSelectedBookId("")
                      }}
                      onFocus={() => setShowBookRecommendations(true)}
                      onBlur={() => {
                        // Small timeout to allow mouse down on list items
                        setTimeout(() => setShowBookRecommendations(false), 200)
                      }}
                      className="pl-9 pr-8 h-10 rounded-lg border-border bg-card/60 text-xs w-full"
                      required
                    />
                    {selectedBookId && (
                      <div className="absolute right-3 top-2.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      </div>
                    )}
                  </div>

                  {/* Recommendations Dropdown */}
                  {showBookRecommendations && (
                    <div className="absolute z-50 left-0 right-0 top-16 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg divide-y divide-border/60">
                      {bookRecommendations.length > 0 ? (
                        bookRecommendations.map((book) => (
                          <button
                            key={book.id}
                            type="button"
                            onMouseDown={() => {
                              setSelectedBookId(book.id)
                              setBookSearchQuery(`${book.title} (by ${book.author}) - ISBN: ${book.isbn}`)
                              setShowBookRecommendations(false)
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted transition-colors flex flex-col gap-0.5 cursor-pointer"
                          >
                            <span className="font-bold text-foreground">{book.title}</span>
                            <span className="text-[10px] text-muted-foreground">
                              by {book.author} • ISBN: {book.isbn} • {book.availableQuantity} available
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                          No matching available books in stock
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label htmlFor="due-date" className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                    <CalendarIcon className="h-3.5 w-3.5" /> Due Date *
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left h-10 rounded-lg border-border bg-card/60 text-xs font-normal cursor-pointer",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground/75" />
                        {dueDate ? formatDate(dueDate) : <span>Pick a due date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-border mt-6">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                    disabled={isSaving}
                    className="flex-1 rounded-lg border-border hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Issue Book</span>
                    {isSaving && (
                      <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
