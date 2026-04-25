// Inline-SVG icons — verbatim port of project/components.jsx Icon component.
// Server-safe (no client state).

import type { CSSProperties, ReactNode } from "react";

export type IconName =
  | "search"
  | "bell"
  | "plus"
  | "chevronRight"
  | "chevronDown"
  | "check"
  | "x"
  | "filter"
  | "sparkle"
  | "warn"
  | "edit"
  | "more"
  | "arrowRight"
  | "clock"
  | "settings"
  | "grid"
  | "list"
  | "calendar"
  | "users"
  | "home"
  | "folder"
  | "git"
  | "flag"
  | "zap"
  | "database"
  | "messageSquare"
  | "file"
  | "chart"
  | "link"
  | "branch"
  | "upload"
  | "tune"
  | "target"
  | "shield"
  | "refresh";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

const PATHS: Record<IconName, ReactNode> = {
  search: <path d="M11 11l4 4M7 12a5 5 0 110-10 5 5 0 010 10z" />,
  bell: <path d="M6 8a6 6 0 1112 0c0 6 3 7 3 7H3s3-1 3-7zM9 19a3 3 0 006 0" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12l4 4L19 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  filter: <path d="M3 5h18l-7 9v5l-4 2v-7L3 5z" />,
  sparkle: <path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3z" />,
  warn: <path d="M12 3L2 20h20L12 3zM12 10v4M12 17v.5" />,
  edit: <path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" />,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  clock: <path d="M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z" />,
  settings: (
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2 1-1 3-2-1M5 12l-2-1 1-3 2 1M12 5l1-2h-2l1 2M12 19l1 2h-2l1-2" />
  ),
  grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />,
  list: <path d="M4 6h16M4 12h16M4 18h16M1 6h.01M1 12h.01M1 18h.01" />,
  calendar: <path d="M4 7h16M6 3v4M18 3v4M4 7v13h16V7M4 12h16" />,
  users: (
    <path d="M16 14a4 4 0 10-8 0M12 10a3 3 0 100-6 3 3 0 000 6zM20 20c0-2.2-1.8-4-4-4M4 20c0-2.2 1.8-4 4-4" />
  ),
  home: <path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9z" />,
  folder: <path d="M3 7l3-3h5l2 2h8v12a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" />,
  git: (
    <path d="M6 3v12a3 3 0 003 3h6a3 3 0 003-3M6 3a3 3 0 100 6 3 3 0 000-6zM18 15a3 3 0 100 6 3 3 0 000-6zM15 9a3 3 0 100-6 3 3 0 000 6z" />
  ),
  flag: <path d="M4 21V4h11l-1 4 2 3h-12" />,
  zap: <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />,
  database: (
    <path d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3v12c0 1.7-3.6 3-8 3s-8-1.3-8-3V6zM4 6c0 1.7 3.6 3 8 3s8-1.3 8-3M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  ),
  messageSquare: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />,
  file: <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-6M22 20H2" />,
  link: (
    <path d="M10 14a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.5 1.5M14 10a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7L12 18" />
  ),
  branch: (
    <path d="M6 3v12M6 15a3 3 0 100 6 3 3 0 000-6zM6 3a3 3 0 100 6 3 3 0 000-6zM18 3a3 3 0 100 6 3 3 0 000-6zM18 9c0 6-6 3-6 9" />
  ),
  upload: <path d="M12 4v12M6 10l6-6 6 6M4 20h16" />,
  tune: <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M18 18h2M16 4v4M10 10v4M16 16v4" />,
  target: (
    <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 17a5 5 0 100-10 5 5 0 000 10zM12 13a1 1 0 100-2 1 1 0 000 2z" />
  ),
  shield: <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" />,
  refresh: <path d="M3 12a9 9 0 0114-7l4 4M21 12a9 9 0 01-14 7l-4-4M21 3v5h-5M3 21v-5h5" />,
};

export function Icon({ name, size = 14, color }: IconProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    stroke: color || "currentColor",
    fill: "none",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  return (
    <svg viewBox="0 0 24 24" style={style} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
