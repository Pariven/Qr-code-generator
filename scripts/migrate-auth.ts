/**
 * Database Migration Script for Auth.js (NextAuth v5)
 * 
 * Adds the required tables for OAuth 2.0 + Magic Link authentication:
 * - accounts (OAuth provider accounts)
 * - sessions (database sessions)
 * - verification_tokens (magic link / email verification tokens)
 * - Alters users table (email_verified, image, optional password_hash)
 * - Backfills existing users
 * 
 * Run: npx tsx scripts/migrate-auth.ts
 */

import 'dotenv/config'
import { sql } from '../lib/db'

async function migrateAuth() {
  console.log('🚀 Starting Auth.js database migration...\n')

  try {
    // Step 1: Alter users table — add new columns
    console.log('1️⃣  Altering users table...')
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT`
    console.log('   ✅ Added email_verified and image columns\n')

    // Step 2: Make password_hash optional (OAuth users won't have passwords)
    console.log('2️⃣  Making password_hash nullable...')
    try {
      await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`
      console.log('   ✅ password_hash is now nullable\n')
    } catch (err: any) {
      if (err.message?.includes('already')) {
        console.log('   ⏭️  password_hash is already nullable\n')
      } else {
        throw err
      }
    }

    // Step 3: Create accounts table
    console.log('3️⃣  Creating accounts table...')
    await sql`
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
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)`
    console.log('   ✅ accounts table created\n')

    // Step 4: Create sessions table
    console.log('4️⃣  Creating sessions table...')
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)`
    console.log('   ✅ sessions table created\n')

    // Step 5: Create verification_tokens table
    console.log('5️⃣  Creating verification_tokens table...')
    await sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `
    console.log('   ✅ verification_tokens table created\n')

    // Step 6: Backfill existing users — mark as email_verified
    console.log('6️⃣  Backfilling existing users...')
    const result = await sql`
      UPDATE users 
      SET email_verified = created_at 
      WHERE email_verified IS NULL AND password_hash IS NOT NULL
    `
    console.log(`   ✅ Backfilled existing users with email_verified\n`)

    // Step 7: Create account entries for existing password-based users
    console.log('7️⃣  Creating credential account entries for existing users...')
    await sql`
      INSERT INTO accounts (user_id, type, provider, provider_account_id)
      SELECT id, 'credentials', 'credentials', email
      FROM users
      WHERE password_hash IS NOT NULL
      ON CONFLICT (provider, provider_account_id) DO NOTHING
    `
    console.log('   ✅ Credential accounts created for existing users\n')

    console.log('='.repeat(50))
    console.log('✅ Auth.js migration completed successfully!')
    console.log('='.repeat(50))
    console.log('\nNew tables: accounts, sessions, verification_tokens')
    console.log('Modified: users (added email_verified, image; password_hash now nullable)')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

migrateAuth()
