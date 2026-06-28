"use client"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AlertTriangle, CirclePlusIcon, MailIcon, Send } from "lucide-react"
import * as React from "react"
import { useSession } from "@/lib/auth-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    hasNotification?: boolean
  }[]
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [complaintOpen, setComplaintOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form states
  const [recipient, setRecipient] = React.useState("Teacher")
  const [title, setTitle] = React.useState("")
  const [taggedPeople, setTaggedPeople] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)

  // Autocomplete states
  const [users, setUsers] = React.useState<{ name: string; username: string; role: string }[]>([])
  const [showAutocomplete, setShowAutocomplete] = React.useState(false)
  const [searchVal, setSearchVal] = React.useState("")

  React.useEffect(() => {
    if (!searchVal) {
      setUsers([])
      return
    }
    const controller = new AbortController()
    fetch(`/api/backend/api/users/search?q=${encodeURIComponent(searchVal)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data)
        }
      })
      .catch(() => {})

    return () => controller.abort()
  }, [searchVal])

  const handleInputChange = (val: string) => {
    setTaggedPeople(val)
    
    // Find if we are typing a tag
    const words = val.split(/[\s,]+/)
    const lastWord = words[words.length - 1]
    
    if (lastWord.startsWith("@")) {
      const query = lastWord.slice(1)
      setSearchVal(query)
      setShowAutocomplete(true)
    } else {
      setShowAutocomplete(false)
      setUsers([])
    }
  }

  const selectUser = (username: string) => {
    const words = taggedPeople.split(",").map(w => w.trim()).filter(Boolean)
    if (words.length > 0) {
      const lastIndex = words.length - 1
      if (words[lastIndex].startsWith("@")) {
        words[lastIndex] = "@" + username
      } else {
        words.push("@" + username)
      }
    } else {
      words.push("@" + username)
    }
    const newValue = words.join(", ") + ", "
    setTaggedPeople(newValue)
    setShowAutocomplete(false)
    setUsers([])
  }

  const userRole = session?.user?.role || "student"
  const isStudent = userRole === "student"

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error("Please provide a title and a description message.")
      return
    }

    setIsSubmitting(true)
    const tId = toast.loading(`Filing complaint with ${recipient}...`)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("recipient", recipient)
      formData.append("taggedPeople", taggedPeople)
      formData.append("message", message)
      if (selectedFile) {
        formData.append("file", selectedFile)
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to submit complaint")
      }

      toast.dismiss(tId)
      toast.success(`Your complaint has been sent to ${recipient}`)
      setIsSubmitting(false)
      setComplaintOpen(false)
      
      // Reset form
      setTitle("")
      setTaggedPeople("")
      setMessage("")
      setSelectedFile(null)
    } catch (err: any) {
      toast.dismiss(tId)
      toast.error(err.message || "Failed to file complaint")
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                onClick={() => setComplaintOpen(true)}
                tooltip="File a Complaint"
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <CirclePlusIcon className="size-4 shrink-0" />
                <span>File a Complaint</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0 shrink-0"
                variant="outline"
              >
                <MailIcon />
                <span className="sr-only">Inbox</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            {items.map((item) => {
              const isActive = (() => {
                if (!pathname) return false
                if (pathname === item.url) return true
                const isDashboardRoot = /^\/(student|teacher|admin)(?:\/[^/]+)?$/.test(item.url)
                if (isDashboardRoot) return false
                return pathname.startsWith(item.url + '/')
              })()
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    isActive={isActive}
                    className={isActive ? "shadow-sm border border-sidebar-border/50 dark:shadow-none dark:border-transparent" : ""}
                  >
                    <Link href={item.url} className="relative flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                      {item.hasNotification && (
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 mr-1 animate-pulse shrink-0" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Dialog: File a Complaint */}
      <Dialog open={complaintOpen} onOpenChange={setComplaintOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" /> File a Complaint
            </DialogTitle>
            <DialogDescription>
              Submit an issue or escalation. It will be routed directly to the selected authority.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleComplaintSubmit} className="space-y-4 pt-2">
            <div className="grid gap-1.5">
              <Label htmlFor="dest">Who to send to</Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger id="dest" className="w-full text-xs">
                  <SelectValue placeholder="Select Recipient" />
                </SelectTrigger>
                <SelectContent>
                  {isStudent ? (
                    <>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                      <SelectItem value="Tech Support (Admin)">Tech Support (Admin)</SelectItem>
                      <SelectItem value="Principal (Admin)">Principal (Admin)</SelectItem>
                      <SelectItem value="Vice-Principal (Admin)">Vice-Principal (Admin)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Academic Coordinator (Admin)">Academic Coordinator (Admin)</SelectItem>
                      <SelectItem value="Tech Support (Admin)">Tech Support (Admin)</SelectItem>
                      <SelectItem value="Principal (Admin)">Principal (Admin)</SelectItem>
                      <SelectItem value="Vice-Principal (Admin)">Vice-Principal (Admin)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="compTitle">Complaint Title</Label>
              <Input
                id="compTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Smartboard in classroom 10-A not turning on"
                required
              />
            </div>

             <div className="grid gap-1.5 relative">
               <Label htmlFor="compTag">Tag People (Optional)</Label>
               <Input
                 id="compTag"
                 value={taggedPeople}
                 onChange={(e) => handleInputChange(e.target.value)}
                 placeholder="Type @ to search and tag people..."
                 autoComplete="off"
               />
               {showAutocomplete && users.length > 0 && (
                 <div className="absolute top-[100%] left-0 right-0 z-50 mt-1 max-h-[160px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-hidden animate-in fade-in-50 zoom-in-95">
                   {users.map((u) => (
                     <div
                       key={u.username}
                       onClick={() => selectUser(u.username)}
                       className="relative flex cursor-pointer select-none items-center rounded-sm px-2.5 py-2 text-xs outline-hidden hover:bg-accent hover:text-accent-foreground"
                     >
                       <div className="flex flex-col">
                         <span className="font-semibold text-foreground">{u.name}</span>
                         <span className="text-[10px] text-muted-foreground">@{u.username} • {u.role}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

            <div className="grid gap-1.5">
              <Label htmlFor="compMsg">Message Box</Label>
              <textarea
                id="compMsg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe the issue or complaint in detail..."
                required
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 outline-hidden"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="compFile">Attach File (Optional)</Label>
              <Input
                id="compFile"
                type="file"
                onChange={(e) => {
                  const files = e.target.files
                  if (files && files.length > 0) {
                    setSelectedFile(files[0])
                  } else {
                    setSelectedFile(null)
                  }
                }}
                className="cursor-pointer text-xs bg-card/40 border-border"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setComplaintOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" className="gap-1.5" disabled={isSubmitting}>
                <Send className="size-3.5" /> Complain
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
