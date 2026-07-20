"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Send, User, Brain, ArrowLeft, Loader2, Sparkles, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Message {
  role: "user" | "assistant"
  content: string
  createdAt: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: string
}

type GenerationStatus = "idle" | "thinking" | "generating"

export default function TeacherTaskChatPage() {
  const params = useParams()
  const router = useRouter()
  const username = params?.username as string
  const uuid = params?.uuid as string

  const [session, setSession] = React.useState<ChatSession | null>(null)
  const [input, setInput] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const [genStatus, setGenStatus] = React.useState<GenerationStatus>("idle")
  const [isLocalMode, setIsLocalMode] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load chat session on mount / uuid change
  React.useEffect(() => {
    if (!uuid) return

    // 1. Try to load from localStorage first (for instant display)
    let localSession: ChatSession | null = null
    try {
      const existing: ChatSession[] = JSON.parse(localStorage.getItem("vidya_teacher_chats") || "[]")
      const found = existing.find(c => c.id === uuid)
      if (found) {
        localSession = found
        setSession(found)
      }
    } catch (err) {
      console.error("Local storage error:", err)
    }

    // 2. Try fetching from backend API
    fetch(`/api/backend/api/chats/${uuid}`)
      .then(res => {
        if (!res.ok) throw new Error("Backend unavailable")
        return res.json()
      })
      .then((data: ChatSession) => {
        setSession(data)
        setIsLocalMode(false)
        syncToLocalStorage(data)
      })
      .catch(() => {
        // Fallback to local fallback if localSession not found (create one)
        setIsLocalMode(true)
        if (!localSession) {
          const freshSession: ChatSession = {
            id: uuid,
            title: "AI Chat Assistant",
            messages: [
              { role: "assistant", content: "Hello! I am your AI assistant. How can I help you plan your tasks or grade sheets today?", createdAt: new Date().toISOString() }
            ],
            createdAt: new Date().toISOString()
          }
          setSession(freshSession)
          syncToLocalStorage(freshSession)
        }
      })
  }, [uuid])

  // Scroll to bottom on message change
  React.useEffect(() => {
    scrollToBottom()
  }, [session?.messages, isTyping, genStatus])

  const syncToLocalStorage = (data: ChatSession) => {
    try {
      const existing: ChatSession[] = JSON.parse(localStorage.getItem("vidya_teacher_chats") || "[]")
      const filtered = existing.filter(c => c.id !== data.id)
      localStorage.setItem("vidya_teacher_chats", JSON.stringify([data, ...filtered]))
      window.dispatchEvent(new Event("vidya_chats_updated"))
    } catch (e) {
      console.error(e)
    }
  }

  // Handle local mock simulated streaming typing effect
  const handleLocalSimulation = (userMessageText: string, updatedMessages: Message[], updatedSession: ChatSession) => {
    setIsTyping(true)
    setGenStatus("thinking")

    setTimeout(() => {
      setGenStatus("generating")
      
      const localAnswers = [
        `I have received your request for: "${userMessageText}". Here is a template plan you can modify:\n\n**1. Objective:** Align with curriculum requirements.\n**2. Key Tasks:** Verify student roster allocations, assign timelines, and build test templates.\n**3. Support:** Reach academic coordinators for leaves or technical support.\n\n*Note: Running in local simulation mode since the Nvidia AI backend is pending.*`,
        `Here is a custom task sheet for "${userMessageText}":\n\n- Task 1: Grade class test submissions and update Marks records.\n- Task 2: Publish class bulletin alerts for the upcoming exams.\n- Task 3: Setup library reserve lists for science textbooks.\n\nLet me know if you would like me to refine this further!`,
        `Understood. For "${userMessageText}", I suggest scheduling a class review section. You can use the Notice board tool in the teacher workspace to alert students instantly.\n\nLet me know what other resources you need!`
      ]
      const fullAnswer = localAnswers[Math.floor(Math.random() * localAnswers.length)]
      setIsTyping(false)

      // Start streaming typing effect
      let currentLength = 0
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString()
      }

      // Append assistant message container
      setSession({
        ...updatedSession,
        messages: [...updatedMessages, assistantMessage]
      })

      const interval = setInterval(() => {
        currentLength += Math.min(3, fullAnswer.length - currentLength)
        const partialContent = fullAnswer.slice(0, currentLength)

        const finalSession = {
          ...updatedSession,
          messages: [
            ...updatedMessages,
            { ...assistantMessage, content: partialContent }
          ]
        }
        setSession(finalSession)

        if (currentLength >= fullAnswer.length) {
          clearInterval(interval)
          setGenStatus("idle")
          // Settle in storage
          syncToLocalStorage(finalSession)
        }
      }, 35)

    }, 1800) // Longer delay to showcase "Thinking..." shimmer
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !session) return

    const userMessageText = input.trim()
    setInput("")

    const userMessage: Message = {
      role: "user",
      content: userMessageText,
      createdAt: new Date().toISOString()
    }

    // Append user message immediately
    const updatedMessages = [...session.messages, userMessage]
    
    // Assign title dynamically based on the first user message if it's generic
    let currentTitle = session.title
    if (currentTitle === "AI Chat Assistant" || currentTitle.startsWith("New Chat")) {
      currentTitle = userMessageText.slice(0, 35) + (userMessageText.length > 35 ? "..." : "")
    }

    const updatedSession: ChatSession = {
      ...session,
      title: currentTitle,
      messages: updatedMessages
    }

    setSession(updatedSession)
    syncToLocalStorage(updatedSession)

    if (isLocalMode) {
      handleLocalSimulation(userMessageText, updatedMessages, updatedSession)
      return
    }

    setIsTyping(true)
    setGenStatus("thinking")

    // Call API and stream response
    try {
      const res = await fetch(`/api/backend/api/chats/${uuid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessageText, title: currentTitle })
      })

      if (!res.ok) throw new Error("API failed")

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error("No reader")

      setIsTyping(false)
      let done = false
      let fullContent = ""
      let isFirstChunk = true

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString()
      }

      setSession({
        ...updatedSession,
        messages: [...updatedMessages, assistantMessage]
      })

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value)
        
        // Parse lines of event-stream
        const lines = chunkValue.split("\n")
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim()
            try {
              const parsed = JSON.parse(dataStr)
              if (parsed.content) {
                if (isFirstChunk) {
                  setGenStatus("generating")
                  isFirstChunk = false
                }
                
                fullContent += parsed.content
                
                // Update component state in real-time
                setSession({
                  ...updatedSession,
                  messages: [
                    ...updatedMessages,
                    { ...assistantMessage, content: fullContent }
                  ]
                })
              }
            } catch (err) {
              // Ignore line parse errors
            }
          }
        }
      }

      setGenStatus("idle")

      // Final save to localStorage once stream settles
      const finalSession = {
        ...updatedSession,
        messages: [
          ...updatedMessages,
          { ...assistantMessage, content: fullContent }
        ]
      }
      setSession(finalSession)
      syncToLocalStorage(finalSession)

    } catch (err) {
      console.warn("Backend API call failed during chat submit, entering simulated stream:", err)
      handleLocalSimulation(userMessageText, updatedMessages, updatedSession)
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading chat panel...</p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-var(--header-height)-32px)] border border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm">
      
      {/* ── Chat Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 md:hidden">
            <Link href={`/teacher/${username}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-foreground truncate max-w-[220px] sm:max-w-md">
              {session.title}
            </h2>
          </div>
        </div>

        {isLocalMode && (
          <span className="text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
            Simulated
          </span>
        )}
      </div>

      {/* ── Chat Messages Pane ── */}
      <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-4 scrollbar-thin bg-zinc-50/30 dark:bg-black/5">
        {session.messages.map((msg, index) => {
          const isUser = msg.role === "user"
          return (
            <div
              key={index}
              className={`flex gap-3 max-w-[85%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar */}
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {isUser ? <User className="size-3.5" /> : <Brain className="size-3.5 text-primary" />}
              </span>

              {/* Bubble */}
              <div className="space-y-1">
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-xs ${
                    isUser
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted/65 dark:bg-zinc-800/40 border border-border/50 text-foreground rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
                <p className={`text-[9px] text-muted-foreground/60 ${isUser ? "text-right" : "text-left"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          )
        })}

        {/* Shimmer loading / Generation Status */}
        {isTyping && genStatus === "thinking" && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-start">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border animate-pulse">
              <Brain className="size-3.5 text-primary" />
            </span>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-2.5 shadow-xs animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-semibold text-primary">Thinking...</span>
            </div>
          </div>
        )}

        {genStatus === "generating" && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-start">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border animate-spin duration-1000">
              <Sparkles className="size-3.5 text-primary" />
            </span>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-2.5 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Generating...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* ── Floating & Sticky Chat Input ── */}
      <div className="absolute bottom-4 left-0 right-0 w-full max-w-2xl mx-auto px-4 z-30">
        <form onSubmit={handleSend} className="w-full flex items-center gap-2 p-1.5 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40 bg-white/30 dark:bg-black/35 backdrop-blur-md shadow-xl focus-within:border-primary/30">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none px-3"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || genStatus !== "idle"}
            className="h-8 w-8 rounded-xl shrink-0 transition-all active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>

    </div>
  )
}
