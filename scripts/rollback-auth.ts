/**
 * Rollback Script for Auth.js Migration
 * 
 * Drops the Auth.js tables (accounts, sessions, verification_tokens)
 * and removes added columns from users table.
 * 
 * WARNING: This will delete all OAuth account links and sessions!
 * Run: npx tsx scripts/rollback-auth.ts
 */

import 'dotenv/config'
import { sql } from '../lib/db'

async function rollbackAuth() {
  console.log('⚠️  Starting Auth.js migration rollback...\n')
  console.log('WARNING: This will remove all OAuth links, sessions, and verification tokens!\n')

  try {
    // Step 1: Drop verification_tokens
    console.log('1️⃣  Dropping verification_tokens table...')
    await sql`DROP TABLE IF EXISTS verification_tokens CASCADE`
    console.log('   ✅ Done\n')

    // Step 2: Drop sessions
    console.log('2️⃣  Dropping sessions table...')
    await sql`DROP TABLE IF EXISTS sessions CASCADE`
    console.log('   ✅ Done\n')

    // Step 3: Drop accounts
    console.log('3️⃣  Dropping accounts table...')
    await sql`DROP TABLE IF EXISTS accounts CASCADE`
    console.log('   ✅ Done\n')

    // Step 4: Remove added columns from users (optional — won't break anything)
    console.log('4️⃣  Removing added columns from users table...')
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS email_verified`
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS image`
    console.log('   ✅ Done\n')

    console.log('='.repeat(50))
    console.log('✅ Rollback completed successfully!')
    console.log('='.repeat(50))
    console.log('\nNote: password_hash NOT NULL constraint was NOT restored.')
    console.log('If needed, run: ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;')

  } catch (error) {
    console.error('\n❌ Rollback failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

rollbackAuth()
