/**
 * Next.js Middleware for Route Protection
 * 
 * Uses Auth.js to check authentication on protected routes.
 * Unauthenticated users are redirected to /login.
 * Public routes (auth pages, webhooks, cron) are exempt.
 */

export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - /api/auth (Auth.js routes)
     * - /api/webhooks (Stripe webhooks)
     * - /api/cron (scheduled jobs)
     * - /login, /register, /forgot-password, /reset-password (auth pages)
     * - /_next/static, /_next/image (Next.js internals)
     * - /favicon.ico, /robots.txt, /sitemap.xml (static files)
     */
    "/((?!api/auth|api/webhooks|api/cron|login|register|forgot-password|reset-password|_next/static|_next/image|favicon\\.ico|favicon\\.png|robots\\.txt|sitemap\\.xml).*)",
  ],
}
