"use client"

import * as React from "react"
import { useSession } from "@/lib/auth-client"
import {
  Mail, Inbox, Send, Star, Trash2, RefreshCw, Plus,
  Search, ArrowLeft, Reply, MoreVertical, AlertCircle,
  MailOpen, Clock, Check, X, ShieldAlert, Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Email {
  id: string
  folder: string
  fromAddress: string
  toAddress: string
  ccAddress: string | null
  subject: string
  bodyHtml: string | null
  bodyText: string
  isRead: boolean
  isStarred: boolean
  createdAt: string
}

type Folder = "inbox" | "sent" | "starred" | "trash"

export default function TeacherEmailClient() {
  const { data: session } = useSession()
  const [folder, setFolder] = React.useState<Folder>("inbox")
  const [emails, setEmails] = React.useState<Email[]>([])
  const [address, setAddress] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)
  const [selectedEmail, setSelectedEmail] = React.useState<Email | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = React.useState(false)
  const [composeTo, setComposeTo] = React.useState("")
  const [composeSubject, setComposeSubject] = React.useState("")
  const [composeBody, setComposeBody] = React.useState("")
  const [sending, setSending] = React.useState(false)

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
    setSelectedEmail(null)
  }, [folder, fetchEmails])

  const handleMarkRead = async (email: Email) => {
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
    setSelectedEmail(email)
  }

  const handleToggleStar = async (id: string, currentStarred: boolean, e?: React.MouseEvent) => {
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
      if (selectedEmail?.id === id) {
        setSelectedEmail((prev) => (prev ? { ...prev, isStarred: nextVal } : null))
      }
      toast.success(nextVal ? "Starred" : "Unstarred")
    } catch (err) {
      toast.error("Failed to update star")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/backend/api/teacher/email", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, permanent: folder === "trash" }),
      })
      if (!res.ok) throw new Error("Delete failed")
      setEmails((prev) => prev.filter((e) => e.id !== id))
      if (selectedEmail?.id === id) setSelectedEmail(null)
      toast.success(folder === "trash" ? "Permanently deleted" : "Moved to Trash")
    } catch (err) {
      toast.error("Failed to delete email")
    }
  }

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

      if (folder === "sent") {
        fetchEmails("sent")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send email")
    } finally {
      setSending(false)
    }
  }

  const handleReply = (email: Email) => {
    setComposeTo(email.fromAddress)
    setComposeSubject(`Re: ${email.subject}`)
    setComposeBody(`\n\n--- Original Message ---\nFrom: ${email.fromAddress}\n${email.bodyText}`)
    setIsComposeOpen(true)
  }

  const filteredEmails = emails.filter((e) => {
    const query = searchQuery.toLowerCase()
    return (
      e.subject.toLowerCase().includes(query) ||
      e.fromAddress.toLowerCase().includes(query) ||
      e.toAddress.toLowerCase().includes(query) ||
      e.bodyText.toLowerCase().includes(query)
    )
  })

  const unreadCount = emails.filter((e) => !e.isRead).length

  const folders: { id: Folder; label: string; icon: React.ReactNode }[] = [
    { id: "inbox", label: "Inbox", icon: <Inbox className="h-4 w-4" /> },
    { id: "sent", label: "Sent", icon: <Send className="h-4 w-4" /> },
    { id: "starred", label: "Starred", icon: <Star className="h-4 w-4" /> },
    { id: "trash", label: "Trash", icon: <Trash2 className="h-4 w-4" /> },
  ]

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean)
    if (parts.length === 0) return "U"
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 py-6 min-h-screen bg-background font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Mail className="h-8 w-8 text-primary" />
              School Email Center
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed flex items-center gap-2">
              Official mailbox:{" "}
              <Badge variant="outline" className="font-mono text-xs font-semibold text-primary bg-primary/10 border-primary/20">
                {address || "Loading..."}
              </Badge>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchEmails(folder)}
              variant="outline"
              size="sm"
              className="rounded-lg cursor-pointer flex items-center gap-1.5"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setComposeTo("")
                setComposeSubject("")
                setComposeBody("")
                setIsComposeOpen(true)
              }}
              className="rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Compose Email
            </Button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 px-6 lg:px-8">
          {/* Sidebar Folder Navigation (3 cols) */}
          <Card className="md:col-span-3 border-border bg-card/40 p-2 flex flex-col gap-2 shadow-sm">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Folders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-1 flex flex-col gap-1">
              {folders.map((f) => (
                <Button
                  key={f.id}
                  variant={folder === f.id ? "default" : "ghost"}
                  onClick={() => setFolder(f.id)}
                  className="w-full justify-between h-9 rounded-lg font-medium text-xs cursor-pointer px-3"
                >
                  <span className="flex items-center gap-2">
                    {f.icon}
                    {f.label}
                  </span>
                  {f.id === "inbox" && unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0.2">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Email List Column (4 cols on wide screens, 9 on medium) */}
          <Card className={cn(
            "border-border bg-card/40 flex flex-col shadow-sm transition-all",
            selectedEmail ? "hidden lg:flex lg:col-span-4" : "md:col-span-9 lg:col-span-9"
          )}>
            <CardHeader className="p-4 border-b border-border space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold capitalize flex items-center gap-2">
                  {folder}
                  <Badge variant="outline" className="text-xs">
                    {filteredEmails.length}
                  </Badge>
                </CardTitle>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-lg bg-card/60"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px]">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2">
                    <Spinner size="md" />
                    <span className="text-xs text-muted-foreground font-medium">Fetching emails...</span>
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                    <MailOpen className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-xs font-semibold">No emails found in {folder}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredEmails.map((email) => {
                      const isSelected = selectedEmail?.id === email.id
                      const senderDisplay = email.fromAddress.includes("<")
                        ? email.fromAddress.match(/^(.+?)\s*</)?.[1]?.replace(/"/g, "") || email.fromAddress
                        : email.fromAddress

                      return (
                        <div
                          key={email.id}
                          onClick={() => handleMarkRead(email)}
                          className={cn(
                            "p-3.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-muted/50",
                            !email.isRead && "bg-primary/[0.04] font-semibold",
                            isSelected && "bg-muted border-l-4 border-l-primary"
                          )}
                        >
                          <Avatar className="h-8 w-8 rounded-lg shrink-0 mt-0.5">
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                              {getInitials(senderDisplay)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn("text-xs truncate", !email.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80")}>
                                {senderDisplay}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                {formatDistanceToNow(new Date(email.createdAt), { addSuffix: false })}
                              </span>
                            </div>
                            <p className={cn("text-xs truncate", !email.isRead ? "font-semibold text-foreground" : "text-muted-foreground")}>
                              {email.subject || "(no subject)"}
                            </p>
                            <p className="text-[11px] text-muted-foreground/80 line-clamp-1">
                              {email.bodyText}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-6 w-6 shrink-0 text-muted-foreground hover:text-amber-500",
                              email.isStarred && "text-amber-500"
                            )}
                            onClick={(e) => handleToggleStar(email.id, email.isStarred, e)}
                          >
                            <Star className="h-3.5 w-3.5" fill={email.isStarred ? "currentColor" : "none"} />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Email View Detail Column (5 cols when list visible, 9 cols when responsive) */}
          {selectedEmail ? (
            <Card className="md:col-span-9 lg:col-span-5 border-border bg-card/40 flex flex-col shadow-sm">
              <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEmail(null)}
                  className="rounded-lg text-xs cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-amber-500 cursor-pointer"
                        onClick={(e) => handleToggleStar(selectedEmail.id, selectedEmail.isStarred, e)}
                      >
                        <Star className="h-4 w-4" fill={selectedEmail.isStarred ? "currentColor" : "none"} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Star Email</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer"
                        onClick={() => handleReply(selectedEmail)}
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reply</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => handleDelete(selectedEmail.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[400px]">
                <div className="space-y-3">
                  <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                    {selectedEmail.subject || "(no subject)"}
                  </h2>
                  <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-card/60">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-lg">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {getInitials(selectedEmail.fromAddress)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">
                          {selectedEmail.fromAddress}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          To: {selectedEmail.toAddress}
                          {selectedEmail.ccAddress ? ` | CC: ${selectedEmail.ccAddress}` : ""}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                      {format(new Date(selectedEmail.createdAt), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 font-normal leading-relaxed">
                  {selectedEmail.bodyHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-xs">{selectedEmail.bodyText}</pre>
                  )}
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <Button
                    onClick={() => handleReply(selectedEmail)}
                    size="sm"
                    className="rounded-lg cursor-pointer flex items-center gap-1.5"
                  >
                    <Reply className="h-3.5 w-3.5" /> Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="hidden lg:flex lg:col-span-5 border-border bg-card/20 items-center justify-center p-8 text-center text-muted-foreground border-dashed">
              <div className="flex flex-col items-center gap-2">
                <Mail className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-xs font-medium">Select an email to view details</p>
              </div>
            </Card>
          )}
        </div>

        {/* Compose Dialog (Shadcn Dialog Component) */}
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent className="sm:max-w-xl">
            <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <Send className="h-4 w-4 text-primary" /> New Message
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Sending from <span className="font-semibold text-foreground">{address}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Recipient (To)</label>
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
                  <label className="text-xs font-semibold text-foreground">Subject</label>
                  <Input
                    placeholder="Enter email subject..."
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Message Body</label>
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
                  {sending ? <Spinner size="sm" /> : <Send className="h-3.5 w-3.5" />}
                  {sending ? "Sending..." : "Send Email"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
