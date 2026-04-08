"use client"

import { cn } from "@/lib/utils"

interface ToolResultCardProps {
  className?: string
  children: React.ReactNode
  role?: string
  "aria-label"?: string
  "aria-describedby"?: string
}

export function ToolResultCard({
  className,
  children,
  role = "article",
  ...props
}: ToolResultCardProps) {
  return (
    <div
      role={role}
      className={cn("bg-muted/50 border border-border rounded-lg p-4 text-[14px]", className)}
      {...props}
    >
      {children}
    </div>
  )
}
