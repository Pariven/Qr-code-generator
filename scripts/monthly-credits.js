require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function giveMonthlyCredits() {
  try {
    console.log('Processing monthly credit bonus...\n')
    
    // Get all users who haven't received credits this month
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    
    const users = await sql`
      SELECT u.id, u.email, u.name, c.total, c.remaining
      FROM users u
      JOIN credits c ON u.id = c.user_id
      WHERE NOT EXISTS (
        SELECT 1 FROM transactions t
        WHERE t.user_id = u.id
        AND t.type = 'monthly_bonus'
        AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE)
      )
    `
    
    console.log(`Found ${users.length} users eligible for monthly credits\n`)
    
    for (const user of users) {
      // Add 100 credits
      await sql`
        UPDATE credits
        SET total = total + 100,
            remaining = remaining + 100,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${user.id}
      `
      
      // Record transaction
      await sql`
        INSERT INTO transactions (user_id, type, amount, credits, description)
        VALUES (
          ${user.id},
          'monthly_bonus',
          0,
          100,
          'Monthly bonus - 100 free QR credits'
        )
      `
      
      console.log(`✅ Added 100 credits to ${user.name} (${user.email})`)
    }
    
    console.log(`\n✅ Monthly credit bonus complete! Processed ${users.length} users.`)
  } catch (error) {
    console.error('Error:', error)
  }
}

giveMonthlyCredits()
