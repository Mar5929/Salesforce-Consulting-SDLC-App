"use client";

// DrawerHost — reads useDrawer() and renders the correct drawer for the
// active type. Wave 2H replaces these placeholder bodies with the real
// WorkItemDrawer / QuestionDrawer / ReproposalDrawer / ReadinessDrawer.
//
// NOTE: Wave 1A is creating <Drawer> in @/components/primitives. Until that
// lands we render a minimal inline placeholder so this file builds on its own.
// When the real primitive is available, swap PlaceholderDrawer for the import:
//   import { Drawer } from "@/components/primitives";

import type { ReactNode } from "react";
import {
  useDrawer,
  type DrawerPayloadMap,
  type DrawerType,
} from "@/lib/context";

type Width = "sm" | "md" | "lg";

const WIDTH_PX: Record<Width, number> = { sm: 640, md: 900, lg: 1080 };

function PlaceholderDrawer({
  open,
  onClose,
  width,
  children,
}: {
  open: boolean;
  onClose: () => void;
  width: Width;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/35"
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed top-0 right-0 z-50 h-full bg-white shadow-2xl flex flex-col"
        style={{ width: WIDTH_PX[width] }}
      >
        {children}
      </aside>
    </>
  );
}

function DrawerShell({
  title,
  width,
  payload,
  onClose,
}: {
  title: string;
  width: Width;
  payload: unknown;
  onClose: () => void;
}) {
  return (
    <PlaceholderDrawer open onClose={onClose} width={width}>
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close drawer"
          className="text-slate-500 hover:text-slate-900 text-lg leading-none"
        >
          ×
        </button>
      </header>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-xs">{JSON.stringify(payload, null, 2)}</pre>
      </div>
      <footer className="flex justify-end gap-2 px-4 py-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs rounded border border-slate-300 hover:bg-slate-50"
        >
          Close
        </button>
      </footer>
    </PlaceholderDrawer>
  );
}

const TITLE: Record<DrawerType, string> = {
  workItem: "Work item drawer (Wave 2)",
  question: "Question drawer (Wave 2)",
  reproposal: "Reproposal drawer (Wave 2)",
  readiness: "Readiness drawer (Wave 2)",
};

const WIDTH: Record<DrawerType, Width> = {
  workItem: "lg",
  question: "sm",
  reproposal: "md",
  readiness: "sm",
};

export function DrawerHost() {
  const { type, payload, closeDrawer } = useDrawer();
  if (type === null) return null;

  // Narrow the payload at the boundary so each drawer body sees a typed shape.
  // The cast is safe because openDrawer<T> enforces (type, DrawerPayloadMap[T]).
  switch (type) {
    case "workItem": {
      const p = payload as DrawerPayloadMap["workItem"];
      return (
        <DrawerShell
          title={TITLE.workItem}
          width={WIDTH.workItem}
          payload={p}
          onClose={closeDrawer}
        />
      );
    }
    case "question": {
      const p = payload as DrawerPayloadMap["question"];
      return (
        <DrawerShell
          title={TITLE.question}
          width={WIDTH.question}
          payload={p}
          onClose={closeDrawer}
        />
      );
    }
    case "reproposal": {
      const p = payload as DrawerPayloadMap["reproposal"];
      return (
        <DrawerShell
          title={TITLE.reproposal}
          width={WIDTH.reproposal}
          payload={p}
          onClose={closeDrawer}
        />
      );
    }
    case "readiness": {
      const p = payload as DrawerPayloadMap["readiness"];
      return (
        <DrawerShell
          title={TITLE.readiness}
          width={WIDTH.readiness}
          payload={p}
          onClose={closeDrawer}
        />
      );
    }
    default: {
      // Exhaustiveness check
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export default DrawerHost;
