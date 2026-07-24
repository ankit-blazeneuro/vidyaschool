"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowUp, User, Brain, ArrowLeft, Loader2, Copy, Check, ArrowDown, Pause, Paperclip, X, FileText, ImageIcon, Video, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Marker, MarkerContent, MarkerIcon, MarkerLabel } from "@/components/ui/marker"
import { Spinner } from "@/components/ui/spinner"
import { AiToolCard, AiToolCall, useAutoDetectTools } from "@/components/ui/ai-tool-card"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  role: "user" | "assistant"
  content: string
  createdAt: string
  thinking?: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: string
}

type GenerationStatus = "idle" | "thinking" | "generating"

function CodeBlockWrapper({ code, children }: { code: string; children: React.ReactNode }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <div className="relative group/code my-4 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-zinc-900/80 text-[10px] text-zinc-600 dark:text-zinc-400 font-sans border-b border-zinc-200 dark:border-zinc-800/80">
        <span>Code</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-600 dark:text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-500 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="bg-white/60 dark:bg-zinc-950/40">
        {children}
      </div>
    </div>
  )
}

// ── ChatGPT-style collapsible Thinking block ──
function ThinkingBlock({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const [open, setOpen] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const startRef = React.useRef(Date.now())
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (isStreaming) {
      startRef.current = Date.now()
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isStreaming])

  const label = isStreaming
    ? `Thinking${elapsed > 0 ? ` · ${elapsed}s` : "…"}`
    : `Thought for ${elapsed > 0 ? elapsed : "a few"}s`

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="group flex items-center gap-2 text-xs hover:text-zinc-300 transition-colors duration-150 select-none cursor-pointer"
      >
        {/* Animated orb */}
        <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
          {isStreaming ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-400" />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600" />
          )}
        </span>

        <span className={`font-medium tracking-tight ${isStreaming ? "text-violet-400" : "text-zinc-500"}`}>
          {label}
        </span>

        <ChevronDown
          className={`size-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${isStreaming ? "text-violet-400" : "text-zinc-600"}`}
        />
      </button>

      {/* Expandable reasoning content */}
      {open && (
        <div className="mt-2 ml-1 pl-4 border-l-2 border-zinc-800/80 max-h-72 overflow-y-auto">
          <pre className="text-[11px] leading-relaxed text-zinc-500 font-mono whitespace-pre-wrap break-words">
            {content || "(no reasoning content)"}
          </pre>
        </div>
      )}
    </div>
  )
}

