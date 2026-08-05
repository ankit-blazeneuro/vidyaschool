"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Activity,
  ArrowDown,
  Check,
  ChevronRight,
  Copy,
  Download,
  Filter,
  Info,
  AlertTriangle,
  XCircle,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  Trash2,
  Cpu,
  Database,
  Radio,
  Zap
} from "lucide-react"

interface LogEntry {
  id: string
  timestamp: string
  level: "INFO" | "WARN" | "ERROR" | "DEBUG"
  category: "SYSTEM" | "DB" | "FCM" | "AI" | "API" | "AUTH" | "SCHEDULER"
  message: string
  details?: string
}

export default function VercelDeveloperConsolePage() {
  const params = useParams()
  const router = useRouter()
  const username = params?.username as string

  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [isStreaming, setIsStreaming] = React.useState(true)
  const [filterLevel, setFilterLevel] = React.useState<string>("ALL")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [autoScroll, setAutoScroll] = React.useState(true)
  const [copied, setCopied] = React.useState(false)
  const [statusText, setStatusText] = React.useState("Connecting to server stream...")

  const terminalEndRef = React.useRef<HTMLDivElement>(null)
  const terminalContainerRef = React.useRef<HTMLDivElement>(null)
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

    // 1. Fetch initial log history
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

    // 2. Connect SSE Real-time Log Stream
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
            // Keep max 1500 logs in frontend state
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

  // Scroll on logs change
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

  // ── Metrics Counters ─────────────────────────────────────────────────────
  const errorCount = React.useMemo(() => logs.filter((l) => l.level === "ERROR").length, [logs])
  const warnCount = React.useMemo(() => logs.filter((l) => l.level === "WARN").length, [logs])
  const infoCount = React.useMemo(() => logs.filter((l) => l.level === "INFO").length, [logs])

  // ── Utility Actions ──────────────────────────────────────────────────────
  const handleClearLogs = () => {
    setLogs([])
  }

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
    a.download = `vidyaschool_server_logs_${new Date().toISOString().slice(0, 10)}.log`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full max-h-full flex-1 bg-[#09090b] text-zinc-100 font-sans overflow-hidden select-none">
      
      {/* ── Top Header Navigation Bar (Vercel Style) ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-[#09090b]/90 px-4 sm:px-6 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          {/* Vercel Logo Icon */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700/60 shadow-inner">
            <svg className="size-4 text-white fill-current" viewBox="0 0 76 65">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-zinc-100">Server Real-Time Log Stream</h1>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700/40">
                v2.4-production
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block h-2 w-2 rounded-full ${isStreaming ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              {statusText}
            </p>
          </div>
        </div>

        {/* Live Metrics & Actions Toolbar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Stream Control Button */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
              isStreaming
                ? "bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800"
                : "bg-emerald-950/40 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/40"
            }`}
          >
            {isStreaming ? <Pause className="size-3.5" /> : <Play className="size-3.5 text-emerald-400" />}
            <span>{isStreaming ? "Pause Stream" : "Resume Stream"}</span>
          </button>

          {/* Copy Logs */}
          <button
            onClick={handleCopyLogs}
            title="Copy visible logs"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>

          {/* Download Logs */}
          <button
            onClick={handleDownloadLogs}
            title="Download log file"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Download className="size-3.5" />
          </button>

          {/* Clear Console */}
          <button
            onClick={handleClearLogs}
            title="Clear log console"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </header>

      {/* ── Sub-header: Live Metrics Bar & Filter Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 bg-[#09090b] px-4 py-2 text-xs">
        
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {["ALL", "INFO", "WARN", "ERROR", "DB", "AI", "FCM", "SYSTEM"].map((lvl) => {
            const isActive = filterLevel === lvl
            return (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-mono font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-zinc-100 text-black font-semibold shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                {lvl}
              </button>
            )
          })}
        </div>

        {/* Search Bar & Metrics Badges */}
        <div className="flex items-center gap-3">
          {/* Search Field */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs (regex or text)..."
              className="h-7 w-48 sm:w-64 rounded-md border border-zinc-800 bg-zinc-900/90 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Error Count Badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px] font-mono text-zinc-400">
            <span className="text-zinc-500">Total:</span>
            <span className="font-semibold text-zinc-200">{filteredLogs.length}</span>
          </div>

          {errorCount > 0 && (
            <div className="flex items-center gap-1 rounded-md bg-red-950/50 border border-red-800/60 px-2 py-1 text-[11px] font-mono text-red-400">
              <XCircle className="size-3 text-red-400" />
              <span>{errorCount} errors</span>
            </div>
          )}

          {warnCount > 0 && (
            <div className="flex items-center gap-1 rounded-md bg-amber-950/40 border border-amber-800/60 px-2 py-1 text-[11px] font-mono text-amber-400">
              <AlertTriangle className="size-3 text-amber-400" />
              <span>{warnCount} warnings</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Terminal Log Canvas (Monospace Vercel Console) ── */}
      <div
        ref={terminalContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-xs leading-relaxed bg-[#09090b] text-zinc-300 selection:bg-zinc-800 selection:text-white"
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
              const isInfo = log.level === "INFO"
              const isDebug = log.level === "DEBUG"

              return (
                <div
                  key={log.id || index}
                  className={`group flex items-start gap-3 rounded px-2 py-1 transition-colors hover:bg-zinc-900/60 ${
                    isError ? "bg-red-950/15 text-red-300 border-l-2 border-red-500" :
                    isWarn ? "bg-amber-950/10 text-amber-200 border-l-2 border-amber-500" : ""
                  }`}
                >
                  {/* Line Number */}
                  <span className="w-10 shrink-0 text-right text-[10px] text-zinc-600 select-none">
                    {index + 1}
                  </span>

                  {/* Timestamp */}
                  <span className="shrink-0 text-[11px] text-zinc-500 select-none">
                    {log.timestamp.slice(11, 23)}
                  </span>

                  {/* Level Badge */}
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wide select-none ${
                      isError
                        ? "bg-red-900/80 text-red-200 border border-red-700/60"
                        : isWarn
                        ? "bg-amber-900/60 text-amber-200 border border-amber-700/60"
                        : isDebug
                        ? "bg-purple-950 text-purple-300 border border-purple-800/60"
                        : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                    }`}
                  >
                    {log.level}
                  </span>

                  {/* Category Badge */}
                  <span className="shrink-0 rounded bg-zinc-900 px-1.5 py-0.2 text-[9px] text-zinc-400 border border-zinc-800 select-none">
                    {log.category}
                  </span>

                  {/* Log Message */}
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

      {/* ── Terminal Footer Status Bar ── */}
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-zinc-800 bg-[#09090b] px-4 text-[10px] text-zinc-500 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Radio className="size-3 text-emerald-500 animate-pulse" />
            <span>SSE Stream: /api/admin/logs/stream</span>
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">Buffer: 1000 lines</span>
        </div>

        <div className="flex items-center gap-3">
          {!autoScroll && (
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              <ArrowDown className="size-3" />
              <span>Scroll to Bottom</span>
            </button>
          )}
          <span>Vercel Developer Console</span>
        </div>
      </footer>

    </div>
  )
}
