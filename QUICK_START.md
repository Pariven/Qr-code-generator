# 🎯 Quick Start - Stripe Integration

## Step 1: Install Dependencies
```powershell
npm install
```

## Step 2: Get Stripe Test Keys
1. Visit: https://dashboard.stripe.com/test/apikeys
2. Copy your Publishable key (pk_test_...)
3. Copy your Secret key (sk_test_...)

## Step 3: Configure Environment
Open `.env.local` and replace with your keys:
```env
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
```

## Step 4: Run Development Server
```powershell
npm run dev
```

## Step 5: Test Payment
1. Open http://localhost:3000
2. Go to "Buy Credits" tab
3. Click any pricing tier
4. Use test card: **4242 4242 4242 4242**
5. Use any future expiry date, any CVC
6. Complete purchase
7. Credits will be added!

## ✅ That's it! You're ready to accept payments.

For detailed setup including webhooks, see `STRIPE_SETUP.md`
