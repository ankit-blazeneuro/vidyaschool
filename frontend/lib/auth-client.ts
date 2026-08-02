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
