"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, QrCode, ArrowLeft, RefreshCw, Smartphone, CheckCircle2, Loader2 } from "lucide-react"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import { io, Socket } from "socket.io-client"

// Use the env var which is set to the actual backend URL on Vercel
// Falls back to localhost only in local dev (where NEXT_PUBLIC_BACKEND_URL isn't set)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
const QR_TTL = 180 // seconds

type QRStatus = "idle" | "generating" | "active" | "scanned" | "confirmed" | "expired"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<"form" | "qr">("form")

  // QR state
  const [qrStatus, setQrStatus] = useState<QRStatus>("idle")
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_TTL)
  const socketRef = useRef<Socket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Clean up Socket.IO + polling on unmount ─────────────────────────────
  useEffect(() => {
    return () => {
      cleanupQR()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cleanupQR = useCallback((token?: string | null) => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    const t = token ?? qrToken
    if (socketRef.current && t) {
      socketRef.current.emit("leave_qr_room", { qr_token: t })
      socketRef.current.off("qr_auth_confirmed")
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [qrToken])

  // ── Generate a fresh QR token ───────────────────────────────────────────
  const generateQR = useCallback(async () => {
    cleanupQR()
    setQrStatus("generating")
    setQrToken(null)
    setQrSecondsLeft(QR_TTL)

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/qr/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Failed to generate QR")
      const data = await res.json()
      const token: string = data.qr_token
      setQrToken(token)
      setQrStatus("active")

      // ── Socket.IO real-time confirmation ────────────────────────────────
      const socket = io(BACKEND_URL, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
      })
      socketRef.current = socket

      socket.on("connect", () => {
        socket.emit("join_qr_room", { qr_token: token })
      })

      socket.on("qr_auth_confirmed", async (payload: { session_token: string; user: Record<string, unknown> }) => {
        setQrStatus("confirmed")
        cleanupQR(token)
        await handleQRLoginSuccess(payload.session_token, payload.user)
      })

      // ── REST polling fallback (every 2 s) ───────────────────────────────
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${BACKEND_URL}/api/auth/qr/status/${token}`)
          const pollData = await pollRes.json()
          if (pollData.status === "confirmed") {
            clearInterval(pollRef.current!)
            setQrStatus("confirmed")
            cleanupQR(token)
            await handleQRLoginSuccess(pollData.session_token, pollData.user)
          } else if (pollData.status === "expired") {
            clearInterval(pollRef.current!)
            setQrStatus("expired")
          }
        } catch {
          // network glitch — keep polling
        }
      }, 2000)

      // ── Countdown timer ─────────────────────────────────────────────────
      countdownRef.current = setInterval(() => {
        setQrSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(countdownRef.current!)
            setQrStatus("expired")
            return 0
          }
          return s - 1
        })
      }, 1000)
    } catch {
      toast.error("Could not generate QR code. Please try again.")
      setQrStatus("idle")
    }
  }, [cleanupQR])

  // ── Handle successful QR login ──────────────────────────────────────────
  const handleQRLoginSuccess = async (
    sessionToken: string,
    user: Record<string, unknown>,
  ) => {
    try {
      // Store session via the better-auth cookie path
      await fetch(`${window.location.origin}/api/auth/qr-callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: sessionToken, user }),
      })
      toast.success(`Welcome back, ${user.name ?? "User"}! 🎉`)
      window.location.href = "/dashboard"
    } catch {
      // Fallback: redirect with token in search params handled by middleware
      window.location.href = `/dashboard?qr_session=${sessionToken}`
    }
  }

  // ── Switch to QR mode ───────────────────────────────────────────────────
  const enterQRMode = () => {
    setMode("qr")
    generateQR()
  }

  const exitQRMode = () => {
    cleanupQR()
    setQrToken(null)
    setQrStatus("idle")
    setMode("form")
  }

  // ── Email/password login ────────────────────────────────────────────────
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    })

    if (error) {
      toast.error(error.message || "Failed to sign in", {
        description: "Please check your credentials and try again.",
      })
    }

    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    })
  }

  const handleGitHubSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    })
  }

  // ── QR countdown colour ────────────────────────────────────────────────
  const countdownPct = (qrSecondsLeft / QR_TTL) * 100
  const countdownColor =
    qrSecondsLeft > 60 ? "#14b8a6" : qrSecondsLeft > 30 ? "#f59e0b" : "#ef4444"

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/assets/vidyaschool/Logo/no_title.svg"
              alt="VidyaSchool Logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
            VidyaSchool
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">

            {/* ── NORMAL FORM MODE ──────────────────────────────────────── */}
            <div
              className={cn(
                "transition-all duration-500",
                mode === "form"
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-4 pointer-events-none absolute"
              )}
            >
              <form onSubmit={handleEmailSignIn} className={cn("flex flex-col gap-6")}>
                <FieldGroup>
                  <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-2xl font-bold">Login to your account</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                      Enter your email below to login to your account
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Link href="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline">
                        Forgot your password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </Field>

                  <Field>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Logging in..." : "Login"}
                    </Button>
                  </Field>

                  {/* QR Code Login Button */}
                  <Field>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 border-teal-500/40 text-teal-600 hover:bg-teal-50 hover:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-950/30 transition-all duration-200"
                      onClick={enterQRMode}
                    >
                      <QrCode className="h-4 w-4" />
                      Login with QR Code
                    </Button>
                  </Field>

                  <FieldSeparator>Or continue with</FieldSeparator>

                  <Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" type="button" onClick={handleGoogleSignIn}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor" />
                        </svg>
                      </Button>
                      <Button variant="outline" type="button" onClick={handleGitHubSignIn}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor" />
                        </svg>
                      </Button>
                    </div>

                    <FieldDescription className="text-center">
                      Don&apos;t have an account? {" "}
                      <Link href="/signup" className="underline underline-offset-4">
                        Sign up
                      </Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </div>

            {/* ── QR CODE MODE ─────────────────────────────────────────── */}
            <div
              className={cn(
                "transition-all duration-500",
                mode === "qr"
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 translate-y-4 pointer-events-none absolute"
              )}
            >
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-2 text-center">
                  <button
                    onClick={exitQRMode}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to login
                  </button>
                  <h1 className="text-2xl font-bold mt-1">Scan to Login</h1>
                  <p className="text-balance text-sm text-muted-foreground">
                    Open the <strong>VidyaSchool app</strong> on your phone and tap{" "}
                    <strong>QR Login</strong> in the sidebar menu.
                  </p>
                </div>

                {/* QR Card */}
                <div className="flex flex-col items-center gap-4">
                  <div
                    className={cn(
                      "relative rounded-2xl border-2 p-5 transition-all duration-300",
                      qrStatus === "active" && "border-teal-500/60 shadow-[0_0_24px_rgba(20,184,166,0.15)]",
                      qrStatus === "scanned" && "border-amber-400/70 shadow-[0_0_24px_rgba(251,191,36,0.2)]",
                      qrStatus === "confirmed" && "border-green-500/70 shadow-[0_0_32px_rgba(34,197,94,0.25)]",
                      qrStatus === "expired" && "border-red-400/50",
                      qrStatus === "generating" && "border-border",
                    )}
                    style={{ background: "hsl(var(--background))" }}
                  >
                    {/* Animated corner accents */}
                    {qrStatus === "active" && (
                      <>
                        <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-teal-500 rounded-tl-md" />
                        <span className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-teal-500 rounded-tr-md" />
                        <span className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-teal-500 rounded-bl-md" />
                        <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-teal-500 rounded-br-md" />
                      </>
                    )}

                    {/* QR content area */}
                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                      {qrStatus === "generating" && (
                        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                      )}

                      {(qrStatus === "active") && qrToken && (
                        <div className="relative">
                          <QRCodeSVG
                            value={JSON.stringify({
                              type: "vidyaschool_qr_login",
                              token: qrToken,
                              ts: Date.now(),
                            })}
                            size={200}
                            bgColor="transparent"
                            fgColor="hsl(var(--foreground))"
                            level="H"
                            includeMargin={false}
                          />
                          {/* Animated scan line */}
                          <div className="absolute inset-0 overflow-hidden rounded pointer-events-none">
                            <div
                              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-80"
                              style={{
                                animation: "qr-scan 2s linear infinite",
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {qrStatus === "scanned" && (
                        <div className="flex flex-col items-center gap-3">
                          <Smartphone className="h-12 w-12 text-amber-500 animate-pulse" />
                          <p className="text-sm font-medium text-amber-600 text-center">
                            QR Scanned!
                            <br />
                            <span className="text-xs font-normal text-muted-foreground">Confirm on your phone…</span>
                          </p>
                        </div>
                      )}

                      {qrStatus === "confirmed" && (
                        <div className="flex flex-col items-center gap-3">
                          <CheckCircle2 className="h-14 w-14 text-green-500" style={{ animation: "pop-in 0.4s ease" }} />
                          <p className="text-sm font-semibold text-green-600 text-center">
                            Authenticated!
                            <br />
                            <span className="text-xs font-normal text-muted-foreground">Redirecting…</span>
                          </p>
                        </div>
                      )}

                      {qrStatus === "expired" && (
                        <div className="flex flex-col items-center gap-3">
                          <div className="rounded-full bg-red-100 dark:bg-red-950/40 p-4">
                            <QrCode className="h-10 w-10 text-red-500" />
                          </div>
                          <p className="text-sm text-muted-foreground text-center">QR code expired</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Countdown */}
                  {(qrStatus === "active") && (
                    <div className="flex items-center gap-2">
                      {/* Circular progress */}
                      <svg width="28" height="28" viewBox="0 0 28 28">
                        <circle cx="14" cy="14" r="11" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
                        <circle
                          cx="14" cy="14" r="11"
                          fill="none"
                          stroke={countdownColor}
                          strokeWidth="2.5"
                          strokeDasharray={`${2 * Math.PI * 11}`}
                          strokeDashoffset={`${2 * Math.PI * 11 * (1 - countdownPct / 100)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 14 14)"
                          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                        />
                      </svg>
                      <span className="text-sm font-mono" style={{ color: countdownColor }}>
                        {formatTime(qrSecondsLeft)}
                      </span>
                      <span className="text-xs text-muted-foreground">remaining</span>
                    </div>
                  )}

                  {/* Regenerate */}
                  {(qrStatus === "expired" || qrStatus === "idle") && (
                    <Button
                      variant="outline"
                      className="gap-2 border-teal-500/40 text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/30"
                      onClick={generateQR}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Generate new QR
                    </Button>
                  )}
                </div>

                {/* Steps hint */}
                {qrStatus === "active" && (
                  <ol className="text-xs text-muted-foreground space-y-1.5 list-none">
                    {[
                      "Open the VidyaSchool app on your phone",
                      "Tap the sidebar menu → QR Code Login",
                      "Point your camera at this QR code",
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-[10px] font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                )}

                <FieldDescription className="text-center text-xs">
                  Prefer password?{" "}
                  <button
                    type="button"
                    onClick={exitQRMode}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    Use email &amp; password
                  </button>
                </FieldDescription>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/assets/vidyaschool/Logo/restored_no_bg_with_title.png"
            alt="VidyaSchool Logo"
            width={400}
            height={400}
            className="object-contain animate-fade-in"
          />
        </div>
      </div>

      {/* QR scan-line animation keyframe injected inline */}
      <style>{`
        @keyframes qr-scan {
          0%   { top: 0%; }
          50%  { top: calc(100% - 2px); }
          100% { top: 0%; }
        }
        @keyframes pop-in {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
