require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function addColumn() {
  try {
    console.log('Adding stripe_session_id column to transactions table...')
    
    await sql`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255) UNIQUE
    `
    
    console.log(' Column added successfully!')
  } catch (error) {
    console.error('Error:', error)
  }
}

addColumn()
