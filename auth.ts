/**
 * Auth.js (NextAuth v5) Configuration
 * 
 * Providers:
 *   - Google OAuth 2.0
 *   - GitHub OAuth 2.0
 *   - Resend (Magic Link / Passwordless Email)
 *   - Credentials (Legacy — password-based, kept during migration)
 * 
 * Adapter: Custom Neon PostgreSQL adapter (lib/auth-adapter.ts)
 * Session Strategy: Database sessions
 */

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Resend from "next-auth/providers/resend"
import Credentials from "next-auth/providers/credentials"
import { NeonAdapter } from "@/lib/auth-adapter"
import { sendMagicLinkEmail } from "@/lib/auth-email"
import bcrypt from "bcryptjs"
import { sql } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: NeonAdapter(),
  session: { strategy: "jwt" },
  trustHost: true,

  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login?verify=true", // shown after magic link is sent
  },

  providers: [
    // ─── Google OAuth 2.0 ──────────────────────────────────
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // ─── GitHub OAuth 2.0 ──────────────────────────────────
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // ─── Resend Magic Link ─────────────────────────────────
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "QR Noir Tech <onboarding@resend.dev>",
      sendVerificationRequest: async ({ identifier, url }) => {
        await sendMagicLinkEmail(identifier, url)
      },
    }),

    // ─── Legacy Credentials (Password) ─────────────────────
    // Kept during migration for existing email+password users
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string

        if (!email || !password) return null

        console.log("[Auth] Credentials login attempt:", email)

        try {
          const result = await sql`
            SELECT id, email, name, image, password_hash 
            FROM users WHERE email = ${email}
          `
          const user = (Array.isArray(result) ? result[0] : (result as any).rows?.[0]) as any

          if (!user?.password_hash) {
            console.log("[Auth] No password hash found for:", email)
            return null
          }

          const isValid = await bcrypt.compare(password, user.password_hash)
          if (!isValid) {
            console.log("[Auth] Invalid password for:", email)
            return null
          }

          console.log("[Auth] ✅ Credentials login successful:", email)
          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error("[Auth] Credentials login error:", error)
          return null
        }
      },
    }),
  ],

  callbacks: {
    // Add user info to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },

    // Include user ID in the session (from JWT)
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string
      }
      return session
    },

    // Control sign-in behavior
    async signIn({ user, account }) {
      console.log("[Auth] signIn callback:", account?.provider, user?.email)
      return true
    },
  },

  events: {
    async createUser({ user }) {
      console.log("[Auth Event] New user created:", user.email, "| ID:", user.id)
    },
    async signIn({ user, account }) {
      console.log("[Auth Event] User signed in:", user.email, "via", account?.provider)
    },
    async signOut(message) {
      console.log("[Auth Event] User signed out")
    },
    async linkAccount({ user, account }) {
      console.log("[Auth Event] Account linked:", account.provider, "for user:", user.email)
    },
  },

  debug: process.env.NODE_ENV === "development",
})
