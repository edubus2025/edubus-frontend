"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import AuthButton from "@/components/auth-button"
import { GraduationCap, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

interface ModernHeaderProps {
  title?: string
  subtitle?: string
  showAuth?: boolean
  className?: string
}

export function ModernHeader({ title = "EduBus", subtitle, showAuth = true, className }: ModernHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-lg border-b border-neutral-200/50"
          : "bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800",
        className,
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo et titre */}
        <div className="flex items-center gap-3 animate-fade-in">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full animate-bounce-gentle" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                {title}
              </h1>
              {subtitle && <p className="text-sm text-neutral-600 dark:text-neutral-400 animate-fade-in">{subtitle}</p>}
            </div>
          </Link>
        </div>

        {/* Right side: ThemeToggle, AuthButton */}
        {showAuth && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              <AuthButton />
            </div>

            {/* Mobile menu toggle */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && showAuth && (
        <div className="md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 animate-slide-in">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Thème</span>
              <ThemeToggle />
            </div>
            <AuthButton />
          </div>
        </div>
      )}
    </header>
  )
}
