require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function addCredits(email, credits, price, tierName) {
  try {
    console.log(`Adding ${credits} credits to ${email}...\n`)
    
    // Get user ID
    const users = await sql`SELECT id FROM users WHERE email = ${email}`
    if (users.length === 0) {
      console.log('User not found!')
      return
    }
    
    const userId = users[0].id
    
    // Add credits
    await sql`
      UPDATE credits
      SET total = total + ${credits},
          remaining = remaining + ${credits},
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `
    
    // Record transaction
    await sql`
      INSERT INTO transactions (user_id, type, amount, credits, description)
      VALUES (
        ${userId},
        'purchase',
        ${price},
        ${credits},
        ${`Manually added: Purchased ${credits.toLocaleString()} QR credits (${tierName}) for $${price}`}
      )
    `
    
    console.log(`✅ Successfully added ${credits} credits!`)
    
    // Show new balance
    const result = await sql`
      SELECT total, used, remaining 
      FROM credits 
      WHERE user_id = ${userId}
    `
    
    console.log('\nNew Balance:')
    console.log(`Total: ${result[0].total}`)
    console.log(`Used: ${result[0].used}`)
    console.log(`Remaining: ${result[0].remaining}`)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Add credits - MODIFY THESE VALUES
const email = 'parivenmc06@gmail.com'
const credits = 10000  // Change this to the credits you purchased
const price = 55       // Change this to the price you paid
const tierName = 'Professional'  // Change this to tier name

addCredits(email, credits, price, tierName)
