// Re-export the primitives surface used by the shell + feature pages.
// One barrel so callers can `import { Avatar, Chip, Icon, Button } from "@/components/primitives"`.

export { Icon } from "./Icon";
export type { IconName, IconProps } from "./Icon";

export { Avatar } from "./Avatar";
export type { AvatarProps, AvatarSize } from "./Avatar";

export { Chip } from "./Chip";
export type { ChipProps, ChipTone } from "./Chip";

export { StatusChip } from "./StatusChip";
export type { StatusChipProps } from "./StatusChip";

export { Readiness } from "./Readiness";
export type { ReadinessProps } from "./Readiness";

export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

export { Card, KpiCard, AiCard, QuestionCard } from "./Card";
export type {
  CardProps,
  KpiCardProps,
  KpiDelta,
  AiCardProps,
  AiCardHead,
  QuestionCardProps,
} from "./Card";

export { Drawer } from "./Drawer";
export type { DrawerProps, DrawerWidth } from "./Drawer";

export { Table, TR, TH, TD } from "./Table";
export type { TableProps, TRProps, THProps, TDProps } from "./Table";

export { Health } from "./Health";
export type { HealthProps, HealthTone } from "./Health";
