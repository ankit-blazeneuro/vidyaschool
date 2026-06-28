"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [preferredRole, setPreferredRole] = useState<"student" | "teacher">("student")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data } = await authClient.signUp.email({
        name,
        email,
        password,
        preferredRole,
      })
      
      if (preferredRole === "teacher" && data?.user?.id) {
        await fetch("/api/admin/teacher-requests/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id, preferredRole })
        })
      }
      
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to sign up")
    } finally {
      setLoading(false)
    }
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

  if (success) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-sm text-balance text-muted-foreground">
              We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to verify your account.
            </p>
          </div>
          <Button asChild>
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </div>
      </div>
    )
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
            <form onSubmit={handleSignUp} className={cn("flex flex-col gap-6")}>
              <FieldGroup>
                <div className="flex flex-col gap-2 text-center">
                  <h1 className="text-2xl font-bold">Create an account</h1>
                  <p className="text-balance text-sm text-muted-foreground">
                    Enter your details to create your account
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
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="role">Preferred Role</FieldLabel>
                  <Select value={preferredRole} onValueChange={(value: "student" | "teacher") => setPreferredRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                  {preferredRole === "teacher" && (
                    <FieldDescription>
                      Teacher accounts require admin approval
                    </FieldDescription>
                  )}
                </Field>
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                <Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create account"}
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
                    Already have an account?{" "}
                    <Link href="/login" className="underline underline-offset-4">
                      Sign in
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </div>
        </div>
      </div>
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
    </div>
  )
}
