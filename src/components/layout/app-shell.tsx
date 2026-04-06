"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { CommandPalette } from "@/components/search/command-palette"
import { NotificationBell } from "@/components/notifications/notification-bell"

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
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* App header bar — search trigger, notifications, avatar */}
        {activeProjectId && (
          <header className="flex h-12 shrink-0 items-center justify-end gap-2 border-b border-zinc-100 bg-white px-6">
            <NotificationBell projectId={activeProjectId} />
          </header>
        )}
        <main className="flex-1 overflow-y-auto bg-white px-8 pt-6">
          {children}
        </main>
      </div>
      {activeProjectId && <CommandPalette projectId={activeProjectId} />}
    </div>
  )
}
