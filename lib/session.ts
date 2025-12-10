import { SessionOptions } from 'iron-session'

export interface SessionData {
  userId?: number
  email?: string
  name?: string
  isLoggedIn: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'noir_qr_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
}
