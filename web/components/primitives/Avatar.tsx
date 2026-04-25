// Avatar — port of project/components.jsx Avatar.
// Two prop modes:
//   1. <Avatar person="sarah" />  — looks up DATA.team for initials/color/name
//   2. <Avatar name="..." initials="SC" colorKey="a-sarah" /> — explicit
// Sizes: xs=18, sm=22, md=28 (default sm to match prototype).
//
// Server-safe; no client state.

import type { AvatarKey } from "@/lib/types";
import { DATA } from "@/lib/data";

export type AvatarSize = "xs" | "sm" | "md";

interface BaseProps {
  size?: AvatarSize;
}

interface PersonProps extends BaseProps {
  person: string;
  name?: never;
  initials?: never;
  colorKey?: never;
}

interface ExplicitProps extends BaseProps {
  person?: never;
  name: string;
  initials: string;
  colorKey: AvatarKey;
}

interface PlaceholderProps extends BaseProps {
  person?: undefined;
  name?: undefined;
  initials?: undefined;
  colorKey?: undefined;
}

export type AvatarProps = PersonProps | ExplicitProps | PlaceholderProps;

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: "w-[18px] h-[18px] text-[9px]",
  sm: "w-[22px] h-[22px] text-[10px]",
  md: "w-[28px] h-[28px] text-[11px]",
};

const COLOR_CLASS: Record<AvatarKey, string> = {
  "a-sarah": "bg-a-sarah",
  "a-david": "bg-a-david",
  "a-jamie": "bg-a-jamie",
  "a-priya": "bg-a-priya",
  "a-marcus": "bg-a-marcus",
  "a-michael": "bg-a-michael",
  "a-client": "bg-a-client",
};

const BASE =
  "inline-grid place-items-center rounded-full text-white font-semibold shrink-0 select-none";

export function Avatar(props: AvatarProps) {
  const size: AvatarSize = props.size ?? "sm";
  const sizeClass = SIZE_CLASS[size];

  // Placeholder ("?") path — no person, no explicit identity.
  if (!props.person && !props.name) {
    return (
      <div
        className={`${BASE} ${sizeClass} ${COLOR_CLASS["a-client"]} opacity-60`}
        aria-hidden
      >
        ?
      </div>
    );
  }

  // Explicit identity path.
  if (props.name && props.initials && props.colorKey) {
    return (
      <div
        className={`${BASE} ${sizeClass} ${COLOR_CLASS[props.colorKey]}`}
        title={props.name}
      >
        {props.initials}
      </div>
    );
  }

  // Person-id lookup path.
  const member = DATA.team.find((t) => t.id === props.person);
  if (!member) {
    // Unknown person id → render placeholder per spec.
    return (
      <div
        className={`${BASE} ${sizeClass} ${COLOR_CLASS["a-client"]} opacity-60`}
        aria-hidden
      >
        ?
      </div>
    );
  }
  return (
    <div
      className={`${BASE} ${sizeClass} ${COLOR_CLASS[member.avatar]}`}
      title={member.name}
    >
      {member.initials}
    </div>
  );
}
