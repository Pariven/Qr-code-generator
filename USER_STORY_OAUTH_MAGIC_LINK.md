# User Story: Convert Authentication to OAuth 2.0 & Magic Link

> **Project:** Noir QR Code Generator  
> **Created:** 2026-02-21  
> **Priority:** High  
> **Estimated Effort:** Large (3–5 sprints)

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Identified Gaps & Risks](#2-identified-gaps--risks)
3. [Target Architecture](#3-target-architecture)
4. [Epic & User Stories](#4-epic--user-stories)
5. [Database Migration Plan](#5-database-migration-plan)
6. [Technical Implementation Guide](#6-technical-implementation-guide)
7. [Acceptance Criteria](#7-acceptance-criteria)
8. [Migration & Rollback Strategy](#8-migration--rollback-strategy)
9. [Environment Variables](#9-environment-variables)

---

## 1. Current Architecture Analysis

### 1.1 Authentication Method

| Aspect | Current Implementation |
|--------|----------------------|
| **Sign Up** | Email + password (bcryptjs, 10 salt rounds) via `POST /api/auth/register` |
| **Sign In** | Email + password via `POST /api/auth/login` |
| **Forgot Password** | Token-based reset via Resend email (`POST /api/auth/forgot-password`) |
| **Reset Password** | Token validation + password update (`POST /api/auth/reset-password`) |
| **Session** | `iron-session` v8 — encrypted HttpOnly cookie (`noir_qr_session`, 7‑day TTL) |
| **Database** | Neon PostgreSQL (serverless) — `users`, `credits`, `transactions` tables |
| **Email** | Resend SDK (password‑reset only; no email verification on signup) |
| **OAuth** | ❌ None |
| **MFA / Magic Link** | ❌ None |
| **Middleware** | ❌ No `middleware.ts` — no server‑side route protection |

### 1.2 Existing Auth File Map

```
app/
├── api/auth/
│   ├── login/route.ts          # POST — email/password login
│   ├── register/route.ts       # POST — email/password registration + 100 free credits
│   ├── logout/route.ts         # POST — session.destroy()
│   ├── session/route.ts        # GET  — return current session data
│   ├── forgot-password/route.ts     # POST — generate reset token + send email
│   ├── reset-password/route.ts      # POST — validate token + update password
│   └── verify-reset-token/route.ts  # POST — check token validity/expiry
├── login/page.tsx              # Sign In form (client component)
├── register/page.tsx           # Sign Up form (client component)
├── forgot-password/page.tsx    # Forgot password form
└── reset-password/page.tsx     # Reset password form (reads ?token= from URL)

lib/
├── session.ts       # iron-session config (SessionData interface, cookie options)
├── db.ts            # Neon PostgreSQL driver, schema init (users/credits/transactions)
├── email.ts         # Resend SDK — sendPasswordResetEmail()
├── credits.ts       # Client-side credit helpers + pricing tiers
├── stripe.ts        # Client-side Stripe.js loader
└── stripe-server.ts # Server-side Stripe instance

components/
├── header.tsx                 # Fetches /api/auth/session → show user menu or sign in/up
└── credit-balance-display.tsx # Fetches session + credits, polls every 10s
```

### 1.3 Database Schema (Current)

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,      -- bcryptjs hash
  name VARCHAR(255),
  reset_token VARCHAR(255),                 -- password reset token
  reset_token_expiry TIMESTAMP,             -- 1-hour expiry
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  total INTEGER DEFAULT 100,
  used INTEGER DEFAULT 0,
  remaining INTEGER DEFAULT 100,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) DEFAULT 0,
  credits INTEGER NOT NULL,
  description TEXT,
  stripe_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.4 Session Data Shape

```typescript
interface SessionData {
  userId?: number
  email?: string
  name?: string
  isLoggedIn: boolean
}
```

### 1.5 Frontend Auth Pattern

- **No global auth context** — every component independently fetches `GET /api/auth/session`
- `Header` → fetches session on mount → displays user dropdown or sign‑in buttons
- `CreditBalanceDisplay` → fetches session on mount + 10s polling
- `page.tsx` (home) → `checkAuth()` on mount → gates QR generation behind `isAuthenticated`
- Navigation after auth actions: `router.push("/")` + `router.refresh()`

### 1.6 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `iron-session` | ^8.0.4 | Encrypted cookie sessions |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `@neondatabase/serverless` | ^0.10.4 | PostgreSQL driver |
| `resend` | (imported, not in package.json) | Email delivery |
| `nodemailer` | ^8.0.1 | Listed but unused |
| `next` | ^16.0.7 | Framework |
| `stripe` / `@stripe/stripe-js` | ^17.5.0 / ^4.10.0 | Payments |

---

## 2. Identified Gaps & Risks

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| 1 | **No OAuth 2.0** — users must create & remember a password | High | Friction → lower conversion |
| 2 | **No Magic Link** — no passwordless auth option | High | Users with password fatigue cannot use the app frictionlessly |
| 3 | **No email verification** at signup — any email accepted | High | Spam accounts, credit abuse |
| 4 | **No Next.js middleware** — all auth checks are client‑side | Medium | Unauthenticated users can view protected pages briefly |
| 5 | **No CSRF protection** — relies on SameSite defaults only | Medium | Potential cross‑site attacks |
| 6 | **Session secret has hardcoded fallback** — `SESSION_SECRET` not enforced | High | Sessions can be forged if env var missing |
| 7 | **No rate limiting** on login/register/forgot‑password | Medium | Brute force / credential stuffing risk |
| 8 | **`resend` not in package.json** — may fail at runtime | Medium | Password reset emails silently fail |
| 9 | **No account linking** — switching auth method would create duplicate accounts | High | Must handle in migration |
| 10 | **Dual credit system** — localStorage in `lib/credits.ts` + DB via API | Low | Dead code, potential confusion |

---

## 3. Target Architecture

### 3.1 Auth Provider: NextAuth.js v5 (Auth.js)

**Why NextAuth.js (Auth.js)?**
- First‑party Next.js integration (App Router native)
- Built‑in OAuth 2.0 providers (Google, GitHub, Microsoft, etc.)
- Built‑in Email/Magic Link provider
- Database adapter for PostgreSQL (via Drizzle or custom Neon adapter)
- Automatic session management (JWT or database sessions)
- Built‑in CSRF protection
- Built‑in middleware support for route protection
- Active maintenance, large community

### 3.2 High‑Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐    │
│  │ Sign In  │  │ Sign Up  │  │   Protected Pages    │    │
│  │  Page    │  │  Page    │  │  (QR Generator, etc) │    │
│  └────┬─────┘  └────┬─────┘  └──────────┬──────────┘    │
│       │              │                   │               │
│       ▼              ▼                   ▼               │
│  ┌──────────────────────────────────────────────────┐    │
│  │          SessionProvider (Auth.js)                │    │
│  │     useSession() — global auth state              │    │
│  └──────────────────────┬───────────────────────────┘    │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   NEXT.JS MIDDLEWARE                      │
│                                                          │
│  middleware.ts                                           │
│  ├── Protect routes: /, /api/credits/*, /api/qr/*       │
│  ├── Redirect unauthenticated → /login                  │
│  └── Allow public: /login, /register, /api/auth/*       │
└──────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   AUTH.JS (NextAuth v5)                   │
│                                                          │
│  app/api/auth/[...nextauth]/route.ts                    │
│                                                          │
│  Providers:                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Google     │  │   GitHub     │  │   Email /     │  │
│  │  OAuth 2.0   │  │  OAuth 2.0   │  │  Magic Link   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘  │
│         │                 │                  │           │
│         ▼                 ▼                  ▼           │
│  ┌──────────────────────────────────────────────────┐    │
│  │        Credentials Provider (Legacy)              │    │
│  │   (Kept for backward compat during migration)     │    │
│  └──────────────────────┬───────────────────────────┘    │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                     DATABASE                             │
│               Neon PostgreSQL                            │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐              │
│  │  users   │  │ accounts │  │  sessions │              │
│  │(extended)│  │  (new)   │  │  (new)    │              │
│  └──────────┘  └──────────┘  └───────────┘              │
│                                                          │
│  ┌───────────────────┐  ┌──────────────┐                 │
│  │ verification_token│  │   credits    │                 │
│  │      (new)        │  │ (existing)   │                 │
│  └───────────────────┘  └──────────────┘                 │
│                                                          │
│  ┌──────────────┐                                        │
│  │ transactions │                                        │
│  │  (existing)  │                                        │
│  └──────────────┘                                        │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Auth Methods After Migration

| Method | Provider | How It Works |
|--------|----------|-------------|
| **Google OAuth 2.0** | `GoogleProvider` | "Sign in with Google" button → Google consent → callback → account linked |
| **GitHub OAuth 2.0** | `GitHubProvider` | "Sign in with GitHub" button → GitHub consent → callback → account linked |
| **Magic Link (Email)** | `EmailProvider` | Enter email → receive magic link → click → authenticated (no password) |
| **Email + Password** (legacy, optional) | `CredentialsProvider` | Kept during migration for existing users; deprecated after transition |

---

## 4. Epic & User Stories

### EPIC: AUTH-OAUTH — Convert Authentication to OAuth 2.0 & Magic Link

---

#### Story 1: Install & Configure Auth.js (NextAuth v5)

**As a** developer,  
**I want to** install and configure Auth.js v5 with the Next.js App Router,  
**So that** the application has a modern, extensible authentication foundation.

**Tasks:**
- [ ] Install `next-auth@beta` (v5), `@auth/core`, `@auth/pg-adapter` (or custom Neon adapter)
- [ ] Create `auth.ts` configuration file at project root
- [ ] Create `app/api/auth/[...nextauth]/route.ts` catch-all route
- [ ] Configure `AUTH_SECRET` environment variable (replace `SESSION_SECRET`)
- [ ] Set `AUTH_URL` / `NEXTAUTH_URL` for callback URLs
- [ ] Add `SessionProvider` wrapper in `app/layout.tsx`
- [ ] Configure `trustHost: true` for Vercel deployment
- [ ] Remove `iron-session` dependency after full migration

**Acceptance Criteria:**
- Auth.js initializes without errors
- `/api/auth/providers` returns the list of configured providers
- `/api/auth/csrf` returns a CSRF token
- `SessionProvider` wraps the app and `useSession()` returns session data

---

#### Story 2: Implement Google OAuth 2.0 Provider

**As a** user,  
**I want to** sign in with my Google account,  
**So that** I don't need to create and remember a separate password.

**Tasks:**
- [ ] Register OAuth 2.0 app in Google Cloud Console
- [ ] Configure authorized redirect URI: `{APP_URL}/api/auth/callback/google`
- [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to environment
- [ ] Add `GoogleProvider` to Auth.js config
- [ ] Add "Sign in with Google" button to login page with Google brand icon
- [ ] Add "Sign up with Google" button to register page
- [ ] Handle `signIn` callback — link new OAuth account to existing user if email matches
- [ ] Handle first-time OAuth sign-up: auto-create `credits` row (100 free) + `signup_bonus` transaction
- [ ] Map Google profile fields → `users` table: `name`, `email`, `image`
- [ ] Test: existing email+password user links Google account successfully
- [ ] Test: new Google user gets 100 free credits

**Acceptance Criteria:**
- Clicking "Sign in with Google" redirects to Google consent screen
- After consent, user is redirected back and authenticated
- User profile (name, email, avatar) is stored in DB
- New Google users receive 100 free credits
- Existing users with the same email can link their Google account
- Session contains `userId`, `email`, `name`, `image`

---

#### Story 3: Implement GitHub OAuth 2.0 Provider

**As a** user,  
**I want to** sign in with my GitHub account,  
**So that** I can authenticate quickly using my developer identity.

**Tasks:**
- [ ] Register OAuth app in GitHub Developer Settings
- [ ] Configure callback URL: `{APP_URL}/api/auth/callback/github`
- [ ] Add `GITHUB_ID` and `GITHUB_SECRET` to environment
- [ ] Add `GitHubProvider` to Auth.js config
- [ ] Add "Sign in with GitHub" button to login page with GitHub icon
- [ ] Handle account linking for matching emails
- [ ] Handle first-time sign-up: auto-create credits + transaction
- [ ] Handle GitHub users with private emails (request `user:email` scope)

**Acceptance Criteria:**
- Clicking "Sign in with GitHub" redirects to GitHub authorization
- After authorization, user is authenticated with profile data
- GitHub users with private emails still resolve correctly
- New GitHub users receive 100 free credits

---

#### Story 4: Implement Magic Link (Passwordless Email) Provider

**As a** user,  
**I want to** sign in by clicking a link sent to my email,  
**So that** I can authenticate without remembering a password.

**Tasks:**
- [ ] Configure `EmailProvider` in Auth.js with Resend as transport
- [ ] Create `verification_tokens` table in database (required by Auth.js Email provider)
- [ ] Create branded magic link email template (consistent with existing reset email branding)
- [ ] Add magic link input form to sign-in page (email field + "Send Magic Link" button)
- [ ] Handle first-time magic link user: auto-create `users` row + credits + transaction
- [ ] Handle returning user: look up by email, skip credit creation
- [ ] Set magic link token expiry to 10 minutes
- [ ] Add `RESEND_API_KEY` to package.json dependencies (fix current gap)
- [ ] Add rate limiting: max 5 magic link requests per email per hour
- [ ] Show "Check your email" confirmation UI after sending

**Acceptance Criteria:**
- User enters email → receives a magic link email within 30 seconds
- Clicking the magic link authenticates the user and redirects to `/`
- Magic links expire after 10 minutes
- Used magic links cannot be reused
- First-time users get a `users` row + 100 free credits + `signup_bonus` transaction
- Rate limiting prevents abuse (5 requests/email/hour)
- Email template matches app branding (dark theme, logo)

---

#### Story 5: Database Schema Migration for Auth.js

**As a** developer,  
**I want to** extend the database schema to support Auth.js adapters,  
**So that** OAuth accounts, sessions, and verification tokens are persisted correctly.

**Tasks:**
- [ ] Create `accounts` table (Auth.js required schema):
  ```sql
  CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,              -- 'oauth' | 'email' | 'credentials'
    provider VARCHAR(255) NOT NULL,          -- 'google' | 'github' | 'email' | 'credentials'
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    UNIQUE(provider, provider_account_id)
  );
  ```
- [ ] Create `sessions` table (if using database sessions instead of JWT):
  ```sql
  CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL
  );
  ```
- [ ] Create `verification_tokens` table:
  ```sql
  CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP NOT NULL,
    PRIMARY KEY (identifier, token)
  );
  ```
- [ ] Alter `users` table:
  ```sql
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP,
    ADD COLUMN IF NOT EXISTS image TEXT,
    ALTER COLUMN password_hash DROP NOT NULL;  -- OAuth users won't have passwords
  ```
- [ ] Create migration script: `scripts/migrate-auth.ts`
- [ ] Create rollback script: `scripts/rollback-auth.ts`
- [ ] Backfill existing users: set `email_verified = created_at` for all current users
- [ ] Create `accounts` entries for existing users: provider=`credentials`, provider_account_id=`email`

**Acceptance Criteria:**
- Migration runs idempotently (safe to run multiple times)
- All existing users retain access after migration
- New tables have proper indexes and foreign keys
- Rollback script can reverse the migration
- Zero data loss for existing `credits` and `transactions` records

---

#### Story 6: Build Custom Auth.js Database Adapter for Neon

**As a** developer,  
**I want to** create a custom Auth.js database adapter that works with our existing Neon PostgreSQL setup,  
**So that** Auth.js can read/write users and sessions using our existing `sql` tagged template.

**Tasks:**
- [ ] Create `lib/auth-adapter.ts` implementing the `Adapter` interface from `@auth/core/adapters`
- [ ] Implement required methods:
  - `createUser(user)` — INSERT into `users` + auto-create credits row + signup_bonus transaction
  - `getUser(id)` — SELECT from `users` by id
  - `getUserByEmail(email)` — SELECT from `users` by email
  - `getUserByAccount({ provider, providerAccountId })` — JOIN `accounts` + `users`
  - `updateUser(user)` — UPDATE `users`
  - `linkAccount(account)` — INSERT into `accounts`
  - `createSession(session)` — INSERT into `sessions` (if using DB sessions)
  - `getSessionAndUser(sessionToken)` — JOIN `sessions` + `users`
  - `updateSession(session)` — UPDATE `sessions`
  - `deleteSession(sessionToken)` — DELETE from `sessions`
  - `createVerificationToken(token)` — INSERT into `verification_tokens`
  - `useVerificationToken({ identifier, token })` — SELECT + DELETE (one-time use)
- [ ] Ensure `createUser` integrates credit system (100 free credits + transaction)
- [ ] Write unit tests for adapter methods

**Acceptance Criteria:**
- Adapter correctly implements all Auth.js `Adapter` interface methods
- Credit provisioning on user creation is automatic
- Existing `sql` tagged template from `lib/db.ts` is reused (no new DB connection)
- All Auth.js flows work end-to-end through the adapter

---

#### Story 7: Update Sign-In Page UI

**As a** user,  
**I want to** see all authentication options on a single, well-designed sign-in page,  
**So that** I can choose my preferred method to authenticate.

**Tasks:**
- [ ] Redesign `app/login/page.tsx`:
  ```
  ┌─────────────────────────────────────┐
  │           Sign In                   │
  │                                     │
  │  ┌─────────────────────────────┐    │
  │  │  🔵 Continue with Google    │    │
  │  └─────────────────────────────┘    │
  │  ┌─────────────────────────────┐    │
  │  │  ⚫ Continue with GitHub    │    │
  │  └─────────────────────────────┘    │
  │                                     │
  │  ───────── or ─────────            │
  │                                     │
  │  Email: [_________________________] │
  │  ┌─────────────────────────────┐    │
  │  │  ✉️ Send Magic Link         │    │
  │  └─────────────────────────────┘    │
  │                                     │
  │  ───────── or ─────────            │
  │                                     │
  │  ▸ Sign in with password            │
  │    (collapsible legacy section)     │
  │    Email: [_______________________] │
  │    Password: [____________________] │
  │    [Forgot password?]               │
  │    [Sign In]                        │
  │                                     │
  │  Don't have an account? Sign Up     │
  └─────────────────────────────────────┘
  ```
- [ ] Use `signIn("google")`, `signIn("github")` from `next-auth/react`
- [ ] Magic link form: call `signIn("email", { email, redirect: false })` → show "Check your email" UI
- [ ] Legacy password login: keep `signIn("credentials", { email, password })` during transition
- [ ] Add proper loading states for each button
- [ ] Add error handling with toast notifications
- [ ] Make the legacy password section collapsible (default: collapsed)

**Acceptance Criteria:**
- All three auth methods (Google, GitHub, Magic Link) are visible and functional
- Legacy password login is available but de-emphasized (collapsible)
- Loading spinners during OAuth redirects
- Error messages display correctly for all failure scenarios
- Responsive design matches existing app theme (dark theme, Geist font)

---

#### Story 8: Update Sign-Up Page UI

**As a** new user,  
**I want to** see OAuth and Magic Link options on the sign-up page,  
**So that** I can create an account without setting a password.

**Tasks:**
- [ ] Redesign `app/register/page.tsx`:
  - Add "Sign up with Google" and "Sign up with GitHub" buttons (same `signIn()` flow)
  - Add "Sign up with Magic Link" — email field + send button
  - Keep legacy email+password form as collapsible section
  - Retain "100 FREE QR credits" messaging
- [ ] Ensure OAuth sign-up and magic link sign-up both trigger credit provisioning via the adapter
- [ ] Add "Already have an account? Sign in" link

**Acceptance Criteria:**
- New users can register via Google, GitHub, or Magic Link
- All new accounts receive 100 free credits regardless of auth method
- Legacy password registration remains available during transition
- "100 free credits" messaging is visible

---

#### Story 9: Create Next.js Middleware for Route Protection

**As a** developer,  
**I want to** add server-side route protection via Next.js middleware,  
**So that** unauthenticated users are redirected before the page renders.

**Tasks:**
- [ ] Create `middleware.ts` at project root
- [ ] Use Auth.js `auth()` helper (or `getToken()`) to check authentication
- [ ] Define protected route matchers:
  ```typescript
  export const config = {
    matcher: [
      '/',                      // Home/generator page
      '/success/:path*',        // Payment success
      '/api/credits/:path*',    // Credit API routes
      '/api/create-checkout-session', 
      '/api/verify-payment',
    ]
  }
  ```
- [ ] Define public routes (no redirect):
  ```
  /login, /register, /forgot-password, /reset-password,
  /api/auth/*, /api/webhooks/*, /api/cron/*
  ```
- [ ] Redirect unauthenticated users to `/login?callbackUrl={original_url}`
- [ ] After successful auth, redirect to the original `callbackUrl`

**Acceptance Criteria:**
- Unauthenticated requests to protected routes redirect to `/login`
- Public routes remain accessible without authentication
- `callbackUrl` parameter is preserved and used after login
- API routes return 401 instead of redirecting
- No middleware runs on static assets (`_next/static`, `favicon.ico`, etc.)

---

#### Story 10: Implement Account Linking & Conflict Resolution

**As a** user who signed up with email+password,  
**I want to** link my Google/GitHub account to my existing account,  
**So that** I can use OAuth without losing my credits and history.

**Tasks:**
- [ ] Implement `signIn` callback in Auth.js config:
  - If OAuth email matches an existing `users` row → link the account (insert `accounts` row)
  - If the existing account has a different provider → link as additional provider
  - Prevent creating duplicate `users` rows for the same email
- [ ] Implement account linking page (`/account/settings` or within profile):
  - Show connected providers
  - Allow linking additional providers
  - Allow unlinking providers (if at least one auth method remains)
- [ ] Handle edge case: GitHub user with private email that doesn't match
- [ ] Handle edge case: Google user changes their primary email

**Acceptance Criteria:**
- User with email+password can sign in with Google (same email) and accounts merge
- Credits and transactions are preserved after linking
- User can see which providers are linked to their account
- User cannot unlink all auth methods (at least one must remain)
- No duplicate user records are created

---

#### Story 11: Update Session Management & Frontend Auth State

**As a** developer,  
**I want to** replace all manual session fetches with Auth.js `useSession()`,  
**So that** auth state is consistent and reactive across all components.

**Tasks:**
- [ ] Add `SessionProvider` to `app/layout.tsx`
- [ ] Update `components/header.tsx`:
  - Replace `fetch("/api/auth/session")` → `useSession()`
  - Replace `fetch("/api/auth/logout")` → `signOut()` from `next-auth/react`
  - Display user avatar from `session.user.image` (for OAuth users)
- [ ] Update `components/credit-balance-display.tsx`:
  - Replace session fetch → `useSession()`
  - Remove 10s polling for session (useSession auto-syncs)
  - Keep 10s polling for credit balance only
- [ ] Update `app/page.tsx`:
  - Replace `checkAuth()` fetch → `useSession()`
  - Use `status` ("loading" | "authenticated" | "unauthenticated") for loading states
- [ ] Remove `lib/session.ts` (iron-session config) after full migration
- [ ] Remove `iron-session` from `package.json`
- [ ] Remove `bcryptjs` from `package.json` (after all password users migrate or if credentials provider still needs it, keep it)
- [ ] Update session data shape to include `image` field for avatars

**Acceptance Criteria:**
- No component directly fetches `/api/auth/session` anymore
- `useSession()` provides reactive auth state everywhere
- Session updates (login/logout) reflect immediately without page refresh
- User avatar displays for OAuth users
- No regression in credit balance display

---

#### Story 12: Update Forgot Password & Reset Password Flows

**As a** user with a password-based account,  
**I want to** still be able to reset my password,  
**So that** legacy accounts remain fully functional during the transition.

**Tasks:**
- [ ] Keep `app/forgot-password/page.tsx` functional for legacy users
- [ ] Keep `app/reset-password/page.tsx` functional
- [ ] Add messaging: "You can also sign in with Google, GitHub, or a Magic Link instead of resetting your password"
- [ ] On forgot-password page, offer magic link as alternative:
  - "Instead of resetting your password, we can send you a magic link to sign in instantly"
- [ ] Keep API routes: `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/verify-reset-token`
- [ ] Mark as deprecated in code comments for future removal

**Acceptance Criteria:**
- Existing password reset flow works unchanged
- New messaging encourages users to try magic link instead
- Code is marked as deprecated

---

#### Story 13: Magic Link Email Template & Branding

**As a** user,  
**I want to** receive a branded, professional magic link email,  
**So that** I trust the email is legitimate and know what to do.

**Tasks:**
- [ ] Create magic link email template in Auth.js Email provider config:
  ```
  Subject: "Sign in to Noir QR Generator"
  Body:
  - App logo / header
  - "Click the button below to sign in to your account"
  - [Sign In] button with the magic link URL
  - "This link expires in 10 minutes"
  - "If you didn't request this, you can safely ignore this email"
  - Footer with app info
  ```
- [ ] Use Resend's HTML email support (consistent with existing `sendPasswordResetEmail` style)
- [ ] Add plain-text alternative
- [ ] Test email delivery in both development (console fallback) and production (Resend)

**Acceptance Criteria:**
- Magic link email matches app branding (dark theme, consistent with password reset email)
- Email has both HTML and plain-text versions
- Subject line is clear and recognizable
- Magic link button is prominent and functional
- Expiry notice is visible
- Email renders correctly in Gmail, Outlook, Apple Mail

---

#### Story 14: Remove Legacy Auth Code (Post-Migration)

**As a** developer,  
**I want to** remove deprecated authentication code after all users have migrated,  
**So that** the codebase is clean and maintainable.

**Tasks:**
- [ ] Remove `app/api/auth/login/route.ts` (replaced by Auth.js credentials provider)
- [ ] Remove `app/api/auth/register/route.ts` (replaced by Auth.js adapter + OAuth)
- [ ] Remove `app/api/auth/logout/route.ts` (replaced by Auth.js `signOut`)
- [ ] Remove `app/api/auth/session/route.ts` (replaced by Auth.js session)
- [ ] Remove `app/api/auth/forgot-password/route.ts` (replaced by magic link)
- [ ] Remove `app/api/auth/reset-password/route.ts` (replaced by magic link)
- [ ] Remove `app/api/auth/verify-reset-token/route.ts`
- [ ] Remove `lib/session.ts` (iron-session config)
- [ ] Clean up `lib/email.ts` — remove `sendPasswordResetEmail`, keep only magic link template
- [ ] Remove `password_hash`, `reset_token`, `reset_token_expiry` columns from `users` table
- [ ] Remove `bcryptjs` and `iron-session` from `package.json`
- [ ] Remove `@types/bcryptjs` from devDependencies
- [ ] Remove `nodemailer` from `package.json` (unused)
- [ ] Remove `lib/credits.ts` localStorage fallback code (dead code)
- [ ] Remove `CredentialsProvider` from Auth.js config
- [ ] Update all documentation (README, QUICK_START, etc.)

**Acceptance Criteria:**
- Zero references to `iron-session`, `bcryptjs`, or legacy auth routes remain
- All tests pass
- App functions correctly with only OAuth + Magic Link
- Package size is reduced

---

## 5. Database Migration Plan

### Phase 1: Schema Extension (Non-Breaking)

```sql
-- Run via scripts/migrate-auth.ts

-- 1. Add new columns to users (non-breaking, all nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  UNIQUE(provider, provider_account_id)
);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- 3. Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- 4. Create verification_tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- 5. Backfill existing users
UPDATE users SET email_verified = created_at WHERE email_verified IS NULL AND password_hash IS NOT NULL;

-- 6. Create account entries for existing password users
INSERT INTO accounts (user_id, type, provider, provider_account_id)
SELECT id, 'credentials', 'credentials', email
FROM users
WHERE password_hash IS NOT NULL
ON CONFLICT (provider, provider_account_id) DO NOTHING;
```

### Phase 2: Cleanup (After Full Migration)

```sql
-- Only after confirming no users rely on password auth
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users DROP COLUMN IF EXISTS reset_token;
ALTER TABLE users DROP COLUMN IF EXISTS reset_token_expiry;
```

---

## 6. Technical Implementation Guide

### 6.1 New File Structure

```
app/
├── api/auth/
│   ├── [...nextauth]/route.ts    # NEW: Auth.js catch-all handler
│   ├── login/route.ts            # DEPRECATED: kept during transition
│   ├── register/route.ts         # DEPRECATED: kept during transition
│   └── ... (existing routes kept during transition)
├── login/page.tsx                # MODIFIED: add OAuth + Magic Link buttons
├── register/page.tsx             # MODIFIED: add OAuth + Magic Link buttons
└── layout.tsx                    # MODIFIED: wrap with SessionProvider

auth.ts                           # NEW: Auth.js configuration (project root)
middleware.ts                     # NEW: Route protection

lib/
├── auth-adapter.ts               # NEW: Custom Neon DB adapter for Auth.js
├── auth-email.ts                 # NEW: Magic link email template (Resend)
├── db.ts                         # MODIFIED: add new tables to initDatabase()
├── session.ts                    # DEPRECATED: iron-session (remove post-migration)
└── email.ts                      # MODIFIED: add magic link template

scripts/
├── migrate-auth.ts               # NEW: Database migration script
└── rollback-auth.ts              # NEW: Database rollback script
```

### 6.2 Core Auth.js Configuration (`auth.ts`)

```typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Email from "next-auth/providers/email"
import Credentials from "next-auth/providers/credentials"
import { NeonAdapter } from "@/lib/auth-adapter"
import { sendMagicLinkEmail } from "@/lib/auth-email"
import bcrypt from "bcryptjs"
import { sql } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: NeonAdapter,
  session: { strategy: "database" },  // or "jwt"
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login?verify=true",  // magic link sent confirmation
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Email({
      from: process.env.EMAIL_FROM || "noreply@example.com",
      sendVerificationRequest: async ({ identifier, url }) => {
        await sendMagicLinkEmail(identifier, url)
      },
      maxAge: 10 * 60,  // 10 minutes
    }),
    // Legacy: kept during migration
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        const users = await sql`SELECT * FROM users WHERE email = ${email}`
        const user = (Array.isArray(users) ? users : users.rows)?.[0]
        if (!user?.password_hash) return null
        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) return null
        return { id: String(user.id), email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      return session
    },
    async signIn({ user, account }) {
      // Auto-link OAuth accounts to existing users with matching email
      return true
    },
  },
  events: {
    async createUser({ user }) {
      // Credit provisioning happens in the adapter's createUser method
      console.log(`New user created: ${user.email}`)
    },
  },
})
```

### 6.3 Middleware Configuration (`middleware.ts`)

```typescript
export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    "/((?!api/auth|api/webhooks|api/cron|login|register|forgot-password|reset-password|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
}
```

### 6.4 Package Changes

**Add:**
```json
{
  "next-auth": "^5.0.0-beta.25",
  "@auth/core": "^0.37.0",
  "resend": "^4.0.0"
}
```

**Remove (post-migration):**
```json
{
  "iron-session": "^8.0.4",
  "bcryptjs": "^2.4.3",
  "@types/bcryptjs": "^2.4.6",
  "nodemailer": "^8.0.1",
  "@types/nodemailer": "^7.0.9"
}
```

---

## 7. Acceptance Criteria (Full Epic)

### Functional Requirements

| # | Criteria | Priority |
|---|----------|----------|
| AC-1 | User can sign in with Google OAuth 2.0 | P0 |
| AC-2 | User can sign in with GitHub OAuth 2.0 | P0 |
| AC-3 | User can sign in via Magic Link (email) | P0 |
| AC-4 | User can still sign in with email+password (deprecated, transition period) | P1 |
| AC-5 | New OAuth/magic link users receive 100 free credits | P0 |
| AC-6 | Existing users can link OAuth accounts without losing credits | P0 |
| AC-7 | Session persists across page refreshes (7-day expiry) | P0 |
| AC-8 | Unauthenticated users are redirected to `/login` on protected routes | P0 |
| AC-9 | `callbackUrl` is preserved through auth flow | P1 |
| AC-10 | Logout clears session and redirects to `/login` | P0 |
| AC-11 | Magic link expires after 10 minutes | P0 |
| AC-12 | Used magic links cannot be reused | P0 |
| AC-13 | Magic link email matches app branding | P1 |
| AC-14 | OAuth consent screen shows correct app name/logo | P1 |
| AC-15 | Password reset still works for legacy accounts during transition | P1 |

### Non-Functional Requirements

| # | Criteria | Priority |
|---|----------|----------|
| NF-1 | Auth flow completes in < 3 seconds (excluding OAuth provider latency) | P1 |
| NF-2 | Magic link email delivered in < 30 seconds | P1 |
| NF-3 | Zero downtime during migration (additive schema changes first) | P0 |
| NF-4 | CSRF protection enabled on all auth endpoints | P0 |
| NF-5 | Rate limiting on magic link requests (5/email/hour) | P1 |
| NF-6 | All auth cookies are HttpOnly, Secure, SameSite=Lax | P0 |
| NF-7 | No hardcoded secrets in source code | P0 |
| NF-8 | Vercel deployment compatible (edge runtime support) | P0 |

---

## 8. Migration & Rollback Strategy

### Migration Plan (Zero Downtime)

```
Phase 1 — Preparation (Sprint 1)
├── Install Auth.js, create adapter, configure providers
├── Run schema migration (additive only — no breaking changes)
├── Deploy with both old and new auth systems running in parallel
└── Feature flag: NEXT_PUBLIC_NEW_AUTH=true (default: false)

Phase 2 — Soft Launch (Sprint 2)
├── Enable new auth UI for new users (feature flag)
├── Old session cookies continue to work (both systems active)
├── Monitor for errors, failed sign-ins, credit issues
└── Existing users see the new UI but can still use password

Phase 3 — Full Rollout (Sprint 3)
├── Enable new auth for all users
├── Send email to password-only users encouraging OAuth/magic link
├── Remove feature flag
└── Start deprecation countdown for password auth

Phase 4 — Cleanup (Sprint 4–5)
├── Remove CredentialsProvider from Auth.js config
├── Remove legacy auth API routes
├── Remove iron-session, bcryptjs dependencies
├── Drop password_hash, reset_token columns
└── Update documentation
```

### Rollback Plan

If critical issues are found:
1. Set `NEXT_PUBLIC_NEW_AUTH=false` → UI reverts to legacy forms
2. Iron-session cookies still work (not deleted during migration)
3. Legacy API routes still functional (not deleted during migration)
4. Run `scripts/rollback-auth.ts` to drop new tables if needed (non-destructive to existing data)

---

## 9. Environment Variables

### New Variables Required

| Variable | Example | Required For |
|----------|---------|-------------|
| `AUTH_SECRET` | `openssl rand -base64 32` | Auth.js session encryption (replaces `SESSION_SECRET`) |
| `AUTH_URL` | `https://your-app.vercel.app` | Auth.js callback base URL |
| `GOOGLE_CLIENT_ID` | `123...apps.googleusercontent.com` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Google OAuth |
| `GITHUB_ID` | `Iv1.abc123...` | GitHub OAuth |
| `GITHUB_SECRET` | `ghp_...` | GitHub OAuth |
| `RESEND_API_KEY` | `re_...` | Magic link + password reset emails |
| `EMAIL_FROM` | `Noir QR <noreply@yourdomain.com>` | Sender address |

### Deprecated Variables (Remove After Migration)

| Variable | Replacement |
|----------|------------|
| `SESSION_SECRET` | `AUTH_SECRET` |

### Retained Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL (unchanged) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client (unchanged) |
| `STRIPE_SECRET_KEY` | Stripe server (unchanged) |
| `NEXT_PUBLIC_APP_URL` | App base URL (used alongside `AUTH_URL`) |

---

## Summary

This user story converts the Noir QR Generator from **custom email+password authentication** (iron-session + bcryptjs) to a modern **OAuth 2.0 + Magic Link** system using **Auth.js (NextAuth v5)**. The migration is designed to be:

- **Non-breaking** — existing users keep access throughout
- **Incremental** — additive schema changes, parallel auth systems, feature flags
- **Reversible** — rollback scripts and preserved legacy code during transition
- **Comprehensive** — covers Google OAuth, GitHub OAuth, Magic Link, account linking, middleware route protection, and full frontend refactoring

The 14 user stories can be executed across 3–5 sprints, with the legacy system safely removed only after all users have transitioned.
