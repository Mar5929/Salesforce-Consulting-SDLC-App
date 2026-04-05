"use client"

import { Sidebar } from "@/components/layout/sidebar"

interface AppShellProps {
  children: React.ReactNode
  currentMemberRole?: string
  activeProjectId?: string
}

export function AppShell({
  children,
  currentMemberRole,
  activeProjectId,
}: AppShellProps) {
  return (
    <div className="flex h-screen">
      <Sidebar
        currentMemberRole={currentMemberRole}
        activeProjectId={activeProjectId}
      />
      <main className="flex-1 overflow-y-auto bg-white px-8 pt-6">
        {children}
      </main>
    </div>
  )
}
