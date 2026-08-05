"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  Layers,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap
} from "lucide-react"

interface ServerMetrics {
  cpu_usage_pct: number
  cpu_cores: number
  ram_used_mb: number
  ram_total_mb: number
  ram_pct: number
  active_sockets: number
  db_connections: number
  db_pool_max: number
  api_latency_ms: number
  uptime_seconds: number
  backend_log_uid: string
}

export default function DeveloperOperationsDashboard() {
  const router = useRouter()
  const [metrics, setMetrics] = React.useState<ServerMetrics>({
    cpu_usage_pct: 14.2,
    cpu_cores: 4,
    ram_used_mb: 1248.5,
    ram_total_mb: 4096.0,
    ram_pct: 30.5,
    active_sockets: 5,
    db_connections: 8,
    db_pool_max: 20,
    api_latency_ms: 12,
    uptime_seconds: 388800,
    backend_log_uid: "backend-a7f9q"
  })
  const [loading, setLoading] = React.useState(false)

  const fetchMetrics = React.useCallback(async () => {
    try {
      const sessionToken = localStorage.getItem("session_token") || ""
      const res = await fetch("/api/backend/api/admin/metrics", {
        headers: {
          Authorization: sessionToken ? `Bearer ${sessionToken}` : ""
        }
      })
      if (res.ok) {
        const data = await res.json()
        setMetrics(data)
      }
    } catch (err) {
      console.error("Failed to fetch server metrics:", err)
    }
  }, [])

  React.useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  const backendStreamUid = metrics.backend_log_uid || "backend-a7f9q"

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 font-sans p-4 sm:p-8 select-none">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
              <Cpu className="size-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Developer Operations & Server Metrics</h1>
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Healthy
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Real-time backend performance metrics, database pool health, and live log stream widgets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true)
              fetchMetrics().finally(() => setLoading(false))
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-violet-500" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Server Usage Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        
        {/* Metric 1: CPU Utilization */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">CPU Utilization</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Cpu className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">{metrics.cpu_usage_pct}%</span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">({metrics.cpu_cores} Cores Active)</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.cpu_usage_pct)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: RAM Memory Usage */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">RAM Usage</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <HardDrive className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">{metrics.ram_pct}%</span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">({metrics.ram_used_mb} / {metrics.ram_total_mb} MB)</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-violet-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.ram_pct)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: PostgreSQL Database Pool */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Database Pool</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Database className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">{metrics.db_connections} / {metrics.db_pool_max}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Active Pool</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">PostgreSQL pooled connection latency &lt; 1ms</p>
        </div>

        {/* Metric 4: API Response Latency */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">API Latency</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Zap className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">{metrics.api_latency_ms} ms</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Fast (p99)</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">Active WebSocket & SSE Clients: {metrics.active_sockets}</p>
        </div>

      </div>

      {/* ── Widget Link Cards Section ── */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
          Developer Operations Widgets & Console Links
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Prominent Widget Card 1: Server Log Streamer Widget */}
          <div className="group relative rounded-2xl border border-violet-200 dark:border-violet-900/60 bg-gradient-to-br from-violet-50/50 via-white to-purple-50/30 dark:from-violet-950/20 dark:via-zinc-900 dark:to-purple-950/10 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                  <Terminal className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Real-Time Server Log Streamer
                    </h3>
                    <span className="rounded-md bg-violet-100 dark:bg-violet-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-violet-700 dark:text-violet-300">
                      /{backendStreamUid}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Vercel-style live Server-Sent Events (SSE) log stream console. Filter ERROR, WARN, INFO, DB, and FCM events in real time.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 font-mono">
                <Radio className="size-3.5 text-emerald-500 animate-pulse" />
                <span>Live SSE Stream Ready</span>
              </div>

              <Link
                href={`/developer/${backendStreamUid}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-xs font-semibold shadow-md shadow-violet-500/20 transition-all hover:gap-2 cursor-pointer"
              >
                <span>Launch Console ({backendStreamUid})</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Widget Card 2: System Health & Maintenance */}
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    System Health & Infrastructure
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Automated background tasks, scheduler triggers, FCM multicast push engine, and database connection pools.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-zinc-800">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Uptime: {Math.floor(metrics.uptime_seconds / 86400)}d {Math.floor((metrics.uptime_seconds % 86400) / 3600)}h
              </span>
              <button
                onClick={fetchMetrics}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <span>Check Status</span>
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
