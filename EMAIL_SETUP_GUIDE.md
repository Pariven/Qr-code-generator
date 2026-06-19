# Email Setup Guide for Public Website

## 🚀 Quick Setup (2 minutes)

### **Option 1: Resend (BEST for Production)** ⭐

**Free tier**: 100 emails/day, 3,000/month - Perfect for most websites!

1. **Sign up**: https://resend.com/signup (no credit card needed)
2. **Get API Key**: 
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Copy the key (starts with `re_`)
3. **Add to `.env.local`**:
```env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=QR Noir Tech <onboarding@resend.dev>
```
4. **Restart server**: `npm run dev`
5. **Done!** Test the forgot password feature

**For custom domain**: Verify your domain in Resend to use `noreply@yourdomain.com`

1. **Go to your Google Account**: https://myaccount.google.com/
2. **Enable 2-Step Verification** (if not already enabled)
3. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "QR Code Generator"
   - Click "Generate"
   - Copy the 16-character password

4. **Add to your `.env.local` file**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=youremail@gmail.com
EMAIL_FROM_NAME=QR Noir Tech
```

## Option 2: Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=youremail@outlook.com
EMAIL_PASS=your-password
EMAIL_FROM=youremail@outlook.com
EMAIL_FROM_NAME=QR Noir Tech
```

## Option 3: Other SMTP Providers

- **SendGrid**: smtp.sendgrid.net (port 587)
- **Mailgun**: smtp.mailgun.org (port 587)
- **Amazon SES**: email-smtp.region.amazonaws.com (port 587)

## Testing

1. Add the email configuration to your `.env.local` file
2. Restart your development server: `npm run dev`
3. Go to http://localhost:3000/forgot-password
4. Enter your email address
5. Check your inbox for the password reset email!

## Important Notes

- **For Gmail**: You MUST use an App Password, not your regular password
- **Security**: Never commit `.env.local` to version control
- **Development**: Emails will also log to console for debugging
- **Production**: Make sure to use environment variables in your hosting platform (Vercel, etc.)

## Troubleshooting

If emails aren't sending:
1. Check the server console for error messages
2. Verify your SMTP credentials are correct
3. Make sure 2-Step Verification is enabled (for Gmail)
4. Check your email provider's SMTP settings
5. Some providers block SMTP by default - check their documentation

## Email Preview

The password reset email includes:
- Professional HTML design
- Clear call-to-action button
- Plain text fallback
- Security notice about link expiration
- Branded with your company name
