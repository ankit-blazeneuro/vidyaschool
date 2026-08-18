"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, ArrowLeft, MailCheck, Loader2, RotateCw } from "lucide-react"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // OTP State
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter your full name")
      return
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    setSendingOtp(true)

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to send verification code")
        setSendingOtp(false)
        return
      }

      setOtpSent(true)
      setResendCooldown(30)
      toast.success(data.message || `Verification code sent to ${email}`)
    } catch (err: any) {
      toast.error("Failed to connect to verification server. Please try again.")
    } finally {
      setSendingOtp(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setSendingOtp(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to resend verification code")
      } else {
        setResendCooldown(30)
        toast.success(`A new verification code has been sent to ${email}`)
      }
    } catch (err) {
      toast.error("Failed to resend code")
    } finally {
      setSendingOtp(false)
    }
  }

  // Step 2: Verify OTP & Create Account
  const handleVerifyOtpAndSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error("Please enter the complete 6-digit verification code")
      return
    }

    setVerifyingOtp(true)

    try {
      // 1. Verify OTP with server
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        toast.error(verifyData.error || "Invalid verification code")
        setVerifyingOtp(false)
        return
      }

      // 2. Code verified! Create account in Better Auth
      const { data, error } = await authClient.signUp.email({
        name,
        email,
        password,
      })

      if (error) {
        toast.error(error.message || "Failed to finalize account creation", {
          description: "Please try again.",
        })
        setVerifyingOtp(false)
        return
      }

      toast.success("Email verified successfully! Opening onboarding...")
      window.location.href = "/signup/onboarding"
    } catch (err: any) {
      toast.error("Verification failed. Please try again.")
      setVerifyingOtp(false)
    }
  }

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/signup/onboarding",
    })
  }

  const handleGitHubSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/signup/onboarding",
    })
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/assets/vidyaschool/Logo/no_title.svg"
              alt="VidyaSchool Logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
            VidyaSchool
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">

            {/* PHASE 1: Enter Name, Email & Password */}
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className={cn("flex flex-col gap-6 animate-fade-in")}>
                <FieldGroup>
                  <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-2xl font-bold">Create an account</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                      Enter your details to register your account
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Field>

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
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        required
                        minLength={8}
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
                    <Button type="submit" className="w-full cursor-pointer" disabled={sendingOtp}>
                      {sendingOtp ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...
                        </>
                      ) : (
                        "Send Verification Code"
                      )}
                    </Button>
                  </Field>

                  <div className="flex flex-col gap-5 pt-4 mt-2">
                    <FieldSeparator>Or continue with</FieldSeparator>
                    <Field>
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <Button variant="outline" type="button" onClick={handleGoogleSignIn}>
                          <svg width="721" height="737" viewBox="0 0 721 737" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                            <path d="M721 376.538C721 350.431 718.659 325.329 714.312 301.23L460.213 301.23V443.812L565.831 443.812C557.136 489.666 531.052 528.492 491.925 554.598V647.31H611.312C680.87 583.048 721 488.662 721 376.538Z" fill="#4285F4"/>
                            <path d="M367.857 736.34C467.179 736.34 550.448 703.54 611.312 647.31L491.925 554.598C459.153 576.688 417.351 590.076 367.857 590.076C272.214 590.076 190.951 525.479 161.857 438.457H39.461V533.512C99.9903 653.669 224.058 736.34 367.857 736.34Z" fill="#34A853"/>
                            <path d="M161.857 438.123C154.5 416.032 150.153 392.603 150.153 368.17C150.153 343.737 154.5 320.308 161.857 298.218V203.163H39.461C14.3799 252.699 0 308.594 0 368.17C0 427.747 14.3799 483.642 39.461 533.177L134.77 458.874L161.857 438.123Z" fill="#FBBC05"/>
                            <path d="M367.857 146.599C422.033 146.599 470.188 165.342 508.646 201.49L613.987 96.059C550.114 36.4823 467.179 0 367.857 0C224.058 0 99.9903 82.671 39.461 203.163L161.857 298.218C190.951 211.196 272.214 146.599 367.857 146.599Z" fill="#EA4335"/>
                          </svg>
                        </Button>
                        <Button variant="outline" type="button" onClick={handleGitHubSignIn}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor" />
                          </svg>
                        </Button>
                      </div>
                      <FieldDescription className="text-center pt-2">
                        Already have an account?{" "}
                        <Link href="/login" className="underline underline-offset-4 font-medium">
                          Sign in
                        </Link>
                      </FieldDescription>
                    </Field>
                  </div>
                </FieldGroup>
              </form>
            ) : (
              /* PHASE 2: Inline 6-Digit OTP Verification Field (Same Screen, Same Card) */
              <form onSubmit={handleVerifyOtpAndSignUp} className={cn("flex flex-col gap-6 animate-fade-in")}>
                <FieldGroup>
                  <div className="flex flex-col gap-2 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
                      <MailCheck className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold">Verify Your Email</h1>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      We've sent a 6-digit verification code to <strong className="text-foreground">{email}</strong>
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="otp" className="text-center w-full block">6-Digit Verification OTP Code</FieldLabel>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="text-center text-xl font-mono tracking-[0.5em] placeholder:tracking-[0.5em] font-bold h-12"
                      autoFocus
                      required
                    />
                    <FieldDescription className="text-center text-xs">
                      Enter the 6-digit code sent to your email
                    </FieldDescription>
                  </Field>

                  <Field>
                    <Button type="submit" className="w-full cursor-pointer" disabled={verifyingOtp || otp.length !== 6}>
                      {verifyingOtp ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Code...
                        </>
                      ) : (
                        "Verify & Continue"
                      )}
                    </Button>
                  </Field>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="inline-flex items-center text-muted-foreground hover:text-foreground cursor-pointer font-medium"
                    >
                      <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Edit Email
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || sendingOtp}
                      className="inline-flex items-center text-primary hover:underline cursor-pointer disabled:text-muted-foreground font-medium"
                    >
                      <RotateCw className={cn("mr-1 h-3.5 w-3.5", sendingOtp && "animate-spin")} />
                      {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend Code"}
                    </button>
                  </div>

                </FieldGroup>
              </form>
            )}

            <p className="px-2 text-center text-xs text-muted-foreground leading-relaxed">
              By continuing, you agree to our{" "}
              <Link
                href="/docs/terms-of-service"
                className="underline underline-offset-4 hover:text-foreground font-medium transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/docs/privacy-policy"
                className="underline underline-offset-4 hover:text-foreground font-medium transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>

          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/assets/illustrations/kid.svg"
            alt="VidyaSchool Logo"
            width={400}
            height={400}
            className="object-contain animate-fade-in"
          />
        </div>
      </div>
    </div>
  )
}
