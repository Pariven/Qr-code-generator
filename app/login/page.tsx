"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Loader2, QrCode, Mail, Lock, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react"
import Link from "next/link"

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [magicEmail, setMagicEmail] = useState("")
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const verify = searchParams.get("verify")
  const callbackError = searchParams.get("error")

  useEffect(() => {
    if (verify === "true") {
      setMagicLinkSent(true)
    }
    if (callbackError) {
      const errorMessages: Record<string, string> = {
        OAuthSignin: "Error starting OAuth sign in. Try again.",
        OAuthCallback: "Error during OAuth callback. Try again.",
        OAuthCreateAccount: "Could not create OAuth account. Try another method.",
        EmailCreateAccount: "Could not create account with this email.",
        Callback: "Authentication error. Try again.",
        OAuthAccountNotLinked: "This email is already linked to another account. Try signing in with the original method.",
        EmailSignin: "Failed to send magic link email. Check your email address.",
        CredentialsSignin: "Invalid email or password.",
        SessionRequired: "Please sign in to access this page.",
        Default: "An authentication error occurred.",
      }
      setError(errorMessages[callbackError] || errorMessages.Default)
    }
  }, [verify, callbackError])

  const handleOAuthSignIn = async (provider: string) => {
    setError("")
    setLoading(provider)
    try {
      await signIn(provider, { callbackUrl: "/" })
    } catch (err) {
      setError(`Failed to sign in with ${provider}. Please try again.`)
      setLoading(null)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!magicEmail) return
    setError("")
    setLoading("email")
    try {
      const result = await signIn("resend", {
        email: magicEmail,
        redirect: false,
        callbackUrl: "/",
      })
      if (result?.error) {
        setError("Failed to send magic link. Please check your email address.")
        setLoading(null)
      } else {
        setMagicLinkSent(true)
        setLoading(null)
      }
    } catch (err) {
      setError("Failed to send magic link. Please try again.")
      setLoading(null)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading("credentials")
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })
      if (result?.error) {
        setError("Invalid email or password.")
      } else if (result?.ok) {
        router.push("/")
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/10 p-3 rounded-full">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We&apos;ve sent a magic link to <strong>{magicEmail || "your email"}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Click the link in your email to sign in. The link expires in 10 minutes.
                Check your spam folder if you don&apos;t see it.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button variant="outline" className="w-full" onClick={() => setMagicLinkSent(false)}>
              Use a different method
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <QrCode className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Noir Intelligence QR account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* OAuth Providers */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-11 gap-3"
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading !== null}
            >
              {loading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 gap-3"
              onClick={() => handleOAuthSignIn("github")}
              disabled={loading !== null}
            >
              {loading === "github" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitHubIcon />}
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Magic Link */}
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="magic-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="magic-email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="secondary" className="w-full gap-2" disabled={loading !== null}>
              {loading === "email" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send Magic Link
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Legacy Password Login (Collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
            >
              {showPassword ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Sign in with password
            </button>
            {showPassword && (
              <form onSubmit={handlePasswordLogin} className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading !== null}>
                  {loading === "credentials" ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing In...</>
                  ) : "Sign In"}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">Sign Up for Free</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
