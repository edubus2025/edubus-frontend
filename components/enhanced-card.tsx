"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface EnhancedCardProps {
  title?: string
  children: ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
  icon?: ReactNode
  badge?: string
  onClick?: () => void
}

export function EnhancedCard({
  title,
  children,
  className,
  hover = true,
  gradient = false,
  icon,
  badge,
  onClick,
}: EnhancedCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        hover && "hover:shadow-xl hover:scale-[1.02] cursor-pointer",
        gradient && "bg-gradient-to-br from-white to-primary-50 dark:from-neutral-900 dark:to-primary-950",
        "border-0 shadow-lg backdrop-blur-sm",
        className,
      )}
      onClick={onClick}
    >
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 opacity-50" />
      )}

      {badge && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-accent-500 text-white text-xs rounded-full font-medium">
          {badge}
        </div>
      )}

      {title && (
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-neutral-800 dark:text-neutral-200">
            {icon && <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">{icon}</div>}
            {title}
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="relative">{children}</CardContent>
    </Card>
  )
}
