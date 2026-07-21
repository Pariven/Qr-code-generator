// Email service for password reset using Resend
import { Resend } from 'resend'

interface PasswordResetEmail {
  to: string
  name: string
  resetUrl: string
}

// Email HTML template
const getEmailHTML = (name: string, resetUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; color: #333333; font-size: 28px;">Reset Your Password</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Hi ${name || 'there'},
              </p>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                You requested to reset your password for your QR Noir Tech account. Click the button below to create a new password:
              </p>
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="border-radius: 6px; background-color: #000000;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 20px 0; color: #0066cc; font-size: 14px; word-break: break-all;">
                ${resetUrl}
              </p>
              <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                <strong>This link will expire in 1 hour.</strong>
              </p>
              <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
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

const getEmailText = (name: string, resetUrl: string) => `
Hi ${name || 'there'},

You requested to reset your password for your QR Noir Tech account.

Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
QR Noir Tech Team
`

export async function sendPasswordResetEmail({ to, name, resetUrl }: PasswordResetEmail) {
  // Log to console in development
  console.log('\n=================================')
  console.log('📧 PASSWORD RESET EMAIL')
  console.log('=================================')
  console.log(`To: ${to}`)
  console.log(`Name: ${name || 'User'}`)
  console.log(`Reset URL: ${resetUrl}`)
  console.log('=================================\n')

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  No RESEND_API_KEY configured. Email logged above.')
    console.warn('Add RESEND_API_KEY to .env.local to enable email sending.')
    console.warn('Get your API key at: https://resend.com/api-keys')
    return true
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const fromEmail = process.env.EMAIL_FROM || 'QR Noir Tech <onboarding@resend.dev>'

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: 'Reset Your Password - QR Noir Tech',
      html: getEmailHTML(name, resetUrl),
      text: getEmailText(name, resetUrl),
    })

    if (error) {
      console.error('❌ Resend API error:', error)
      throw new Error('Failed to send password reset email')
    }

    console.log('✅ Password reset email sent via Resend to:', to)
    console.log('Email ID:', data?.id)
    return true
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    throw new Error('Failed to send password reset email')
  }
}
