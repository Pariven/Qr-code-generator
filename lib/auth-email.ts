/**
 * Magic Link Email Template for Auth.js
 * 
 * Sends branded magic link emails via Resend.
 * Consistent styling with the existing password reset email.
 */

import { Resend } from 'resend'

const getMagicLinkHTML = (url: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Noir QR Generator</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #000000, #444444); border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="color: white; font-size: 18px; font-weight: bold;">QR</span>
              </div>
              <h1 style="margin: 0; color: #333333; font-size: 28px;">Sign in to Noir QR</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Click the button below to sign in to your account. No password needed!
              </p>
              <table role="presentation" style="margin: 30px auto;">
                <tr>
                  <td style="border-radius: 6px; background-color: #000000;">
                    <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 48px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                      Sign In
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 20px 0; color: #0066cc; font-size: 14px; word-break: break-all;">
                ${url}
              </p>
              <p style="margin: 20px 0; color: #999999; font-size: 13px; line-height: 1.6;">
                <strong>This link expires in 10 minutes.</strong>
              </p>
              <p style="margin: 20px 0; color: #999999; font-size: 13px; line-height: 1.6;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f8f8; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                Best regards,<br>
                <strong>QR Noir Tech Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

const getMagicLinkText = (url: string) => `
Sign in to Noir QR Generator

Click the link below to sign in to your account:
${url}

This link expires in 10 minutes.

If you didn't request this email, you can safely ignore it.

Best regards,
QR Noir Tech Team
`

/**
 * Send a magic link email via Resend (or console fallback)
 */
export async function sendMagicLinkEmail(email: string, url: string) {
  console.log('\n=================================')
  console.log('🔗 MAGIC LINK EMAIL')
  console.log('=================================')
  console.log(`To: ${email}`)
  console.log(`Magic Link URL: ${url}`)
  console.log('=================================\n')

  // If no Resend API key, just log (dev mode)
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  No RESEND_API_KEY configured. Magic link logged above.')
    console.warn('Add RESEND_API_KEY to .env.local to enable email sending.')
    return
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.EMAIL_FROM || 'QR Noir Tech <onboarding@resend.dev>'

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: 'Sign in to Noir QR Generator',
      html: getMagicLinkHTML(url),
      text: getMagicLinkText(url),
    })

    if (error) {
      console.error('❌ Resend magic link error:', error)
      throw new Error('Failed to send magic link email')
    }

    console.log('✅ Magic link email sent via Resend to:', email)
    console.log('Email ID:', data?.id)
  } catch (error) {
    console.error('❌ Magic link email failed:', error)
    throw error
  }
}