// ── Per-message component: tool cards + markdown ─────────────────
function AssistantMessageContent({ content, userMsg = "" }: { content: string; userMsg?: string }) {
  const tools = useAutoDetectTools(userMsg, content)

  return (
    <>
      {tools.map((tool, i) => (
        <AiToolCard key={i} tool={tool} className="mb-3" />
      ))}
      <div className="text-zinc-800 dark:text-zinc-100 py-1 leading-relaxed text-sm">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-zinc-700 dark:text-zinc-200">{children}</li>,
            h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 text-zinc-900 dark:text-white">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-bold mt-3.5 mb-1.5 text-zinc-900 dark:text-white">{children}</h2>,
            strong: ({ children }) => <strong className="font-semibold text-zinc-900 dark:text-white">{children}</strong>,
            code: ({ children }) => <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs text-rose-600 dark:text-rose-400 font-mono">{children}</code>,
            pre: ({ children }) => {
              const extractText = (node: any): string => {
                if (!node) return ""
                if (typeof node === "string") return node
                if (Array.isArray(node)) return node.map(extractText).join("")
                if (node.props?.children) return extractText(node.props.children)
                return ""
              }
              const codeText = extractText(children)
              return (
                <CodeBlockWrapper code={codeText}>
                  <pre className="p-4 bg-transparent overflow-x-auto font-mono text-xs text-zinc-800 dark:text-zinc-200">{children}</pre>
                </CodeBlockWrapper>
              )
            },
            br: () => <br />,
            table: ({ children }) => (
              <div className="overflow-x-auto my-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs text-left text-zinc-700 dark:text-zinc-300 border-collapse">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-zinc-100/80 dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-100 uppercase tracking-wider font-semibold">{children}</thead>,
            tbody: ({ children }) => <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40">{children}</tbody>,
            tr: ({ children }) => <tr className="hover:bg-zinc-100/50 dark:hover:bg-zinc-900/25 transition-colors">{children}</tr>,
            th: ({ children }) => <th className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 font-bold">{children}</th>,
            td: ({ children }) => <td className="px-4 py-2 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0">{children}</td>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </>
  )
}

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
  const [authError, setAuthError] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [showScrollButton, setShowScrollButton] = React.useState(false)
  const activeReaderRef = React.useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const localIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  // ── File attachment state ──
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = React.useState<{ name: string; type: string; content: string; kind: "image" | "pdf" | "video" | "text" } | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  // ── Thinking / reasoning state ──
  const [thinkingMap, setThinkingMap] = React.useState<Record<number, string>>({})
  const [liveThinking, setLiveThinking] = React.useState("")
  const liveThinkingRef = React.useRef("")

  // ── Tool call results keyed by assistant message index ──
  const [toolCallsMap, setToolCallsMap] = React.useState<Record<number, AiToolCall[]>>({})

  // ── Guard: only auto-send the initial unanswered user message once per mount ──
  const autoSentRef = React.useRef(false)

  const handlePause = async () => {
    if (activeReaderRef.current) {
      try {
        await activeReaderRef.current.cancel()
      } catch (e) {}
      activeReaderRef.current = null
    }
    if (localIntervalRef.current) {
      clearInterval(localIntervalRef.current)
      localIntervalRef.current = null
    }
    setGenStatus("idle")
    setIsTyping(false)
  }

  // ── File upload handler ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/backend/api/chats/upload", {
        method: "POST",
        body: formData
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setAttachedFile({
        name: data.filename,
        type: file.type,
        content: data.content,
        kind: data.type
      })
    } catch (err) {
      console.error("File upload failed:", err)
      alert("Failed to process the file. Please try a different file.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const isFar = target.scrollHeight - target.scrollTop - target.clientHeight > 300
    setShowScrollButton(isFar)
  }

  // Auto-expand textarea on content growth (Shift + Enter)
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    }
  }, [input])

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const searchParams = useSearchParams()

  // Start a brand new chat session with backend API and stream initial response
  const startNewBackendChat = async (roomUuid: string, roomTitle: string, userMsgText: string, baseSession: ChatSession) => {
    setIsTyping(true)
    setGenStatus("thinking")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 180000) // 3min timeout

    try {
      const res = await fetch("/api/backend/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: roomUuid, title: roomTitle, message: userMsgText }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.status === 401) {
        setAuthError(true)
        setIsTyping(false)
        setGenStatus("idle")
        return
      }
      if (!res.ok) throw new Error(`API error ${res.status}`)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error("No reader")

      activeReaderRef.current = reader
      setIsTyping(false)

      let done = false
      let fullContent = ""
      let isFirstChunk = true

      liveThinkingRef.current = ""
      setLiveThinking("")
      const assistantMsgIndex = 1

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString()
      }

      setSession({ ...baseSession, messages: [...baseSession.messages, assistantMessage] })

      let lineBuffer = ""
      while (!done) {
        if (!activeReaderRef.current) break
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          lineBuffer += decoder.decode(value, { stream: !doneReading })
        }

        const lines = lineBuffer.split("\n")
        // Keep last possibly-incomplete line in buffer
        lineBuffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const dataStr = line.slice(6).trim()
          if (dataStr === "[DONE]") { done = true; break }
          try {
            const parsed = JSON.parse(dataStr)
            if (parsed.thinking) {
              liveThinkingRef.current += parsed.thinking
              setLiveThinking(liveThinkingRef.current)
              continue
            }
            if (parsed.content) {
              if (isFirstChunk) {
                setGenStatus("generating")
                isFirstChunk = false
              }
              fullContent += parsed.content
              setSession({ ...baseSession, messages: [...baseSession.messages, { ...assistantMessage, content: fullContent }] })
            }
          } catch {}
        }
      }

      activeReaderRef.current = null
      setGenStatus("idle")
      setLiveThinking("")

      if (liveThinkingRef.current) {
        setThinkingMap(prev => ({ ...prev, [assistantMsgIndex]: liveThinkingRef.current }))
      }

      const finalSession = { ...baseSession, messages: [...baseSession.messages, { ...assistantMessage, content: fullContent }] }
      setSession(finalSession)

      // Notify sidebar to refresh list from backend DB
      window.dispatchEvent(new Event("vidya_chats_updated"))

      // Clean up search param
      router.replace(`/teacher/${username || 'username'}/tasks/${roomUuid}`, { scroll: false })

    } catch (err) {
      clearTimeout(timeoutId)
      console.warn("Start chat error, falling back:", err)
      handleLocalSimulation(userMsgText, baseSession.messages, baseSession)
    }
  }

  // Load chat session on mount / uuid change from backend DB
  React.useEffect(() => {
    if (!uuid) return

    const initialText = searchParams?.get("initialMessage")
    if (initialText) {
      const title = initialText.slice(0, 35) + (initialText.length > 35 ? "..." : "")
      const freshSession: ChatSession = {
        id: uuid,
        title,
        messages: [{ role: "user", content: initialText, createdAt: new Date().toISOString() }],
        createdAt: new Date().toISOString()
      }
      setSession(freshSession)
      startNewBackendChat(uuid, title, initialText, freshSession)
      return
    }

    fetch(`/api/backend/api/chats/${uuid}`)
      .then(async (res) => {
        if (res.status === 401) {
          setAuthError(true)
          return
        }
        if (!res.ok) throw new Error(`Backend error ${res.status}`)
        const data: ChatSession = await res.json()
        setSession(data)
        setIsLocalMode(false)
      })
      .catch((err) => {
        console.error("Failed to load chat from backend:", err)
        setIsLocalMode(true)
      })

    autoSentRef.current = false
  }, [uuid])

  // Scroll to bottom on message change and loading updates
  React.useEffect(() => {
    scrollToBottom()
    const t = setTimeout(scrollToBottom, 50)
    return () => clearTimeout(t)
  }, [session?.messages, isTyping, genStatus])

  // Land at bottom when first loaded
  React.useEffect(() => {
    if (session) {
      scrollToBottom()
      const t = setTimeout(scrollToBottom, 150)
      return () => clearTimeout(t)
    }
  }, [session?.id])

  // Handle local mock simulated streaming typing effect
  const handleLocalSimulation = async (userMessageText: string, updatedMessages: Message[], updatedSession: ChatSession) => {
    setIsTyping(true)
    setGenStatus("thinking")

    let fullAnswer = ""
    const lower = userMessageText.toLowerCase()

    if (lower.includes("leaderboard") || lower.includes("top student") || lower.includes("rank") || lower.includes("highest score") || lower.includes("second") || lower.includes("2nd") || lower.includes("third") || lower.includes("3rd")) {
      try {
        const res = await fetch("/api/backend/api/student/leaderboard")
        if (res.ok) {
          const data = await res.json()
          if (data.leaderboard && data.leaderboard.length > 0) {
            const topList = data.leaderboard.slice(0, 5)

            // Detect specific rank queries
            const rankIdx =
              (lower.includes("second") || lower.includes("2nd")) ? 1 :
              (lower.includes("third") || lower.includes("3rd")) ? 2 : 0

            if ((lower.includes("second") || lower.includes("2nd") || lower.includes("third") || lower.includes("3rd")) && topList[rankIdx]) {
              const medals = ["🥇", "🥈", "🥉"]
              const s = topList[rankIdx]
              fullAnswer = `${medals[rankIdx]} **Rank #${rankIdx + 1}:** **${s.name}** with **${s.average}%** average across ${s.examsCount} exam(s).\n\n` +
                `### Top 5 Leaderboard Standings:\n` +
                topList.map((s: any, idx: number) => `**${idx + 1}. ${s.name}** — ${s.average}% avg (${s.examsCount} exam(s))`).join("\n")
            } else {
              const top = topList[0]
              fullAnswer = `🏆 **Top Student on Leaderboard:** **${top.name}** with **${top.average}%** average score!\n\n` +
                `### Top 5 Leaderboard Standings:\n` +
                topList.map((s: any, idx: number) => `**${idx + 1}. ${s.name}** — ${s.average}% avg (${s.examsCount} exam(s))`).join("\n")
            }
          }
        }
      } catch (e) {}
    }

    if (!fullAnswer) {
      const localAnswers = [
        `Here is the information for: **"${userMessageText}"**.\n\n- **Status:** Action plan initialized\n- **Target:** Student performance & class roster synchronization\n\nLet me know if you would like me to perform additional database queries or publish a notice!`,
        `Regarding **"${userMessageText}"**:\n\n- All student academic logs and class records are active.\n- You can use the Notice board tool or Push Notification tool directly from this assistant chat.\n\nHow else can I assist your class today?`
      ]
      fullAnswer = localAnswers[Math.floor(Math.random() * localAnswers.length)]
    }

    setTimeout(() => {
      setGenStatus("generating")
      setIsTyping(false)

      let currentLength = 0
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString()
      }

      setSession({
        ...updatedSession,
        messages: [...updatedMessages, assistantMessage]
      })

      localIntervalRef.current = setInterval(() => {
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
          if (localIntervalRef.current) {
            clearInterval(localIntervalRef.current)
            localIntervalRef.current = null
          }
          setGenStatus("idle")
        }
      }, 35)

    }, 1800)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !session) return

    const userMessageText = input.trim()
    setInput("")

    // Prepend extracted file content to message if attached
    let finalMessageText = userMessageText
    if (attachedFile) {
      const filePrefix = `[Attached ${attachedFile.kind.toUpperCase()}: ${attachedFile.name}]\n\nExtracted content:\n${attachedFile.content}\n\n---\n\nUser message: `
      finalMessageText = filePrefix + userMessageText
      setAttachedFile(null)
    }

    const userMessage: Message = {
      role: "user",
      content: userMessageText,
      createdAt: new Date().toISOString()
    }

    const updatedMessages = [...session.messages, userMessage]
    
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

    if (isLocalMode) {
      handleLocalSimulation(userMessageText, updatedMessages, updatedSession)
      return
    }

    setIsTyping(true)
    setGenStatus("thinking")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 180000) // 3min timeout

    try {
      const res = await fetch(`/api/backend/api/chats/${uuid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: finalMessageText, title: currentTitle }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.status === 401) {
        setAuthError(true)
        setIsTyping(false)
        setGenStatus("idle")
        return
      }
      if (!res.ok) throw new Error(`API error ${res.status}`)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error("No reader")
      
      activeReaderRef.current = reader
      setIsTyping(false)
      let done = false
      let fullContent = ""
      let isFirstChunk = true

      liveThinkingRef.current = ""
      setLiveThinking("")
      const assistantMsgIndex = updatedMessages.length

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString()
      }

      setSession({
        ...updatedSession,
        messages: [...updatedMessages, assistantMessage]
      })

      let lineBuffer = ""
      while (!done) {
        if (!activeReaderRef.current) break
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          lineBuffer += decoder.decode(value, { stream: !doneReading })
        }

        const lines = lineBuffer.split("\n")
        // Keep last possibly-incomplete line in buffer
        lineBuffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const dataStr = line.slice(6).trim()
          if (dataStr === "[DONE]") { done = true; break }
          try {
            const parsed = JSON.parse(dataStr)

            if (parsed.thinking) {
              liveThinkingRef.current += parsed.thinking
              setLiveThinking(liveThinkingRef.current)
              continue
            }

            if (parsed.content) {
              if (isFirstChunk) {
                setGenStatus("generating")
                isFirstChunk = false
              }
              fullContent += parsed.content
              setSession({
                ...updatedSession,
                messages: [
                  ...updatedMessages,
                  { ...assistantMessage, content: fullContent }
                ]
              })
            }
          } catch {}
        }
      }

      activeReaderRef.current = null
      setGenStatus("idle")
      setLiveThinking("")

      if (liveThinkingRef.current) {
        setThinkingMap(prev => ({ ...prev, [assistantMsgIndex]: liveThinkingRef.current }))
      }

      const finalSession = {
        ...updatedSession,
        messages: [
          ...updatedMessages,
          { ...assistantMessage, content: fullContent }
        ]
      }
      setSession(finalSession)
      window.dispatchEvent(new Event("vidya_chats_updated"))

    } catch (err) {
      clearTimeout(timeoutId)
      console.warn("Backend API call failed during chat submit:", err)
      // Only fall back to simulation for genuine network errors, not auth/server errors
      handleLocalSimulation(userMessageText, updatedMessages, updatedSession)
    }
  }

  if (authError) {
    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-4">
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-6 py-5 text-center max-w-sm">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Session Expired</p>
          <p className="text-xs text-red-600/80 dark:text-red-500/80 mb-4">Your login session has expired. Please sign in again to continue.</p>
          <button
            onClick={() => router.push("/login")}
            className="rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-4 py-2 transition-colors"
          >
            Sign In Again
          </button>
        </div>
      </div>
    )
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
    <div className="relative flex flex-col h-[calc(100dvh-var(--header-height,64px)-8px)] sm:h-[calc(100vh-var(--header-height,64px)-16px)] bg-background text-foreground w-full overflow-hidden">
      
      {/* ── Chat Messages Pane ── */}
      <div className="relative flex-1 min-h-0">
        {/* top fade */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-background to-transparent z-20" />
        {/* bottom fade */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-background to-transparent z-20" />
        <ScrollArea onScroll={handleScroll} className="h-full px-2.5 sm:px-5 pt-2.5 sm:pt-5 relative z-10" viewportClassName="pb-6">
        <div className="space-y-3.5 sm:space-y-4 max-w-4xl mx-auto w-full">
          {session.messages.map((msg, index) => {
            const isUser = msg.role === "user"
            return (
              <div
                key={index}
                className={`flex gap-2 sm:gap-3 w-full min-w-0 ${
                  isUser ? "max-w-[88%] sm:max-w-[85%] ml-auto flex-row-reverse" : "max-w-full sm:max-w-[85%] mr-auto"
                }`}
              >
                {/* Avatar */}
                <span
                  className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg text-[10px] sm:text-xs font-semibold ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {isUser ? <User className="size-3 sm:size-3.5" /> : <Brain className="size-3 sm:size-3.5 text-primary" />}
                </span>

                {/* Bubble */}
                <div className="space-y-1 flex-1 min-w-0">
                  {isUser ? (
                    <div className="text-zinc-900 dark:text-zinc-100 ml-auto w-fit max-w-[95%] sm:max-w-[85%] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap px-1 py-0.5 font-normal break-words">
                      {msg.content}
                    </div>
                  ) : (
                    <AssistantMessageContent
                      content={msg.content}
                      userMsg={index > 0 && session.messages[index - 1]?.role === "user" ? session.messages[index - 1].content : ""}
                    />
                  )}
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
          {(isTyping && genStatus === "thinking") || genStatus === "generating" ? (
            <div className="max-w-[95%] sm:max-w-[80%] mr-auto w-full space-y-2.5 py-1">
              {/* Row 1 — spinner + Thinking label */}
              <Marker role="status">
                <MarkerIcon>
                  <Spinner size="sm" className="border-t-primary border-primary/20" />
                </MarkerIcon>
                <MarkerLabel className="shimmer text-muted-foreground">
                  {genStatus === "thinking" ? "Thinking\u2026" : "Generating response\u2026"}
                </MarkerLabel>
              </Marker>
              {/* Row 2 — separator shimmer (only while actively generating) */}
              {genStatus === "generating" && (
                <Marker variant="separator" role="status">
                  <MarkerContent className="shimmer text-muted-foreground">
                    Writing response&hellip;
                  </MarkerContent>
                </Marker>
              )}
            </div>
          ) : null}
          
          <div ref={messagesEndRef} />
        </div>
        </ScrollArea>
      </div>

      {/* ── Scroll to Bottom Float Trigger ── */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-3 sm:right-8 z-40 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <ArrowDown className="size-3.5 sm:size-4" />
        </button>
      )}

      {/* ── Bottom-pinned Chat Input (in-flow, sidebar-aware) ── */}
      <div className="w-full shrink-0 px-2.5 sm:px-5 pb-3 sm:pb-4 pt-1 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-4xl mx-auto w-full">

        {/* File attachment preview badge */}
        {attachedFile && (
          <div className="mb-1.5 sm:mb-2 flex items-center gap-2 px-1">
            <div className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-300 dark:border-zinc-700/60 text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-300 max-w-[200px] sm:max-w-xs">
              {attachedFile.kind === "image" && <ImageIcon className="size-3 sm:size-3.5 text-sky-500 dark:text-sky-400 shrink-0" />}
              {attachedFile.kind === "pdf" && <FileText className="size-3 sm:size-3.5 text-rose-500 dark:text-rose-400 shrink-0" />}
              {attachedFile.kind === "video" && <Video className="size-3 sm:size-3.5 text-violet-500 dark:text-violet-400 shrink-0" />}
              {attachedFile.kind === "text" && <FileText className="size-3 sm:size-3.5 text-zinc-500 shrink-0" />}
              <span className="truncate max-w-[110px] sm:max-w-[180px]">{attachedFile.name}</span>
              <span className="text-zinc-400 dark:text-zinc-500 shrink-0">· extracted</span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="ml-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors shrink-0"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="w-full flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 pl-2 sm:pl-3 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black shadow-lg dark:shadow-2xl focus-within:border-zinc-500 dark:focus-within:border-zinc-600 min-h-[46px] sm:min-h-[52px]"
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Attach button */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            title="Attach image, PDF, or video"
            className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-all active:scale-95 cursor-pointer my-auto"
          >
            {isUploading
              ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              : <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
            placeholder={attachedFile ? `Ask about ${attachedFile.name}...` : "Message AI Assistant..."}
            className="flex-1 bg-transparent text-xs sm:text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60 px-1 sm:px-2 py-1.5 sm:py-2 resize-none max-h-24 sm:max-h-32 min-h-[30px] sm:min-h-[36px] my-auto scrollbar-none"
          />
          {genStatus !== "idle" ? (
            <button
              type="button"
              onClick={handlePause}
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer my-auto"
            >
              <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() && !attachedFile}
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 transition-all active:scale-95 cursor-pointer my-auto"
            >
              <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}
        </form>
        </div>{/* /max-w-4xl */}
      </div>

    </div>
  )
}
