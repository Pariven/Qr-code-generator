# Noir Intelligence QR - Credit System Documentation

## Overview
The Noir Intelligence QR code generator now includes a comprehensive credit/token-based system that allows users to purchase QR code generation credits. Credits never expire and can be used to generate QR codes at any time.

## Pricing Tiers

| Package | Price | Credits | Credits per $1 |
|---------|-------|---------|----------------|
| Starter | $5 | 1,000 | 200 |
| Basic | $15 | 5,000 | 333 |
| Standard | $25 | 10,000 | 400 |
| Professional | $40 | 20,000 | 500 |
| Business | $80 | 50,000 | 625 |
| Enterprise | $120 | 100,000 | 833 |
| Premium | $250 | 250,000 | 1,000 |
| **Ultimate** | **$400** | **500,000** | **1,250** ⭐ Best Value |
| Platinum | $700 | 1,000,000 | 1,429 |
| Diamond | $1,600 | 2,000,000 | 1,250 |

## Key Features

### 1. Credit Management System (`lib/credits.ts`)
- **Credit Balance Tracking**: Tracks total credits purchased, credits used, and remaining credits
- **Transaction History**: Records all purchases and usage with timestamps
- **Local Storage**: All data is stored in browser localStorage (no server required)
- **Never Expire**: Credits remain valid indefinitely

### 2. Components

#### Credit Balance Display (`components/credit-balance-display.tsx`)
- Shows current credit balance with visual progress bar
- Displays total purchased and QR codes generated
- Transaction history viewer
- Quick access to purchase more credits
- Low balance warnings

#### Pricing Cards (`components/pricing-cards.tsx`)
- Displays all 10 pricing tiers
- Highlights best value package
- Shows credits per dollar ratio
- Simulated checkout flow (ready for Stripe/PayPal integration)
- Success notifications

### 3. Credit System Integration

#### Main Page Updates (`app/page.tsx`)
- Two-tab interface: "QR Generator" and "Buy Credits"
- Credit check before QR generation
- Automatic credit deduction after successful generation
- Real-time balance updates
- User prompts when credits are insufficient

## How It Works

### For Users:
1. **Purchase Credits**: Navigate to "Buy Credits" tab and select a package
2. **Generate QR Codes**: Use credits to generate QR codes (1 credit = 1 QR code)
3. **Track Usage**: Monitor credit balance and transaction history
4. **Never Expire**: Use credits at your own pace, they never expire

### For Developers:

#### Key Functions (from `lib/credits.ts`):

```typescript
// Get current balance
const balance = getCreditBalance()

// Check if user has enough credits
if (balance.remaining < qrCount) {
  // Prompt to buy more
}

// Use credits (deduct from balance)
const result = useCredits(qrCount)
if (!result.success) {
  alert(result.error)
}

// Add credits after purchase
addCredits(credits, price)

// Get transaction history
const transactions = getTransactions()
```

## Payment Integration (Production)

The current implementation includes a simulated checkout. To integrate real payments:

### Stripe Integration:
1. Install Stripe: `npm install @stripe/stripe-js`
2. Update `components/pricing-cards.tsx`:
   - Add Stripe publishable key
   - Create payment intent on backend
   - Handle successful payment webhook
   - Call `addCredits()` after confirmed payment

### PayPal Integration:
1. Install PayPal: `npm install @paypal/react-paypal-js`
2. Update `components/pricing-cards.tsx`:
   - Add PayPal client ID
   - Create order with selected tier
   - Capture payment
   - Call `addCredits()` after successful capture

## Storage Structure

### localStorage Keys:
- `noir_qr_credit_balance`: Stores credit balance object
- `noir_qr_transactions`: Stores transaction history array

### Data Format:

```typescript
// Balance Object
{
  total: number,        // Total credits ever purchased
  used: number,         // Total credits used
  remaining: number,    // Available credits
  lastUpdated: string   // ISO timestamp
}

// Transaction Object
{
  id: string,           // Unique transaction ID
  type: "purchase" | "usage",
  amount: number,       // Dollar amount (0 for usage)
  credits: number,      // Credit count
  timestamp: string,    // ISO timestamp
  description: string   // Human-readable description
}
```

## Testing the System

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Test Credit Purchase**:
   - Navigate to "Buy Credits" tab
   - Select any pricing tier
   - Click "Purchase Credits"
   - Confirm purchase (simulated)
   - Credits are added instantly

3. **Test QR Generation**:
   - Go to "QR Generator" tab
   - Enter some data or use auto-create
   - Click "Generate"
   - Credits are automatically deducted

4. **Test Insufficient Credits**:
   - Try to generate more QR codes than you have credits
   - System will prompt you to buy more

5. **View Transaction History**:
   - Check credit balance card
   - Click history icon to view all transactions

## Admin Functions

For testing/development purposes:

```typescript
import { resetBalance } from '@/lib/credits'

// Reset all credits and transactions
resetBalance()
```

## Future Enhancements

1. **Backend Integration**:
   - Store credits in database
   - User authentication
   - Cross-device synchronization

2. **Team/Enterprise Features**:
   - Multiple user accounts
   - Credit pooling
   - Usage analytics dashboard

3. **Subscription Plans**:
   - Monthly credit allowance
   - Auto-renewal options
   - Volume discounts

4. **API Access**:
   - Programmatic QR generation
   - API key management
   - Rate limiting based on credits

## Support

For issues or questions about the credit system:
- Check transaction history for discrepancies
- Ensure localStorage is enabled in browser
- Clear browser cache if balance doesn't update

## License
This credit system is part of the Noir Intelligence QR project.
