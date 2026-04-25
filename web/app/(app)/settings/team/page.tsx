// Settings › Team & access
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// `TeamSettings` component (lines 164-242).

import {
  Avatar,
  Button,
  Card,
  Icon,
  Table,
  TD,
  TH,
  TR,
} from "@/components/primitives";
import { DATA } from "@/lib/data";
import { SectionHead } from "../_components";

interface TeamRow {
  id: string;
  role: string;
  perm: "Admin" | "Editor" | "Developer" | "Viewer";
  last: string;
}

const TEAM: TeamRow[] = [
  { id: "sarah", role: "Solution Architect", perm: "Admin", last: "2 min ago" },
  { id: "jamie", role: "Project Manager", perm: "Editor", last: "1 hr ago" },
  { id: "priya", role: "Business Analyst", perm: "Editor", last: "4 hr ago" },
  { id: "david", role: "Developer", perm: "Developer", last: "Just now" },
  { id: "marcus", role: "QA Engineer", perm: "Editor", last: "Yesterday" },
];

const PERM_LEVELS: TeamRow["perm"][] = ["Admin", "Editor", "Developer", "Viewer"];

const MATRIX: ReadonlyArray<readonly [string, string, string, string, string]> = [
  ["Edit project info", "✓", "—", "—", "—"],
  ["Invite / remove members", "✓", "—", "—", "—"],
  ["Configure SF org connection", "✓", "—", "—", "—"],
  ["Edit work items, write answers", "✓", "✓", "—", "—"],
  ["Update WI status (own assignments)", "✓", "✓", "✓", "—"],
  ["View deliverables and dashboards", "✓", "✓", "✓", "✓"],
];

export default function TeamSettingsPage() {
  return (
    <div>
      <SectionHead
        title="Team & access"
        sub="Project-scoped roles. Per §19, every user belongs to exactly one role per project; cross-project permissions are managed at the firm level."
        actions={
          <Button
            size="sm"
            variant="primary"
            iconLeft={<Icon name="plus" size={11} color="#ffffff" />}
          >
            Invite member
          </Button>
        }
      />

      <Card className="!p-0 overflow-hidden">
        <Table>
          <thead>
            <tr>
              <TH>Member</TH>
              <TH className="w-[180px]">Project role</TH>
              <TH className="w-[140px]">Permission</TH>
              <TH className="w-[110px]">Last active</TH>
              <TH className="w-[60px]"></TH>
            </tr>
          </thead>
          <tbody>
            {TEAM.map((t) => {
              const p = DATA.team.find((x) => x.id === t.id);
              if (!p) return null;
              const email = `${p.name.toLowerCase().split(" ")[0]}@rihm.com`;
              return (
                <TR key={t.id}>
                  <TD>
                    <div className="flex items-center gap-[8px]">
                      <Avatar person={t.id} size="xs" />
                      <div>
                        <div className="text-[12.5px] font-medium">{p.name}</div>
                        <div className="text-[11px] text-muted">{email}</div>
                      </div>
                    </div>
                  </TD>
                  <TD>{t.role}</TD>
                  <TD>
                    <select
                      defaultValue={t.perm}
                      className="rounded-xs border border-border bg-surface px-[8px] py-[4px] text-[11.5px]"
                    >
                      {PERM_LEVELS.map((p2) => (
                        <option key={p2}>{p2}</option>
                      ))}
                    </select>
                  </TD>
                  <TD className="text-sm text-muted">{t.last}</TD>
                  <TD>
                    <span className="grid h-[24px] w-[24px] place-items-center rounded-md text-muted hover:bg-canvas">
                      <Icon name="more" size={12} />
                    </span>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <div className="mt-[18px] rounded-lg border border-border bg-canvas px-[14px] py-[12px] text-[12px] text-ink-3">
        <div className="mb-[6px] font-semibold text-ink">Permission matrix</div>
        <Table className="!text-sm">
          <thead>
            <tr>
              <TH>Action</TH>
              <TH className="text-center">Admin</TH>
              <TH className="text-center">Editor</TH>
              <TH className="text-center">Developer</TH>
              <TH className="text-center">Viewer</TH>
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((r, i) => (
              <TR key={i}>
                <TD>{r[0]}</TD>
                {r.slice(1).map((c, j) => (
                  <TD
                    key={j}
                    className={`text-center ${
                      c === "✓"
                        ? "font-semibold text-green-dot"
                        : "font-normal text-border-hover"
                    }`}
                  >
                    {c}
                  </TD>
                ))}
              </TR>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
