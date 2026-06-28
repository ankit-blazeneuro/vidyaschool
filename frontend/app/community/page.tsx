"use client"

import * as React from "react"
import Link from "next/link"
import { io, Socket } from "socket.io-client"
import { 
  Send, 
  Users, 
  Wifi, 
  WifiOff, 
  ArrowLeft, 
  Loader2,
  Hash,
  Bell,
  Pin,
  Inbox,
  HelpCircle,
  Plus,
  Smile,
  CornerUpLeft,
  Pencil,
  Trash2,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"

interface Message {
  id: string
  userId: string
  name: string
  role: string
  content: string
  timestamp: string
  image?: string | null
  replyTo?: {
    id: string
    name: string
    content: string
  } | null
}

interface OnlineUser {
  userId: string
  name: string
  role: string
  sid: string
  image?: string | null
}

function CommunitySkeleton() {
  return (
    <div className="flex h-[calc(100vh-var(--header-height))] w-full bg-background overflow-hidden animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex w-60 border-r border-border bg-muted/10 flex-col p-4 space-y-4 shrink-0">
        <div className="h-6 w-32 bg-muted/60 rounded-md mb-4" />
        <div className="space-y-3">
          <div className="h-8 w-full bg-muted/60 rounded-md" />
          <div className="h-8 w-4/5 bg-muted/60 rounded-md" />
          <div className="h-8 w-full bg-muted/60 rounded-md" />
          <div className="h-8 w-3/4 bg-muted/60 rounded-md" />
        </div>
      </div>
      {/* Main Chat Panel Skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Skeleton */}
        <div className="h-14 border-b border-border flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted/60 rounded-md" />
            <div className="h-5 w-28 bg-muted/60 rounded-md" />
          </div>
          <div className="h-5 w-16 bg-muted/60 rounded-md" />
        </div>
        {/* Messages List Skeleton */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="size-10 rounded-full bg-muted/60 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="flex gap-2 items-center">
                  <div className="h-4 w-24 bg-muted/60 rounded-md" />
                  <div className="h-3 w-16 bg-muted/60 rounded-md" />
                </div>
                <div className="h-4 w-full bg-muted/60 rounded-md" />
                <div className="h-4 w-2/3 bg-muted/60 rounded-md" />
              </div>
            </div>
          ))}
        </div>
        {/* Input Area Skeleton */}
        <div className="p-4 bg-transparent shrink-0">
          <div className="h-12 w-full bg-muted/60 border border-border rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function CommunityChatPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const [userProfile, setUserProfile] = React.useState<any>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = React.useState<OnlineUser[]>([])
  const [inputText, setInputText] = React.useState("")
  const [socket, setSocket] = React.useState<Socket | null>(null)
  const [connected, setConnected] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [showMemberList, setShowMemberList] = React.useState(true)
  
  // Reply & Edit state
  const [replyingTo, setReplyingTo] = React.useState<Message | null>(null)
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null)
  const [editText, setEditText] = React.useState("")
  const [hasMore, setHasMore] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const chatContainerRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Fetch session on mount
  React.useEffect(() => {
    fetch("/api/account")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized")
        return res.json()
      })
      .then((data) => {
        setCurrentUser(data.user)
        setUserProfile(data.profile)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  // Initialize Socket.IO connection
  React.useEffect(() => {
    if (!currentUser) return

    // Connect directly to FastAPI backend on port 8000
    const socketInstance = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    })

    socketInstance.on("connect", () => {
      console.log("Connected to Socket.IO")
      setConnected(true)

      // Join the community room
      socketInstance.emit("join", {
        userId: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        image: currentUser.image,
      })
    })

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from Socket.IO")
      setConnected(false)
    })

    socketInstance.on("online_users", (users: OnlineUser[]) => {
      setOnlineUsers(users)
    })

    socketInstance.on("recent_messages", (data: { messages: Message[]; hasMore: boolean }) => {
      setMessages(data.messages || [])
      setHasMore(data.hasMore || false)
      setTimeout(scrollToBottom, 100)
    })

    socketInstance.on("more_messages", (data: { messages: Message[]; hasMore: boolean }) => {
      if (chatContainerRef.current) {
        const container = chatContainerRef.current
        const previousScrollHeight = container.scrollHeight
        const previousScrollTop = container.scrollTop

        setMessages((prev) => [...(data.messages || []), ...prev])
        setHasMore(data.hasMore || false)
        setLoadingMore(false)

        // Restore scroll position after DOM renders prepended messages!
        setTimeout(() => {
          container.scrollTop = container.scrollHeight - previousScrollHeight + previousScrollTop
        }, 0)
      }
    })

    socketInstance.on("new_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg])
      setTimeout(scrollToBottom, 100)
    })

    socketInstance.on("message_edited", (data: { id: string; content: string }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.id ? { ...msg, content: data.content } : msg))
      )
    })

    socketInstance.on("message_deleted", (data: { id: string }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.id))
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [currentUser])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !socket || !connected) return

    const payload: any = { content: inputText }
    if (replyingTo) {
      payload.replyTo = {
        id: replyingTo.id,
        name: replyingTo.name,
        content: replyingTo.content,
      }
    }

    socket.emit("send_message", payload)
    setInputText("")
    setReplyingTo(null)
  }

  const handleEditMessage = (messageId: string, content: string) => {
    if (!socket || !connected || !content.trim()) return
    socket.emit("edit_message", { messageId, content })
    setEditingMessageId(null)
    setEditText("")
  }

  const handleDeleteMessage = (messageId: string) => {
    if (!socket || !connected) return
    socket.emit("delete_message", { messageId })
  }

  const handleScroll = () => {
    if (!chatContainerRef.current || !socket || !connected || !hasMore || loadingMore) return
    const container = chatContainerRef.current
    if (container.scrollTop <= 5 && messages.length > 0) {
      setLoadingMore(true)
      socket.emit("load_more", { before: messages[0].timestamp })
    }
  }

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?"
  }

  const getAvatarGradient = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-gradient-to-br from-rose-500 to-red-600 text-white"
      case "teacher":
        return "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
      case "account":
        return "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
      default:
        return "bg-gradient-to-br from-slate-500 to-gray-600 text-white"
    }
  }

  const getRoleTextColor = (role: string) => {
    switch (role) {
      case "admin":
        return "text-rose-600 dark:text-rose-400 font-bold"
      case "teacher":
        return "text-blue-600 dark:text-blue-400 font-bold"
      case "account":
        return "text-emerald-600 dark:text-emerald-400 font-bold"
      default:
        return "text-foreground"
    }
  }

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    
    // Check if today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // Check if yesterday
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }

    return date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' }) + 
           ` ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  if (loading) {
    return <CommunitySkeleton />
  }

  if (!currentUser) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height))] w-full flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm font-semibold text-muted-foreground">Unauthorized access. Please login.</p>
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    )
  }

  const backHref = currentUser.role === "admin"
    ? `/admin/${userProfile?.username || ""}`
    : `/teacher/${userProfile?.username || ""}`

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height))] bg-background text-foreground font-sans overflow-hidden">
      
      {/* Page Header */}
      <PageHeader
        title="Community"
        onToggleSidebar={() => setShowMemberList(!showMemberList)}
        actions={
          <div className="flex items-center gap-3">
            {connected ? (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5">
                <Wifi className="h-3 w-3" />
                Online
              </Badge>
            ) : (
              <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 gap-1.5 animate-pulse">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMemberList(!showMemberList)}
              className="hidden md:flex"
            >
              <Users className="h-5 w-5" />
            </Button>
          </div>
        }
      />
            <button className="hover:text-foreground transition-colors" title="Notification Settings">
              <Bell className="h-5 w-5" />
            </button>
            <button className="hover:text-foreground transition-colors" title="Pinned Messages">

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        
        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-background overflow-hidden min-w-0">
          
          {/* Scrollable Message List */}
          <div 
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pt-6 space-y-[2px] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
          >
            {loadingMore && (
              <div className="w-full py-3 flex items-center justify-center gap-2 select-none">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-semibold">Loading older messages...</span>
              </div>
            )}
            {messages.length > 0 ? (
              messages.map((msg, index) => {
                const isMe = msg.userId === currentUser.id
                
                // Group messages sent by same user within 5 minutes
                const isGrouped = index > 0 && 
                  messages[index - 1].userId === msg.userId &&
                  (new Date(msg.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime()) < 300000 &&
                  !msg.replyTo;

                // Edit Message View
                const isEditing = editingMessageId === msg.id

                return (
                  <div key={msg.id} className="relative group w-full">
                    
                    {/* Discord Style Curved Reply Connection */}
                    {msg.replyTo && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/75 pl-[72px] mb-1 select-none">
                        <div className="w-8 h-2.5 border-l-2 border-t-2 border-border rounded-tl-md mr-1 mt-1.5 shrink-0" />
                        <span className="font-bold hover:underline cursor-pointer">@{msg.replyTo.name}</span>
                        <span className="truncate opacity-75 italic">"{msg.replyTo.content}"</span>
                      </div>
                    )}

                    {/* Options overlay menu on hover */}
                    {!isEditing && (
                      <div className="absolute right-4 top-[-10px] bg-background border border-border shadow-xs rounded-md flex items-center p-0.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => setReplyingTo(msg)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Reply"
                        >
                          <CornerUpLeft className="h-4 w-4" />
                        </Button>
                        {isMe && (
                          <>
                            <Button
                              onClick={() => {
                                setEditingMessageId(msg.id)
                                setEditText(msg.content)
                              }}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteMessage(msg.id)}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {isGrouped ? (
                      // Grouped rendering
                      <div className="pl-[72px] pr-16 py-[2px] hover:bg-muted/30 group/grouped relative flex items-center min-h-[22px]">
                        <span className="absolute left-4 hidden group-hover/grouped:block text-[10px] text-muted-foreground select-none w-10 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                        
                        {isEditing ? (
                          <form 
                            onSubmit={(e) => { e.preventDefault(); handleEditMessage(msg.id, editText); }}
                            className="w-full mt-1"
                          >
                            <Input
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Escape") setEditingMessageId(null); }}
                              className="bg-muted text-sm border-border w-full focus-visible:ring-1 focus-visible:ring-primary py-1 px-3 h-8"
                              autoFocus
                            />
                            <div className="text-[10px] text-muted-foreground mt-1 select-none">
                              escape to <button type="button" onClick={() => setEditingMessageId(null)} className="underline text-primary hover:text-primary-foreground">cancel</button> • enter to <button type="submit" className="underline text-primary hover:text-primary-foreground">save</button>
                            </div>
                          </form>
                        ) : (
                          <p className="text-sm text-foreground break-words leading-relaxed whitespace-pre-wrap w-full">
                            {msg.content}
                          </p>
                        )}
                      </div>
                    ) : (
                      // Normal full rendering
                      <div className="mt-2 pl-4 pr-16 py-[2px] hover:bg-muted/30 flex items-start gap-4">
                        <Avatar className={`h-10 w-10 shrink-0 shadow-xs rounded-full cursor-pointer select-none ${getAvatarGradient(msg.role)}`}>
                          <AvatarImage src={msg.image || undefined} alt={msg.name} />
                          <AvatarFallback className="font-semibold text-sm">{getInitials(msg.name)}</AvatarFallback>
                        </Avatar>

                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap select-none">
                            <span className={`font-semibold text-[15px] hover:underline cursor-pointer ${getRoleTextColor(msg.role)}`}>
                              {msg.name}
                            </span>
                            
                            <span className={`text-[10px] font-bold uppercase rounded-sm px-1 py-0.25 select-none shrink-0 ${
                              msg.role === 'admin' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                              msg.role === 'teacher' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {msg.role}
                            </span>

                            <span className="text-[11px] text-muted-foreground select-none">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                          
                          {isEditing ? (
                            <form 
                              onSubmit={(e) => { e.preventDefault(); handleEditMessage(msg.id, editText); }}
                              className="w-full mt-1"
                            >
                              <Input
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Escape") setEditingMessageId(null); }}
                                className="bg-muted text-sm border-border w-full focus-visible:ring-1 focus-visible:ring-primary py-1 px-3 h-8"
                                autoFocus
                              />
                              <div className="text-[10px] text-muted-foreground mt-1 select-none">
                                escape to <button type="button" onClick={() => setEditingMessageId(null)} className="underline text-primary">cancel</button> • enter to <button type="submit" className="underline text-primary">save</button>
                              </div>
                            </form>
                          ) : (
                            <p className="text-sm text-foreground break-words leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="flex h-full flex-col justify-end p-6 pb-12 select-none">
                <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center text-muted-foreground mb-4">
                  <Hash className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to #community!</h2>
                <p className="text-base text-muted-foreground max-w-lg mb-6">
                  This is the start of the secure #community channel. Discuss and sync in realtime with teachers and administrators.
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar with Docked Reply Banner */}
          <footer className="px-4 pb-6 pt-0 bg-transparent shrink-0">
            <div className="flex flex-col w-full bg-muted border border-border rounded-lg shadow-sm">
              
              {/* Replying To Preview Banner */}
              {replyingTo && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-border text-xs text-muted-foreground bg-muted/40 rounded-t-lg animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 truncate">
                    <CornerUpLeft className="h-3.5 w-3.5" />
                    <span>Replying to <span className="font-semibold text-foreground/80">@{replyingTo.name}</span></span>
                    <span className="truncate opacity-75 italic">"{replyingTo.content}"</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="hover:text-foreground p-0.5 rounded-full hover:bg-muted/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-4 px-4 py-2.5 w-full">
                <button 
                  type="button" 
                  className="bg-secondary text-secondary-foreground hover:bg-muted rounded-full p-1.5 transition-colors shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>
                
                <input
                  placeholder="Message #community"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={!connected}
                  className="bg-transparent border-0 outline-none text-foreground placeholder-muted-foreground flex-1 text-sm focus:ring-0 focus-visible:ring-0 p-0"
                />
                
                <div className="flex items-center gap-3 text-muted-foreground shrink-0">
                  <button type="button" className="hover:text-foreground transition-colors">
                    <Smile className="h-5 w-5" />
                  </button>
                  <button 
                    type="submit" 
                    disabled={!inputText.trim() || !connected} 
                    className="hover:text-foreground transition-colors disabled:opacity-40"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          </footer>
        </main>

        {/* Sidebar: Online Members List */}
        {showMemberList && (
          <aside className="w-60 hidden md:flex flex-col bg-muted/20 border-l border-border overflow-hidden shrink-0 select-none animate-in slide-in-from-right duration-200">
            <div className="px-4 pt-6 pb-2 shrink-0">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Staff Members — {onlineUsers.length}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
              {onlineUsers.length > 0 ? (
                onlineUsers.map((userObj) => (
                  <div
                    key={userObj.sid}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer group"
                  >
                    <div className="relative shrink-0">
                      <Avatar className={`h-8 w-8 rounded-full shadow-xs ${getAvatarGradient(userObj.role)}`}>
                        <AvatarImage src={userObj.image || undefined} alt={userObj.name} />
                        <AvatarFallback className="font-semibold text-xs">{getInitials(userObj.name)}</AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className={`text-[15px] font-medium truncate group-hover:text-foreground ${getRoleTextColor(userObj.role)}`}>
                        {userObj.name}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No members online
                </div>
              )}
            </div>
          </aside>
        )}

      </div>
    </div>
  )
}
