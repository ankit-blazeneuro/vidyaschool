import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

// Always resolve to the actual origin at runtime so auth works on every
// Vercel deployment URL (preview, production, PR previews) — not just the
// one baked into NEXT_PUBLIC_APP_URL at build time.
const getBaseURL = () => {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: 'string', required: false },
        preferredRole: { type: 'string', required: false },
        teacherApprovalStatus: { type: 'string', required: false }
      }
    })
  ]
})

export const { signIn, signUp, signOut, useSession } = authClient

export async function logoutUser() {
  try {
    await fetch("/api/auth/logout", { method: "POST" })
  } catch (e) {}

  try {
    await authClient.signOut()
  } catch (e) {}

  if (typeof document !== 'undefined') {
    document.cookie = "better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "__Secure-better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  try {
    if (typeof localStorage !== 'undefined') localStorage.clear()
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear()
  } catch (e) {}

  window.location.href = "/login"
}
