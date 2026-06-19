⚠️ IMPORTANT: Before you can test payments, you MUST add your Stripe API keys!

# 🔑 Setup Required

## Step 1: Get Stripe Keys
1. Go to: https://dashboard.stripe.com/test/apikeys
   (Create free account if you don't have one)

2. You'll see two keys:
   - Publishable key (starts with pk_test_)
   - Secret key (starts with sk_test_) - Click "Reveal" to see it

## Step 2: Add Keys to .env.local
Open the file `.env.local` in this directory and replace the placeholder text:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE
```

⚠️ **Copy the ENTIRE key** - they're very long!

## Step 3: Start Development Server
```powershell
npm run dev
```

## Step 4: Test It Works
1. Visit: http://localhost:3000
2. Click "Buy Credits" tab
3. Select any pricing tier
4. Use test card: 4242 4242 4242 4242
5. If it works, you'll see credits added!

---

## ⚠️ Common Issues

**"No API key provided"**
→ You forgot to add keys to .env.local

**"Invalid API Key"**
→ You copied the key incorrectly (copy entire key)

**Payment not redirecting**
→ Restart dev server after adding keys

---

## ✅ Once This Works

You're ready to accept real payments! Just:
1. Get LIVE keys from Stripe dashboard
2. Replace test keys with live keys
3. Deploy to production

See `STRIPE_SETUP.md` for full production setup.
