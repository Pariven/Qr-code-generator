# QR Code Generator with Credit System

A modern QR code generator built with Next.js 16, featuring a credit-based system, Stripe payments, and PostgreSQL database.

## Features

- 🎨 Modern UI with dark/light mode
- 🔐 User authentication (register/login/logout)
- 💳 Credit system with 100 free credits on signup
- 💰 10 pricing tiers from $5 to $1,600
- 💳 Stripe payment integration
- 🗄️ PostgreSQL database (Neon)
- 📱 Responsive design
- 🎯 Multiple QR code formats (PNG, SVG, JPG)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pariven/Qr-code-generator.git
   cd Qr-code-generator
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your credentials:
     - `DATABASE_URL`: Your Neon PostgreSQL connection string
     - `SESSION_SECRET`: A random 32-character string
     - `STRIPE_SECRET_KEY`: Your Stripe secret key
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
     - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy

3. **Set up Stripe Webhooks**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Select events: `checkout.session.completed`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | Secret for session encryption | `random_32_char_string` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |

## Pricing Tiers

| Tier | QR Codes | Price |
|------|----------|-------|
| Starter | 1,000 | $5 |
| Basic | 5,000 | $20 |
| Standard | 10,000 | $35 |
| Plus | 25,000 | $75 |
| Professional | 50,000 | $125 |
| Business | 100,000 | $200 |
| Ultimate | 500,000 | $400 |
| Enterprise | 1,000,000 | $750 |
| Premium | 1,500,000 | $1,100 |
| Unlimited | 2,000,000 | $1,600 |

## Tech Stack

- **Framework**: Next.js 16.0.3
- **UI**: React 19.2.0, Radix UI, Tailwind CSS
- **Database**: Neon PostgreSQL
- **Authentication**: iron-session with bcrypt
- **Payments**: Stripe
- **QR Generation**: qrcode library

## Project Structure

```
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # Authentication endpoints
│   │   ├── credits/   # Credit management
│   │   └── webhooks/  # Stripe webhooks
│   ├── login/         # Login page
│   ├── register/      # Registration page
│   └── success/       # Payment success page
├── components/        # React components
├── lib/              # Utility functions
│   ├── db.ts         # Database connection
│   ├── session.ts    # Session configuration
│   └── credits.ts    # Credit utilities
└── public/           # Static assets
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
