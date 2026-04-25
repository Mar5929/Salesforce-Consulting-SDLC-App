"use client";

// App-wide React Context for the active "viewing-as" role and the currently
// open drawer + payload. Replaces the prototype's
// `window.dispatchEvent(new CustomEvent('open-readiness'))` pattern.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ---------- Viewing-as ----------

export interface ViewingAsContextValue {
  viewingAs: string;
  setViewingAs: (id: string) => void;
}

const ViewingAsContext = createContext<ViewingAsContextValue | null>(null);

export function ViewingAsProvider({ children }: { children: ReactNode }) {
  const [viewingAs, setViewingAs] = useState<string>("sarah");
  const value = useMemo<ViewingAsContextValue>(
    () => ({ viewingAs, setViewingAs }),
    [viewingAs],
  );
  return (
    <ViewingAsContext.Provider value={value}>
      {children}
    </ViewingAsContext.Provider>
  );
}

export function useViewingAs(): ViewingAsContextValue {
  const ctx = useContext(ViewingAsContext);
  if (!ctx) {
    throw new Error(
      "useViewingAs must be used within a <ViewingAsProvider>. " +
        "Wrap your app (typically app/(app)/layout.tsx) in <AppProviders>.",
    );
  }
  return ctx;
}

// ---------- Drawer ----------

export type DrawerType = "workItem" | "question" | "reproposal" | "readiness";

export interface DrawerPayloadMap {
  workItem: { id: string };
  question: { id: string };
  reproposal: Record<string, never>;
  readiness: { score: number; subject?: string };
}

interface DrawerState {
  type: DrawerType | null;
  payload: unknown;
}

export interface DrawerContextValue extends DrawerState {
  openDrawer: <T extends DrawerType>(
    type: T,
    payload: DrawerPayloadMap[T],
  ) => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DrawerState>({ type: null, payload: null });

  const openDrawer = useCallback(
    <T extends DrawerType>(type: T, payload: DrawerPayloadMap[T]) => {
      setState({ type, payload });
    },
    [],
  );

  const closeDrawer = useCallback(() => {
    setState({ type: null, payload: null });
  }, []);

  const value = useMemo<DrawerContextValue>(
    () => ({
      type: state.type,
      payload: state.payload,
      openDrawer,
      closeDrawer,
    }),
    [state.type, state.payload, openDrawer, closeDrawer],
  );

  return (
    <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>
  );
}

export function useDrawer(): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error(
      "useDrawer must be used within a <DrawerProvider>. " +
        "Wrap your app (typically app/(app)/layout.tsx) in <AppProviders>.",
    );
  }
  return ctx;
}

// ---------- Combined provider ----------

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ViewingAsProvider>
      <DrawerProvider>{children}</DrawerProvider>
    </ViewingAsProvider>
  );
}
