# Vercel Deployment Guide

## Required Environment Variables

Before deploying, add these environment variables in your Vercel project settings:

### 1. Database Configuration
- **Variable Name**: `DATABASE_URL`
- **Value**: Your Neon PostgreSQL connection string
- **Example**: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`

### 2. Session Secret
- **Variable Name**: `SESSION_SECRET`
- **Value**: A random 32+ character string
- **Generate**: Run `openssl rand -base64 32` or use any secure random string generator

### 3. Stripe Keys
- **Variable Name**: `STRIPE_SECRET_KEY`
- **Value**: Your Stripe secret key (starts with `sk_test_` or `sk_live_`)
- **Get it from**: https://dashboard.stripe.com/apikeys

- **Variable Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Value**: Your Stripe publishable key (starts with `pk_test_` or `pk_live_`)
- **Get it from**: https://dashboard.stripe.com/apikeys

### 4. Stripe Webhook Secret
- **Variable Name**: `STRIPE_WEBHOOK_SECRET`
- **Value**: Your Stripe webhook signing secret (starts with `whsec_`)
- **Setup**:
  1. Go to https://dashboard.stripe.com/webhooks
  2. Click "Add endpoint"
  3. URL: `https://your-domain.vercel.app/api/webhooks/stripe`
  4. Select event: `checkout.session.completed`
  5. Copy the signing secret

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all 5 variables listed above
   - Make sure to add them for Production, Preview, and Development environments

4. **Initialize Database**
   - After first deployment, run the database initialization:
   - Option A: Use the `/api/init-db` endpoint (create if needed)
   - Option B: Run locally with production DATABASE_URL:
     ```bash
     DATABASE_URL="your_connection_string" npm run init-db
     ```

5. **Deploy**
   - Click "Deploy" in Vercel
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

## Troubleshooting

### Build Fails with "DATABASE_URL not set"
- Make sure environment variables are added in Vercel dashboard
- Check that variables are enabled for the correct environment (Production/Preview)

### Stripe Webhooks Not Working
- Verify webhook URL matches your deployment URL
- Check webhook secret is correct
- Test webhooks in Stripe dashboard

### Database Connection Errors
- Verify connection string includes `?sslmode=require`
- Check Neon database is active
- Ensure IP allowlist allows Vercel's IPs (or use connection pooling)

## Post-Deployment Checklist

- [ ] All environment variables added
- [ ] Database tables initialized
- [ ] Test user registration works
- [ ] Test login works
- [ ] Test QR generation with credits
- [ ] Test Stripe payment flow
- [ ] Verify webhook endpoint receives events
- [ ] Check credit balance updates after payment

## Support

For issues, check:
- Vercel build logs
- Vercel function logs (Runtime Logs)
- Stripe webhook logs
- Browser console for client-side errors
