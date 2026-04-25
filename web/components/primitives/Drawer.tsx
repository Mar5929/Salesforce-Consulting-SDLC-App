// Drawer — port of project/components.jsx Drawer.
// Right-slide 0.22s ease, backdrop opacity 0.35, Esc closes (when open),
// click-outside closes. Consumer composes the drawer body (head/body/foot).

"use client";

import { useEffect, type ReactNode } from "react";

export type DrawerWidth = "sm" | "md" | "lg";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  width?: DrawerWidth;
  children: ReactNode;
}

const WIDTH_CLASS: Record<DrawerWidth, string> = {
  sm: "w-drawer-sm",
  md: "w-drawer-md",
  lg: "w-drawer-lg",
};

export function Drawer({ open, onClose, width = "sm", children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-[rgba(15,23,42,0.35)] transition-opacity duration-[180ms] ease-out ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 right-0 bottom-0 z-[51] max-w-[96vw] ${WIDTH_CLASS[width]} bg-surface border-l border-border flex flex-col shadow-drawer transition-transform duration-[220ms] ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {children}
      </div>
    </>
  );
}
