"use client"

/**
 * Command component (cmdk-based pattern)
 *
 * Built inline since node_modules not installed for shadcn CLI.
 * Follows shadcn/ui Command API contract using native dialog + input.
 * When cmdk package is installed, this can be replaced with the full shadcn version.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// CommandDialog — overlay modal triggered by Cmd+K
// ---------------------------------------------------------------------------

interface CommandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function CommandDialog({ open, onOpenChange, children }: CommandDialogProps) {
  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {/* Dialog */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-[540px] -translate-x-1/2 rounded-xl border border-[#E5E5E5] bg-white shadow-2xl">
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CommandInput
// ---------------------------------------------------------------------------

interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

export const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="flex items-center border-b border-[#E5E5E5] px-4">
        {icon && <span className="mr-2 text-[#A3A3A3]">{icon}</span>}
        <input
          ref={ref}
          className={cn(
            "flex h-12 w-full bg-transparent text-[14px] text-foreground placeholder:text-[#A3A3A3] outline-none",
            className
          )}
          {...props}
        />
        <kbd className="ml-2 hidden rounded border border-[#E5E5E5] px-1.5 py-0.5 text-[10px] text-[#A3A3A3] sm:inline-block">
          ESC
        </kbd>
      </div>
    )
  }
)
CommandInput.displayName = "CommandInput"

// ---------------------------------------------------------------------------
// CommandList — scrollable result container
// ---------------------------------------------------------------------------

interface CommandListProps {
  children: React.ReactNode
  className?: string
}

export function CommandList({ children, className }: CommandListProps) {
  return (
    <div
      className={cn(
        "max-h-[320px] overflow-y-auto overscroll-contain px-2 py-2",
        className
      )}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CommandGroup — labeled section
// ---------------------------------------------------------------------------

interface CommandGroupProps {
  heading?: string
  children: React.ReactNode
}

export function CommandGroup({ heading, children }: CommandGroupProps) {
  return (
    <div className="mb-1">
      {heading && (
        <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-[#A3A3A3]">
          {heading}
        </div>
      )}
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CommandItem — individual selectable item
// ---------------------------------------------------------------------------

interface CommandItemProps {
  onSelect?: () => void
  children: React.ReactNode
  className?: string
}

export function CommandItem({ onSelect, children, className }: CommandItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] focus:outline-none",
        className
      )}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// CommandEmpty — shown when no results
// ---------------------------------------------------------------------------

interface CommandEmptyProps {
  children?: React.ReactNode
}

export function CommandEmpty({ children }: CommandEmptyProps) {
  return (
    <div className="py-6 text-center text-[13px] text-[#A3A3A3]">
      {children ?? "No results found."}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CommandSeparator
// ---------------------------------------------------------------------------

export function CommandSeparator() {
  return <div className="my-1 h-px bg-[#E5E5E5]" />
}
