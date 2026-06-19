require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function checkCredits() {
  try {
    console.log('Checking credits...\n')
    
    const result = await sql`
      SELECT 
        u.email, 
        u.name,
        c.total, 
        c.used, 
        c.remaining 
      FROM users u 
      JOIN credits c ON u.id = c.user_id
      ORDER BY u.created_at DESC
    `
    
    console.log('Current Credits:')
    result.forEach(row => {
      console.log(`\nUser: ${row.name} (${row.email})`)
      console.log(`Total: ${row.total}`)
      console.log(`Used: ${row.used}`)
      console.log(`Remaining: ${row.remaining}`)
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

checkCredits()
