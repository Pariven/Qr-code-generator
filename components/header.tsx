"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserSession {
  userId?: number
  email?: string
  name?: string
  isLoggedIn: boolean
}

export default function Header() {
  const router = useRouter()
  const [session, setSession] = useState<UserSession>({ isLoggedIn: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/auth/session")
      const data = await response.json()
      setSession(data)
    } catch (error) {
      console.error("Session fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <header className="border-b border-border/40 sticky top-0 bg-background/98 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-sm flex items-center justify-center">
              <span className="text-white text-sm font-bold">QR</span>
            </div>
            <span className="text-lg font-semibold text-foreground">Noir Intelligence QR</span>
          </div>
          
          {/* Navigation */}
          <nav className="flex items-center gap-4 sm:gap-6 text-sm">
            {!loading && (
              <>
                {session.isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">{session.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{session.name}</p>
                          <p className="text-xs text-muted-foreground">{session.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/register">Sign Up Free</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
