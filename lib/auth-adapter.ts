/**
 * Custom Auth.js Database Adapter for Neon PostgreSQL
 * 
 * Implements the Auth.js Adapter interface using the existing
 * Neon SQL tagged template from lib/db.ts.
 * 
 * Integrates credit provisioning: new users automatically receive
 * 100 free credits and a signup_bonus transaction.
 */

import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from "next-auth/adapters"
import type { VerificationToken } from "next-auth/adapters"
import { sql } from "@/lib/db"

export function NeonAdapter(): Adapter {
  return {
    // ─── USER METHODS ──────────────────────────────────────────

    async createUser(user) {
      console.log("[Auth Adapter] createUser:", user.email)

      const result = await sql`
        INSERT INTO users (email, name, image, email_verified)
        VALUES (${user.email}, ${user.name ?? null}, ${user.image ?? null}, ${user.emailVerified ?? null})
        RETURNING id, email, name, image, email_verified
      `
      const row = (Array.isArray(result) ? result[0] : (result as any).rows?.[0]) as any

      // Auto-provision 100 free credits for new users
      try {
        await sql`
          INSERT INTO credits (user_id, total, used, remaining)
          VALUES (${row.id}, 100, 0, 100)
        `
        await sql`
          INSERT INTO transactions (user_id, type, credits, description)
          VALUES (${row.id}, 'signup_bonus', 100, 'Welcome bonus - 100 free QR credits')
        `
        console.log("[Auth Adapter] ✅ Provisioned 100 free credits for user:", row.id)
      } catch (creditError) {
        console.error("[Auth Adapter] ⚠️ Failed to provision credits:", creditError)
        // Don't fail user creation if credit provisioning fails
      }

      return {
        id: String(row.id),
        email: row.email,
        name: row.name,
        image: row.image,
        emailVerified: row.email_verified ? new Date(row.email_verified) : null,
      }
    },

    async getUser(id) {
      console.log("[Auth Adapter] getUser:", id)
      const result = await sql`
        SELECT id, email, name, image, email_verified FROM users WHERE id = ${Number(id)}
      `
      const row = (Array.isArray(result) ? result[0] : (result as any).rows?.[0]) as any
      if (!row) return null
      return {
        id: String(row.id),
        email: row.email,
        name: row.name,
        image: row.image,
        emailVerified: row.email_verified ? new Date(row.email_verified) : null,
      }
    },

    async getUserByEmail(email) {
      console.log("[Auth Adapter] getUserByEmail:", email)
      const result = await sql`
        SELECT id, email, name, image, email_verified FROM users WHERE email = ${email}
      `
      const row = (Array.isArray(result) ? result[0] : (result as any).rows?.[0]) as any
      if (!row) return null
      return {
        id: String(row.id),
        email: row.email,
        name: row.name,
        image: row.image,
        emailVerified: row.email_verified ? new Date(row.email_verified) : null,
      }
    },

    async getUserByAccount({ providerAccountId, provider }) {
      console.log("[Auth Adapter] getUserByAccount:", provider, providerAccountId)
      const result = await sql`
        SELECT u.id, u.email, u.name, u.image, u.email_verified
        FROM users u
        INNER JOIN accounts a ON a.user_id = u.id
        WHERE a.provider = ${provider} AND a.provider_account_id = ${providerAccountId}
      `
      const row = (Array.isArray(result) ? result[0] : (result as any).rows?.[0]) as any
      if (!row) return null
      return {
        id: String(row.id),
        email: row.email,
        name: row.name,
        image: row.image,
        emailVerified: row.email_verified ? new Date(row.email_verified) : null,
      }
    },

    async updateUser(user) {
      console.log("[Auth Adapter] updateUser:", user.id)
      const result = await sql`
        UPDATE users SET
          name = COALESCE(${user.name ?? null}, name),
          email = COALESCE(${user.email ?? null}, email),
          image = COALESCE(${user.image ?? null}, image),
          email_verified = COALESCE(${user.emailVerified ?? null}, email_verified),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${Number(user.id)}
        RETURNING id, email, name, image, email_verified
      `
      const row = (Array.isArray(result) ? result[0] : (result as any).rows?.[0]) as any
      return {
        id: String(row.id),
        email: row.email,
        name: row.name,
        image: row.image,
        emailVerified: row.email_verified ? new Date(row.email_verified) : null,
      }
    },

    async deleteUser(userId) {
      console.log("[Auth Adapter] deleteUser:", userId)
      await sql`DELETE FROM users WHERE id = ${Number(userId)}`
    },

    // ─── ACCOUNT (OAUTH) METHODS ───────────────────────────────

    async linkAccount(account) {
      console.log("[Auth Adapter] linkAccount:", account.provider, "for user:", account.userId)
      await sql`
        INSERT INTO accounts (
          user_id, type, provider, provider_account_id,
          refresh_token, access_token, expires_at,
          token_type, scope, id_token, session_state
        ) VALUES (
          ${Number(account.userId)}, ${account.type}, ${account.provider}, ${account.providerAccountId},
          ${account.refresh_token ?? null}, ${account.access_token ?? null}, ${account.expires_at ?? null},
          ${account.token_type ?? null}, ${account.scope ?? null}, ${account.id_token ?? null}, ${account.session_state ?? null}
        )
        ON CONFLICT (provider, provider_account_id) DO NOTHING
      `
    },

    async unlinkAccount({ providerAccountId, provider }) {
      console.log("[Auth Adapter] unlinkAccount:", provider, providerAccountId)
      await sql`
        DELETE FROM accounts
        WHERE provider = ${provider} AND provider_account_id = ${providerAccountId}
      `
    },

    // ─── SESSION METHODS ───────────────────────────────────────

    async createSession(session) {
      console.log("[Auth Adapter] createSession for user:", session.userId)
      const result = await sql`
        INSERT INTO sessions (session_token, user_id, expires)
        VALUES (${session.sessionToken}, ${Number(session.userId)}, ${session.expires})
        RETURNING session_token, user_id, expires
      `
      const row = (Array.isArray(result) ? result[0] : (result as any).rows?.[0]) as any
      return {
        sessionToken: row.session_token,
        userId: String(row.user_id),
        expires: new Date(row.expires),
      }
    },

    async getSessionAndUser(sessionToken) {
      console.log("[Auth Adapter] getSessionAndUser:", sessionToken?.substring(0, 8) + "...")
      const result = await sql`
        SELECT 
          s.session_token, s.user_id, s.expires,
          u.id as u_id, u.email, u.name, u.image, u.email_verified
        FROM sessions s
        INNER JOIN users u ON u.id = s.user_id
        WHERE s.session_token = ${sessionToken}
          AND s.expires > CURRENT_TIMESTAMP
      `
      const row = (Array.isArray(result) ? result[0] : (result as any).rows?.[0]) as any
      if (!row) return null

      return {
        session: {
          sessionToken: row.session_token,
          userId: String(row.user_id),
          expires: new Date(row.expires),
        },
        user: {
          id: String(row.u_id),
          email: row.email,
          name: row.name,
          image: row.image,
          emailVerified: row.email_verified ? new Date(row.email_verified) : null,
        },
      }
    },

    async updateSession(session) {
      console.log("[Auth Adapter] updateSession:", session.sessionToken?.substring(0, 8) + "...")
      const result = await sql`
        UPDATE sessions SET
          expires = COALESCE(${session.expires ?? null}, expires),
          user_id = COALESCE(${session.userId ? Number(session.userId) : null}, user_id)
        WHERE session_token = ${session.sessionToken}
        RETURNING session_token, user_id, expires
      `
      const row = (Array.isArray(result) ? result[0] : (result as any).rows?.[0]) as any
      if (!row) return null

      return {
        sessionToken: row.session_token,
        userId: String(row.user_id),
        expires: new Date(row.expires),
      }
    },

    async deleteSession(sessionToken) {
      console.log("[Auth Adapter] deleteSession:", sessionToken?.substring(0, 8) + "...")
      await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`
    },

    // ─── VERIFICATION TOKEN METHODS (Magic Link) ──────────────

    async createVerificationToken(token) {
      console.log("[Auth Adapter] createVerificationToken for:", token.identifier)
      const result = await sql`
        INSERT INTO verification_tokens (identifier, token, expires)
        VALUES (${token.identifier}, ${token.token}, ${token.expires})
        RETURNING identifier, token, expires
      `
      const row = (Array.isArray(result) ? result[0] : (result as any).rows?.[0]) as any
      return {
        identifier: row.identifier,
        token: row.token,
        expires: new Date(row.expires),
      }
    },

    async useVerificationToken({ identifier, token }) {
      console.log("[Auth Adapter] useVerificationToken for:", identifier)
      try {
        // Select then delete (one-time use)
        const result = await sql`
          DELETE FROM verification_tokens
          WHERE identifier = ${identifier} AND token = ${token}
          RETURNING identifier, token, expires
        `
        const row = (Array.isArray(result) ? result[0] : (result as any).rows?.[0]) as any
        if (!row) return null
        return {
          identifier: row.identifier,
          token: row.token,
          expires: new Date(row.expires),
        }
      } catch {
        return null
      }
    },
  }
}
