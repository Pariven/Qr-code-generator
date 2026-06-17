import { neon } from '@neondatabase/serverless'

let sqlInstance: ReturnType<typeof neon> | null = null

function getSql() {
  if (!sqlInstance) {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    sqlInstance = neon(dbUrl)
  }
  return sqlInstance
}

// Export a tagged template function that gets the SQL instance at runtime
export function sql(strings: TemplateStringsArray, ...values: any[]) {
  return getSql()(strings, ...values)
}

// For backwards compatibility
export const getDb = getSql

// Initialize database tables
export async function initDatabase() {
  try {
    // Create users table (with Auth.js columns)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        email_verified TIMESTAMP,
        image TEXT,
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create accounts table (Auth.js OAuth accounts)
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        provider_account_id VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at BIGINT,
        token_type VARCHAR(50),
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, provider_account_id)
      )
    `

    // Create sessions table (Auth.js database sessions)
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL
      )
    `

    // Create verification tokens table (Auth.js magic link tokens)
    await sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires TIMESTAMP NOT NULL,
        UNIQUE(identifier, token)
      )
    `

    // Create credits table
    await sql`
      CREATE TABLE IF NOT EXISTS credits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        total INTEGER DEFAULT 100,
        used INTEGER DEFAULT 0,
        remaining INTEGER DEFAULT 100,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) DEFAULT 0,
        credits INTEGER NOT NULL,
        description TEXT,
        stripe_session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)`
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)`

    console.log('[DB] Database tables initialized successfully (including Auth.js tables)')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}
