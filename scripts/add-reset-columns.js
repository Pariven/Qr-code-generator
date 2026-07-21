// Migration script to add password reset columns to users table
import { sql } from '../lib/db.js'

async function addResetColumns() {
  try {
    console.log('Adding password reset columns to users table...')

    // Add reset_token column if it doesn't exist
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `

    console.log('✓ Successfully added reset_token and reset_token_expiry columns')
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  }
}

addResetColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
