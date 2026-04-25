// Table — port of project/styles.css .tbl. Sticky uppercase header,
// 9×10 cell padding, hover rows, selected-row state, monospace ID helper.

import type {
  HTMLAttributes,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

interface TableComponent {
  (props: TableProps): ReactNode;
  Mono: (props: { children: ReactNode; className?: string }) => ReactNode;
}

const TABLE_BASE = "w-full border-collapse text-[12px]";

function TableImpl({ children, className = "", ...rest }: TableProps) {
  return (
    <table className={`${TABLE_BASE} ${className}`} {...rest}>
      {children}
    </table>
  );
}

function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[11px] text-ink-3 ${className}`}>{children}</span>
  );
}

export const Table: TableComponent = Object.assign(TableImpl, { Mono });

/* ---------------- Row ---------------- */

export interface TRProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}

export function TR({ selected = false, className = "", children, ...rest }: TRProps) {
  return (
    <tr
      className={`${
        selected ? "bg-indigo-bg" : "hover:bg-canvas hover:cursor-pointer"
      } ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

/* ---------------- Header cell ---------------- */

export type THProps = ThHTMLAttributes<HTMLTableCellElement>;

export function TH({ className = "", children, ...rest }: THProps) {
  return (
    <th
      className={`text-left px-[10px] py-[8px] text-[11px] font-medium text-muted uppercase tracking-[0.04em] bg-canvas border-b border-border sticky top-0 whitespace-nowrap ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

/* ---------------- Body cell ---------------- */

export type TDProps = TdHTMLAttributes<HTMLTableCellElement>;

export function TD({ className = "", children, ...rest }: TDProps) {
  return (
    <td
      className={`px-[10px] py-[9px] border-b border-stripe align-middle ${className}`}
      {...rest}
    >
      {children}
    </td>
  );
}
