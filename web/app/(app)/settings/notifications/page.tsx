// Settings › Notifications
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// `NotifySettings` component (lines 460-496).

import { Card, Icon, Table, TD, TH, TR, Toggle } from "@/components/primitives";
import { DATA } from "@/lib/data";
import { SectionHead } from "../_components";

const ROWS: ReadonlyArray<readonly [string, boolean, boolean, boolean]> = [
  ["Question assigned to me", true, true, true],
  ["Work item assigned to me", true, true, true],
  ["Work item I own changes status", true, false, false],
  ["Comment mentions me", true, true, true],
  ["Sprint review starts in 24h", true, true, false],
  ["Health flips to Yellow / Red", true, true, true],
  ["Re-proposal touches my work", true, true, true],
  ["Daily AI briefing", false, true, false],
];

export default function NotificationsSettingsPage() {
  // Note: in the prototype this read viewingAs from the Settings root; here we
  // hard-fall back to the current user from DATA, matching the visible default
  // (Sarah Chen) the prototype uses on first render.
  const me =
    DATA.team.find((p) => p.id === DATA.currentUser.id) ?? DATA.team[0];

  return (
    <div>
      <SectionHead
        title="Notifications"
        sub={`Personal preferences for ${me.name}. Stored per-user, scoped to this project.`}
      />
      <Card className="!p-0">
        <Table>
          <thead>
            <tr>
              <TH>Event</TH>
              <TH className="w-[90px] text-center">In-app</TH>
              <TH className="w-[90px] text-center">Email</TH>
              <TH className="w-[90px] text-center">Slack</TH>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <TR key={i}>
                <TD>{r[0]}</TD>
                {r.slice(1).map((on, j) => (
                  <TD key={j} className="text-center">
                    <Toggle on={Boolean(on)} />
                  </TD>
                ))}
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
      <div className="mt-[12px] flex items-center gap-[10px] rounded-lg border border-border bg-canvas px-[14px] py-[10px] text-[11.5px] text-ink-3">
        <Icon name="warn" size={12} color="#64748B" />
        <span>
          Quiet hours: <b className="text-ink">9 PM → 8 AM ET</b>, weekdays only ·{" "}
          <span className="cursor-pointer text-indigo">Edit</span>
        </span>
      </div>
    </div>
  );
}
