"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Header() {
  const { data: session, status } = useSession()
  const loading = status === "loading"

  const handleLogout = async () => {
    console.log("[Header] User logging out")
    await signOut({ callbackUrl: "/login" })
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
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
                {session?.user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        {session.user.image ? (
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                            <AvatarFallback className="text-xs">{getInitials(session.user.name)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{session.user.name || "User"}</p>
                          <p className="text-xs text-muted-foreground">{session.user.email}</p>
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
