"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type Theme = "light" | "dark" | "system"

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      applyTheme("system")
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newTheme)
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    applyTheme(newTheme)
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
        <div className="w-4 h-4" />
      </Button>
    )
  }

  const themeIcons = {
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
    system: <Monitor className="w-4 h-4" />,
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-9 h-9 p-0 transition-all duration-300",
            "hover:bg-primary-100 dark:hover:bg-primary-900",
            "hover:scale-110 active:scale-95",
          )}
        >
          <div className="transition-transform duration-300 hover:rotate-12">{themeIcons[theme]}</div>
          <span className="sr-only">Changer le thème</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => handleThemeChange("light")} className="cursor-pointer">
          <Sun className="w-4 h-4 mr-2" />
          Clair
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")} className="cursor-pointer">
          <Moon className="w-4 h-4 mr-2" />
          Sombre
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")} className="cursor-pointer">
          <Monitor className="w-4 h-4 mr-2" />
          Système
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
