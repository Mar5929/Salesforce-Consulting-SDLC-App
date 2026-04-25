// Button — port of project/styles.css .btn variants.

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "default" | "primary" | "ghost" | "danger" | "amber";
export type ButtonSize = "default" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  default:
    "bg-surface border border-border text-ink-2 hover:bg-canvas hover:border-border-hover",
  primary:
    "bg-indigo border border-indigo text-white hover:bg-indigo-2 hover:border-indigo-2",
  ghost: "bg-transparent border border-transparent text-ink-2 hover:bg-stripe",
  danger:
    "bg-surface border border-red-border text-red-text hover:bg-red-bg hover:border-red-border",
  amber:
    "bg-yellow-dot border border-yellow-dot text-white hover:bg-yellow-dot-2 hover:border-yellow-dot-2",
};

const SIZE: Record<ButtonSize, string> = {
  default: "px-[11px] py-[5px] text-[12px]",
  sm: "px-[9px] py-[3px] text-[11.5px]",
};

const BASE =
  "inline-flex items-center gap-[6px] rounded-lg font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export function Button({
  variant = "default",
  size = "default",
  iconLeft,
  iconRight,
  children,
  className = "",
  type,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={`${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
