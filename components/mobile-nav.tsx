"use client"
import { Button } from "@/components/ui/button"
import { BookOpen, BarChart3, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const navItems = [
    {
      id: "content",
      label: "Contenu",
      icon: BookOpen,
    },
    {
      id: "quiz",
      label: "Quiz",
      icon: BarChart3,
    },
    {
      id: "progression",
      label: "Progression",
      icon: User,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800 px-3 py-2 shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 h-auto transition-all duration-200 rounded-lg",
                isActive
                  ? "text-primary-600 bg-primary-50 dark:bg-primary-950 shadow-md scale-105"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-primary-600 hover:bg-primary-50/50",
              )}
            >
              <Icon className={cn("w-4 h-4", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && <div className="w-1 h-1 bg-primary-600 rounded-full animate-pulse" />}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
