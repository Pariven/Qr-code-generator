# Stripe Payment Integration Guide - Noir Intelligence QR

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

The following Stripe packages have been added:
- `@stripe/stripe-js` - Client-side Stripe library
- `stripe` - Server-side Stripe SDK

### 2. Get Your Stripe API Keys

#### For Testing (Development):
1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

#### For Production:
1. Activate your Stripe account
2. Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
3. Copy your **Live Publishable key** (starts with `pk_live_`)
4. Copy your **Live Secret key** (starts with `sk_live_`)

### 3. Configure Environment Variables

Update `.env.local` with your keys:

```env
# Test Keys (for development)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Webhook Secret (after setting up webhooks)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**⚠️ IMPORTANT:** 
- Never commit `.env.local` to git
- `.env.local` is already in `.gitignore`
- Only `NEXT_PUBLIC_*` variables are exposed to the browser

### 4. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Test the Payment Flow

1. Navigate to the "Buy Credits" tab
2. Select any pricing tier
3. Click "Purchase Credits"
4. Use Stripe test cards:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

**Failed Payment:**
- Card: `4000 0000 0000 0002`

**Requires Authentication:**
- Card: `4000 0025 0000 3155`

More test cards: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## 🔧 Webhook Setup (Required for Production)

Webhooks ensure you're notified when payments complete, even if the user closes the browser.

### Local Development with Stripe CLI

1. **Install Stripe CLI:**
   ```bash
   # Windows (with Scoop)
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`) and add to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

5. **Test webhooks:**
   ```bash
   stripe trigger checkout.session.completed
   ```

### Production Webhook Setup

1. Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** and add to your production environment variables

---

## 📁 File Structure

```
app/
├── api/
│   ├── create-checkout-session/
│   │   └── route.ts              # Creates Stripe checkout session
│   ├── verify-session/
│   │   └── route.ts              # Verifies payment completion
│   └── webhooks/
│       └── stripe/
│           └── route.ts          # Handles Stripe webhooks
├── success/
│   └── page.tsx                  # Payment success page
└── page.tsx                      # Main app with credit system

components/
├── pricing-cards.tsx             # Pricing tiers with Stripe checkout
└── credit-balance-display.tsx    # Credit balance tracker

lib/
├── stripe.ts                     # Client-side Stripe initialization
├── stripe-server.ts              # Server-side Stripe SDK
└── credits.ts                    # Credit management system

.env.local                        # Environment variables (not in git)
```

---

## 🔐 Security Best Practices

### 1. API Key Security
- ✅ Never expose `STRIPE_SECRET_KEY` to the client
- ✅ Only use `NEXT_PUBLIC_*` prefix for client-side keys
- ✅ Keep `.env.local` out of version control

### 2. Webhook Verification
- ✅ Always verify webhook signatures using `stripe.webhooks.constructEvent`
- ✅ This prevents fake webhook requests

### 3. Amount Verification
- ✅ Always verify the payment amount on the server
- ✅ Never trust payment amounts from the client

### 4. Idempotency
- ✅ Use Stripe's session IDs to prevent duplicate credit additions
- ✅ Check if credits were already added before adding again

---

## 💳 Payment Flow

### Client-Side Flow:
1. User clicks "Purchase Credits"
2. `pricing-cards.tsx` calls `/api/create-checkout-session`
3. Receives Stripe session ID
4. Redirects to Stripe Checkout page
5. User completes payment on Stripe
6. Stripe redirects back to `/success`
7. Success page verifies payment and adds credits

### Server-Side Flow:
1. `/api/create-checkout-session` creates Stripe session
2. Stripe processes payment
3. Stripe sends webhook to `/api/webhooks/stripe`
4. Webhook handler verifies and logs transaction
5. Credits are added to user account

---

## 🧪 Testing Scenarios

### Test Successful Purchase:
1. Select a pricing tier
2. Use test card: `4242 4242 4242 4242`
3. Complete checkout
4. Verify credits are added
5. Check browser console for logs

### Test Failed Payment:
1. Select a pricing tier
2. Use test card: `4000 0000 0000 0002`
3. Payment should be declined
4. User stays on checkout page

### Test Webhook:
1. Complete a purchase
2. Check your terminal running `stripe listen`
3. You should see `checkout.session.completed` event
4. Check server logs for webhook processing

---

## 🚀 Production Deployment

### 1. Environment Variables
Set these on your hosting platform (Vercel, Netlify, etc.):

```env
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
```

### 2. Update Success URL
In `app/api/create-checkout-session/route.ts`, ensure URLs use your production domain.

### 3. Set Up Production Webhooks
Configure webhook endpoint in Stripe Dashboard with your production URL.

### 4. Test in Production Mode
```bash
npm run build
npm start
```

### 5. Monitor Payments
- Check Stripe Dashboard: [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)
- Set up email notifications for failed payments
- Monitor webhook delivery in Dashboard

---

## 🔍 Troubleshooting

### Issue: "No API key provided"
**Solution:** Ensure `.env.local` has your Stripe keys and restart dev server.

### Issue: "Invalid API Key"
**Solution:** Double-check you're using the correct key (test vs live).

### Issue: Webhook signature verification failed
**Solution:** 
1. Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
2. Make sure you're using the raw request body (not parsed JSON)

### Issue: Credits not added after payment
**Solution:**
1. Check browser console for errors
2. Verify session ID in URL parameters
3. Check `/api/verify-session` response
4. Ensure webhook is firing (check Stripe Dashboard > Webhooks)

### Issue: Redirect not working
**Solution:** Check `success_url` and `cancel_url` in checkout session creation.

---

## 📊 Monitoring & Analytics

### Stripe Dashboard
- View all payments: [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)
- Check webhook logs: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
- View customers: [https://dashboard.stripe.com/customers](https://dashboard.stripe.com/customers)

### Custom Logging
Add logging to track:
- Successful purchases
- Failed payments
- Webhook events
- Credit additions

---

## 🎯 Next Steps

### Recommended Enhancements:

1. **User Authentication**
   - Add NextAuth.js or Clerk
   - Store credits in database per user
   - Sync across devices

2. **Email Receipts**
   - Send confirmation emails via SendGrid/Resend
   - Include purchase details and invoice

3. **Customer Portal**
   - Add Stripe Customer Portal
   - Allow users to view payment history
   - Download invoices

4. **Subscription Plans**
   - Add monthly credit allowances
   - Recurring billing with Stripe Subscriptions

5. **Fraud Prevention**
   - Enable Stripe Radar
   - Add rate limiting
   - Implement CAPTCHA

6. **Analytics**
   - Track conversion rates
   - Monitor popular pricing tiers
   - A/B test pricing

---

## 📞 Support Resources

- **Stripe Documentation:** [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Support:** [https://support.stripe.com](https://support.stripe.com)
- **Next.js + Stripe Guide:** [https://stripe.com/docs/payments/checkout/how-checkout-works](https://stripe.com/docs/payments/checkout/how-checkout-works)

---

## ✅ Pre-Launch Checklist

- [ ] Replace test API keys with live keys
- [ ] Set up production webhooks
- [ ] Test complete purchase flow in production mode
- [ ] Verify webhook delivery
- [ ] Test with real card (small amount)
- [ ] Set up email notifications
- [ ] Add terms of service and refund policy
- [ ] Enable HTTPS (required for Stripe)
- [ ] Test on mobile devices
- [ ] Monitor first few transactions closely

---

**🎉 You're all set! Your Stripe integration is ready to accept payments.**
