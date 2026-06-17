"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
