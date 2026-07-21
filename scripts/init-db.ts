import { config } from 'dotenv'
import { resolve } from 'path'
import { initDatabase } from '../lib/db'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

async function setup() {
  console.log('Initializing database...')
  try {
    await initDatabase()
    console.log('✅ Database initialized successfully!')
    console.log('\nTables created:')
    console.log('- users')
    console.log('- credits')
    console.log('- transactions')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

setup()
