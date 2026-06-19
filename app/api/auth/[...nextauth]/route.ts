/**
 * Auth.js API Route Handler (NextAuth v5)
 * 
 * Catch-all route for all auth endpoints:
 *   GET  /api/auth/signin
 *   GET  /api/auth/signout
 *   GET  /api/auth/callback/:provider
 *   GET  /api/auth/csrf
 *   GET  /api/auth/providers
 *   GET  /api/auth/session
 *   POST /api/auth/signin/:provider
 *   POST /api/auth/signout
 *   POST /api/auth/callback/:provider
 */

import { handlers } from "@/auth"

export const { GET, POST } = handlers
