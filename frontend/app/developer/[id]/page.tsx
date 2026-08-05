"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  Check,
  Copy,
  Download,
  Filter,
  AlertTriangle,
  XCircle,
  Pause,
  Play,
  Search,
  Terminal,
  Trash2,
  Radio
} from "lucide-react"

interface LogEntry {
  id: string
  timestamp: string
  level: "INFO" | "WARN" | "ERROR" | "DEBUG"
  category: "SYSTEM" | "DB" | "FCM" | "AI" | "API" | "AUTH" | "SCHEDULER"
  message: string
  details?: string
}

export default function BackendLogStreamerShadcnPage() {
  const params = useParams()
  const router = useRouter()
  const logStreamId = (params?.id as string) || "backend-a7f9q"

  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [isStreaming, setIsStreaming] = React.useState(true)
  const [filterLevel, setFilterLevel] = React.useState<string>("ALL")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [autoScroll, setAutoScroll] = React.useState(true)
  const [copied, setCopied] = React.useState(false)
  const [statusText, setStatusText] = React.useState("Connecting to server stream...")

  const terminalEndRef = React.useRef<HTMLDivElement>(null)
  const eventSourceRef = React.useRef<EventSource | null>(null)

  // ── Auto Scroll ──────────────────────────────────────────────────────────
  const scrollToBottom = React.useCallback(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [autoScroll])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60
    if (autoScroll !== isAtBottom) {
      setAutoScroll(isAtBottom)
    }
  }

  // ── Fetch Initial Log History + Setup Real-time Stream ────────────────────
  React.useEffect(() => {
    const sessionToken = localStorage.getItem("session_token") || ""

    const fetchLogHistory = async () => {
      try {
        const res = await fetch("/api/backend/api/admin/logs/history", {
          headers: {
            Authorization: sessionToken ? `Bearer ${sessionToken}` : ""
          }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.logs && Array.isArray(data.logs)) {
            setLogs(data.logs)
            setStatusText("Connected · Live Streaming Active")
          }
        }
      } catch (err) {
        console.error("Log history fetch error:", err)
      }
    }

    fetchLogHistory()

    if (isStreaming) {
      const streamUrl = `/api/backend/api/admin/logs/stream?token=${encodeURIComponent(sessionToken)}`
      const es = new EventSource(streamUrl)
      eventSourceRef.current = es

      es.onopen = () => {
        setStatusText("Live Stream Connected")
      }

      es.onmessage = (event) => {
        try {
          const parsed: LogEntry = JSON.parse(event.data)
          setLogs((prev) => {
            if (prev.some((l) => l.id === parsed.id)) return prev
            const updated = [...prev, parsed]
            return updated.length > 1500 ? updated.slice(updated.length - 1500) : updated
          })
        } catch (err) {
          console.error("Error parsing SSE log line:", err)
        }
      }

      es.onerror = () => {
        setStatusText("Reconnecting stream...")
      }
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [isStreaming])

  React.useEffect(() => {
    scrollToBottom()
  }, [logs, scrollToBottom])

  // ── Log Filtering ────────────────────────────────────────────────────────
  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      const matchesLevel =
        filterLevel === "ALL" ||
        log.level === filterLevel ||
        log.category === filterLevel

      const matchesSearch =
        !searchQuery.trim() ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesLevel && matchesSearch
    })
  }, [logs, filterLevel, searchQuery])

  const errorCount = React.useMemo(() => logs.filter((l) => l.level === "ERROR").length, [logs])
  const warnCount = React.useMemo(() => logs.filter((l) => l.level === "WARN").length, [logs])

  // ── Utility Actions ──────────────────────────────────────────────────────
  const handleClearLogs = () => setLogs([])

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.category}] ${l.message} ${l.details || ""}`)
      .join("\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.category}] ${l.message} ${l.details || ""}`)
      .join("\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vidyaschool_${logStreamId}_logs.log`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full max-h-full flex-1 bg-background text-foreground font-sans overflow-hidden select-none">
      
      {/* ── Header Navigation ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/developer")}
            title="Back to Developer Metrics"
            className="h-8 w-8 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
          </Button>
          
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Terminal className="size-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-foreground">
                Server Log Streamer
              </h1>
              <Badge variant="secondary" className="font-mono text-xs">
                {logStreamId}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block h-2 w-2 rounded-full ${isStreaming ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              {statusText}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant={isStreaming ? "outline" : "default"}
            size="sm"
            onClick={() => setIsStreaming(!isStreaming)}
            className="gap-1.5 text-xs cursor-pointer"
          >
            {isStreaming ? <Pause className="size-3.5" /> : <Play className="size-3.5 text-emerald-500" />}
            <span>{isStreaming ? "Pause Stream" : "Resume Stream"}</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyLogs}
            title="Copy visible logs"
            className="h-8 w-8 cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleDownloadLogs}
            title="Download log file"
            className="h-8 w-8 cursor-pointer"
          >
            <Download className="size-3.5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleClearLogs}
            title="Clear log console"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </header>

      {/* ── Filter Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {["ALL", "INFO", "WARN", "ERROR", "DB", "AI", "FCM", "SYSTEM"].map((lvl) => {
            const isActive = filterLevel === lvl
            return (
              <Button
                key={lvl}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterLevel(lvl)}
                className="h-7 text-[11px] font-mono font-medium cursor-pointer"
              >
                {lvl}
              </Button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="h-7 w-48 sm:w-64 pl-8 pr-3 text-xs font-mono"
            />
          </div>

          <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-mono">
            Total: {filteredLogs.length}
          </Badge>

          {errorCount > 0 && (
            <Badge variant="destructive" className="gap-1 text-[11px] font-mono">
              <XCircle className="size-3" />
              <span>{errorCount} errors</span>
            </Badge>
          )}

          {warnCount > 0 && (
            <Badge variant="outline" className="gap-1 text-[11px] font-mono border-amber-500/40 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3" />
              <span>{warnCount} warnings</span>
            </Badge>
          )}
        </div>
      </div>

      {/* ── Terminal Console Canvas (Shadcn Dark Terminal View) ── */}
      <div
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-xs leading-relaxed bg-zinc-950 text-zinc-100 selection:bg-zinc-800"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-zinc-500">
            <Terminal className="size-8 text-zinc-700 animate-bounce" />
            <p className="text-xs">No log entries matching query filters.</p>
            <p className="text-[11px] text-zinc-600">Listening for server events in real time...</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log, index) => {
              const isError = log.level === "ERROR"
              const isWarn = log.level === "WARN"

              return (
                <div
                  key={log.id || index}
                  className={`group flex items-start gap-3 rounded px-2 py-1 transition-colors hover:bg-zinc-900/80 ${
                    isError ? "bg-red-950/40 text-red-200 border-l-2 border-red-500" :
                    isWarn ? "bg-amber-950/30 text-amber-200 border-l-2 border-amber-500" : ""
                  }`}
                >
                  <span className="w-10 shrink-0 text-right text-[10px] text-zinc-600 select-none">
                    {index + 1}
                  </span>

                  <span className="shrink-0 text-[11px] text-zinc-500 select-none">
                    {log.timestamp.slice(11, 23)}
                  </span>

                  <Badge
                    variant={isError ? "destructive" : isWarn ? "outline" : "secondary"}
                    className="shrink-0 px-1.5 py-0 text-[9px] font-bold uppercase select-none"
                  >
                    {log.level}
                  </Badge>

                  <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[9px] text-zinc-400 select-none">
                    {log.category}
                  </Badge>

                  <span className="flex-1 break-all whitespace-pre-wrap text-zinc-200 font-mono">
                    {log.message}
                    {log.details && (
                      <span className="block mt-0.5 text-[11px] text-zinc-500">
                        {log.details}
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-card px-4 text-[10px] text-muted-foreground font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Radio className="size-3 text-emerald-500 animate-pulse" />
            <span>SSE Endpoint: /api/admin/logs/stream ({logStreamId})</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!autoScroll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToBottom}
              className="h-6 text-[10px] gap-1 text-emerald-600 dark:text-emerald-400 cursor-pointer"
            >
              <ArrowDown className="size-3" />
              <span>Scroll to Bottom</span>
            </Button>
          )}
          <span>Shadcn Developer Console</span>
        </div>
      </footer>

    </div>
  )
}
