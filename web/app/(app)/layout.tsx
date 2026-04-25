// (app) layout — mounts the shell (Rail + Topbar + ProjectHeader) and
// wraps everything in app-wide providers + DrawerHost.

"use client";

import type { ReactNode } from "react";

import { DrawerHost } from "@/components/drawers/DrawerHost";
import { ProjectHeader } from "@/components/shell/ProjectHeader";
import { Rail } from "@/components/shell/Rail";
import { Topbar } from "@/components/shell/Topbar";
import { AppProviders } from "@/lib/context";

export default function AppLayout({ children }: { children: ReactNode }) {
  const handleTweaks = () => {
    // Tweaks panel is owned by a later wave.
    // No-op placeholder for now.
  };

  return (
    <AppProviders>
      <div className="grid h-screen grid-cols-[var(--spacing-rail)_1fr] overflow-hidden">
        <Rail onTweaks={handleTweaks} />
        <div className="flex min-w-0 flex-col overflow-hidden">
          <Topbar />
          <ProjectHeader />
          <main className="flex-1 overflow-auto p-[20px]">{children}</main>
        </div>
      </div>
      <DrawerHost />
    </AppProviders>
  );
}
