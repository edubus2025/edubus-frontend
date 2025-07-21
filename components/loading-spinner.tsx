"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="relative">
        <div
          className={cn(
            "animate-spin rounded-full border-4 border-primary-200",
            "border-t-primary-600",
            sizeClasses[size],
          )}
        />
        <div
          className={cn(
            "absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 opacity-20",
            sizeClasses[size],
          )}
        />
      </div>
      {text && <p className="text-sm text-neutral-600 animate-pulse-soft">{text}</p>}
    </div>
  )
}
