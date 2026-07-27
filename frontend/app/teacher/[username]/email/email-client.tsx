"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  GripVertical,
  Loader2,
  Mail,
  MailOpen,
  MoreVertical,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export const emailSchema = z.object({
  id: z.string(),
  folder: z.string(),
  fromAddress: z.string(),
  toAddress: z.string(),
  ccAddress: z.string().nullable().optional(),
  subject: z.string(),
  bodyHtml: z.string().nullable().optional(),
  bodyText: z.string(),
  isRead: z.boolean(),
  isStarred: z.boolean(),
  createdAt: z.string(),
})

export type Email = z.infer<typeof emailSchema>
type Folder = "inbox" | "sent" | "starred" | "trash"

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function getSenderDisplay(from: string) {
  if (from.includes("<")) {
    return from.match(/^(.+?)\s*</)?.[1]?.replace(/"/g, "") || from
  }
  return from
}

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

function DraggableRow({
  row,
  onSelectRow,
}: {
  row: Row<Email>
  onSelectRow: (email: Email) => void
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  const email = row.original

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className={cn(
        "relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 transition-colors hover:bg-muted/40",
        !email.isRead && "bg-rose-500/[0.03] font-medium"
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      onClick={() => onSelectRow(email)}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="py-2.5">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

function TableCellViewer({
  item,
  onSelect,
  onReply,
  onToggleStar,
  onDelete,
}: {
  item: Email
  onSelect?: () => void
  onReply?: (email: Email) => void
  onToggleStar?: (id: string, currentStarred: boolean, e?: React.MouseEvent) => void
  onDelete?: (id: string) => void
}) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="w-fit px-0 text-left text-foreground hover:no-underline flex flex-col items-start min-w-0"
          onClick={(e) => {
            e.stopPropagation()
            if (onSelect) onSelect()
          }}
        >
          <span
            className={cn(
              "text-xs truncate max-w-[280px] sm:max-w-[380px] block font-semibold text-foreground",
              !item.isRead && "font-bold text-foreground"
            )}
          >
            {item.subject || "(no subject)"}
          </span>
          <span className="text-[11px] text-muted-foreground truncate max-w-[280px] sm:max-w-[380px] block font-normal">
            {item.bodyText?.slice(0, 80) || "—"}
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className={cn(isMobile ? "max-h-[85vh]" : "sm:max-w-xl sm:h-full")}>
        <DrawerHeader className="gap-1 border-b pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="capitalize text-[10px]">
              {item.folder}
            </Badge>
            {!item.isRead ? (
              <Badge className="bg-rose-500 text-white text-[10px]">
                Unread
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                Read
              </Badge>
            )}
            {item.isStarred && (
              <Badge variant="secondary" className="text-amber-500 border-amber-200 text-[10px] gap-1">
                <Star className="size-3 fill-amber-500" /> Starred
              </Badge>
            )}
          </div>
          <DrawerTitle className="text-lg font-bold leading-tight">
            {item.subject || "(no subject)"}
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
            Received {format(new Date(item.createdAt), "PPP 'at' p")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto p-4 text-sm flex-1">
          {/* Sender & Recipient info box */}
          <div className="rounded-lg border p-3 bg-muted/20 space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                  {getInitials(getSenderDisplay(item.fromAddress))}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs text-foreground truncate">
                  {item.fromAddress}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  To: {item.toAddress} {item.ccAddress ? `| CC: ${item.ccAddress}` : ""}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Email Content */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Message Content
            </Label>
            <div className="rounded-lg border p-4 bg-card min-h-[180px] overflow-auto">
              {item.bodyHtml ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
                />
              ) : item.bodyText ? (
                <p className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-sans">
                  {item.bodyText}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">No message content.</p>
              )}
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onReply && (
              <DrawerClose asChild>
                <Button
                  size="sm"
                  onClick={() => onReply(item)}
                  className="gap-1.5 cursor-pointer"
                >
                  <Reply className="size-3.5" />
                  Reply
                </Button>
              </DrawerClose>
            )}
            {onToggleStar && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => onToggleStar(item.id, item.isStarred, e)}
                className={cn("gap-1.5 cursor-pointer", item.isStarred && "text-amber-500 border-amber-300")}
              >
                <Star className="size-3.5" fill={item.isStarred ? "currentColor" : "none"} />
                {item.isStarred ? "Starred" : "Star"}
              </Button>
            )}
            {onDelete && (
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </DrawerClose>
            )}
          </div>
          <DrawerClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default function TeacherEmailClient() {
  const [folder, setFolder] = React.useState<Folder>("inbox")
  const [emails, setEmails] = React.useState<Email[]>([])
  const [address, setAddress] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = React.useState(false)
  const [composeTo, setComposeTo] = React.useState("")
  const [composeSubject, setComposeSubject] = React.useState("")
  const [composeBody, setComposeBody] = React.useState("")
  const [sending, setSending] = React.useState(false)

  // TanStack Table states
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const fetchEmails = React.useCallback(async (f: Folder) => {
    setLoading(true)
    try {
      const targetFolder = f === "starred" ? "inbox" : f
      const res = await fetch(`/api/backend/api/teacher/email?folder=${targetFolder}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || errData.error || "Failed to load emails")
      }
      const data = await res.json()
      setAddress(data.address || "")
      let list: Email[] = data.emails || []
      if (f === "starred") {
        list = list.filter((e) => e.isStarred)
      }
      setEmails(list)
    } catch (err: any) {
      toast.error(err.message || "Could not fetch emails")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchEmails(folder)
  }, [folder, fetchEmails])

  const handleMarkRead = React.useCallback(async (email: Email) => {
    if (!email.isRead) {
      try {
        await fetch("/api/backend/api/teacher/email", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: email.id, isRead: true }),
        })
        setEmails((prev) =>
          prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e))
        )
      } catch (e) {
        console.error("Failed to mark read", e)
      }
    }
  }, [])

  const handleToggleStar = React.useCallback(
    async (id: string, currentStarred: boolean, e?: React.MouseEvent) => {
      if (e) e.stopPropagation()
      const nextVal = !currentStarred
      try {
        await fetch("/api/backend/api/teacher/email", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, isStarred: nextVal }),
        })
        setEmails((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isStarred: nextVal } : item))
        )
        toast.success(nextVal ? "Starred" : "Unstarred")
      } catch (err) {
        toast.error("Failed to update star")
      }
    },
    []
  )

  const handleDelete = React.useCallback(
    async (id: string) => {
      try {
        const res = await fetch("/api/backend/api/teacher/email", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, permanent: folder === "trash" }),
        })
        if (!res.ok) throw new Error("Delete failed")
        setEmails((prev) => prev.filter((e) => e.id !== id))
        toast.success(folder === "trash" ? "Permanently deleted" : "Moved to Trash")
      } catch (err) {
        toast.error("Failed to delete email")
      }
    },
    [folder]
  )

  const handleReply = React.useCallback((email: Email) => {
    setComposeTo(email.fromAddress)
    setComposeSubject(`Re: ${email.subject}`)
    setComposeBody(
      `\n\n--- Original Message ---\nFrom: ${email.fromAddress}\n${email.bodyText}`
    )
    setIsComposeOpen(true)
  }, [])

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      toast.error("Please fill in recipient, subject, and content")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/backend/api/teacher/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          body: composeBody,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to send email")
      toast.success("Email sent successfully!")
      setIsComposeOpen(false)
      setComposeTo("")
      setComposeSubject("")
      setComposeBody("")
      if (folder === "sent") fetchEmails("sent")
    } catch (err: any) {
      toast.error(err.message || "Failed to send email")
    } finally {
      setSending(false)
    }
  }

  const filteredEmails = React.useMemo(() => {
    if (!searchQuery.trim()) return emails
    const q = searchQuery.toLowerCase()
    return emails.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.fromAddress.toLowerCase().includes(q) ||
        e.toAddress.toLowerCase().includes(q) ||
        e.bodyText.toLowerCase().includes(q)
    )
  }, [emails, searchQuery])

  const unreadCount = React.useMemo(
    () => emails.filter((e) => !e.isRead).length,
    [emails]
  )
  const starredCount = React.useMemo(
    () => emails.filter((e) => e.isStarred).length,
    [emails]
  )

  const columns = React.useMemo<ColumnDef<Email>[]>(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "star",
        header: () => null,
        cell: ({ row }) => {
          const email = row.original
          return (
            <button
              onClick={(e) => handleToggleStar(email.id, email.isStarred, e)}
              className={cn(
                "h-5 w-5 flex items-center justify-center rounded transition-colors shrink-0 cursor-pointer",
                email.isStarred
                  ? "text-amber-500"
                  : "text-muted-foreground/40 hover:text-amber-400"
              )}
            >
              <Star className="h-3.5 w-3.5" fill={email.isStarred ? "currentColor" : "none"} />
            </button>
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "fromAddress",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 -ml-3 text-xs font-semibold hover:bg-transparent"
          >
            Sender
            <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => {
          const email = row.original
          const senderDisplay = getSenderDisplay(email.fromAddress)
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 rounded-lg shrink-0">
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-[10px]">
                  {getInitials(senderDisplay)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span
                  className={cn(
                    "text-xs truncate max-w-[130px]",
                    !email.isRead ? "font-bold text-foreground" : "text-foreground/80"
                  )}
                >
                  {senderDisplay}
                </span>
                {!email.isRead && (
                  <span className="inline-block text-[9px] font-bold text-rose-600 dark:text-rose-400">
                    UNREAD
                  </span>
                )}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "subject",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 -ml-3 text-xs font-semibold hover:bg-transparent"
          >
            Subject & Preview
            <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => {
          const email = row.original
          return (
            <TableCellViewer
              item={email}
              onSelect={() => handleMarkRead(email)}
              onReply={handleReply}
              onToggleStar={handleToggleStar}
              onDelete={handleDelete}
            />
          )
        },
        enableHiding: false,
      },
      {
        accessorKey: "folder",
        header: "Folder",
        cell: ({ row }) => (
          <Badge variant="outline" className="px-1.5 text-muted-foreground text-[10px] capitalize">
            {row.original.folder}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <div className="w-full text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 -mr-3 text-xs font-semibold hover:bg-transparent"
            >
              Date
              <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          const email = row.original
          return (
            <div className="text-right text-[10px] text-muted-foreground font-medium whitespace-nowrap">
              {formatDistanceToNow(new Date(email.createdAt), { addSuffix: true })}
            </div>
          )
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const email = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => {
                    handleMarkRead(email)
                  }}
                >
                  Mark as Read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReply(email)}>
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleToggleStar(email.id, email.isStarred, e)}>
                  {email.isStarred ? "Unstar Email" : "Star Email"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10"
                  onClick={() => handleDelete(email.id)}
                >
                  {folder === "trash" ? "Permanently Delete" : "Move to Trash"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [handleToggleStar, handleMarkRead, handleReply, handleDelete, folder]
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredEmails.map(({ id }) => id),
    [filteredEmails]
  )

  const table = useReactTable({
    data: filteredEmails,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setEmails((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-8 w-full max-w-7xl mx-auto font-sans">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Mail className="size-5 text-primary" /> School Email Inbox
          </h1>
          {address && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Logged in as <span className="font-semibold text-foreground font-mono">{address}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchEmails(folder)}
            disabled={loading}
            className="gap-1.5 rounded-lg cursor-pointer"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setComposeTo("")
              setComposeSubject("")
              setComposeBody("")
              setIsComposeOpen(true)
            }}
            className="gap-1.5 rounded-lg cursor-pointer shadow-sm"
          >
            <Plus className="size-4" />
            <span>Compose</span>
          </Button>
        </div>
      </div>

      <Tabs
        value={folder}
        onValueChange={(val) => setFolder(val as Folder)}
        className="w-full flex flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-3 px-1">
          {/* Mobile view selector */}
          <Select value={folder} onValueChange={(val) => setFolder(val as Folder)}>
            <SelectTrigger className="flex w-full sm:w-48 lg:hidden" size="sm">
              <SelectValue placeholder="Select folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inbox">Inbox</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="starred">Starred</SelectItem>
              <SelectItem value="trash">Trash</SelectItem>
            </SelectContent>
          </Select>

          {/* Desktop TabsList */}
          <TabsList className="hidden lg:flex **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
            <TabsTrigger value="inbox" className="gap-2 cursor-pointer">
              Inbox
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-rose-500 text-white font-bold text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="cursor-pointer">
              Sent
            </TabsTrigger>
            <TabsTrigger value="starred" className="gap-2 cursor-pointer">
              Starred
              {starredCount > 0 && (
                <Badge variant="secondary" className="text-amber-600 bg-amber-100 dark:bg-amber-950 font-bold text-[10px]">
                  {starredCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="trash" className="cursor-pointer">
              Trash
            </TabsTrigger>
          </TabsList>

          {/* Actions: Search Filter & Customize Columns */}
          <div className="flex items-center gap-2">
            <div className="relative w-40 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs rounded-lg bg-muted/30"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-lg">
                  <Columns3 className="size-3.5" />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  {table
                    .getAllColumns()
                    .filter(
                      (column) =>
                        typeof column.accessorFn !== "undefined" &&
                        column.getCanHide()
                    )
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize text-xs"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent
          value={folder}
          className="relative flex flex-col gap-4 overflow-auto mt-0"
        >
          <div className="overflow-hidden rounded-xl border border-border shadow-sm bg-card">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} colSpan={header.colSpan} className="text-xs font-semibold">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-32 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <Spinner size="md" />
                          <span className="text-xs">Loading emails...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows?.length ? (
                    <SortableContext
                      items={dataIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {table.getRowModel().rows.map((row) => (
                        <DraggableRow
                          key={row.id}
                          row={row}
                          onSelectRow={handleMarkRead}
                        />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-32 text-center text-xs text-muted-foreground"
                      >
                        No emails found in {folder}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>

          {/* Table Footer with Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-2 gap-4">
            <div className="hidden sm:flex flex-1 text-xs text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-xs font-medium text-muted-foreground">
                  Rows per page
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger size="sm" className="w-20 h-8 text-xs" id="rows-per-page">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-xs font-medium text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount() || 1}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8 p-0"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8 p-0"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 p-0 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Compose Email Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Send className="size-4 text-primary" /> New Message
              </DialogTitle>
              <DialogDescription className="text-xs">
                Sending from <span className="font-semibold text-foreground font-mono">{address}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Recipient (To)</Label>
                <Input
                  type="email"
                  placeholder="e.g. principal@blazeneuro.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Subject</Label>
                <Input
                  placeholder="Enter email subject..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Message Body</Label>
                <Textarea
                  rows={6}
                  placeholder="Write your email here..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="text-xs rounded-lg resize-none"
                  required
                />
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsComposeOpen(false)}
                className="rounded-lg cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={sending}
                className="rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                {sending ? <Spinner size="sm" /> : <Send className="size-3.5" />}
                {sending ? "Sending..." : "Send Email"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
