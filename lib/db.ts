import { neon } from '@neondatabase/serverless'

let sqlInstance: ReturnType<typeof neon> | null = null

export function getDb() {
  if (!sqlInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set in environment variables')
    }
    sqlInstance = neon(process.env.DATABASE_URL)
  }
  return sqlInstance
}

export const sql = getDb()

// Initialize database tables
export async function initDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    console.log('Database tables initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}
