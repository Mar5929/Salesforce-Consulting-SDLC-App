// Firm Admin › Projects
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/firm-admin.jsx
// (lines 257-347) — full-firm project ledger.

import { Avatar, Card, Chip, Health, Table, TD, TH, TR } from "@/components/primitives";
import { FA_DATA, type FirmHealth } from "@/lib/firmAdminData";
import { SectionHead } from "../_components";

const STAGE_TONE: Record<string, "indigo" | "violet" | "amber" | "green" | "gray" | "blue"> = {
  Discovery: "blue",
  Roadmap: "indigo",
  Build: "violet",
  Testing: "amber",
  Hypercare: "green",
  Archive: "gray",
};

const HEALTH_LABEL: Record<FirmHealth, string> = {
  green: "Green",
  yellow: "Yellow",
  red: "Red",
};

export default function FirmAdminProjectsPage() {
  const active = FA_DATA.projects.filter((p) => p.state === "active");
  const archived = FA_DATA.projects.filter((p) => p.state === "archive");

  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHead
        title="Projects"
        sub={`${active.length} active · ${archived.length} archived. Click a row in v2 to deep-link into the project.`}
        actions={
          <>
            <Chip tone="green">{active.length} active</Chip>
            <Chip tone="gray">{archived.length} archived</Chip>
          </>
        }
      />

      <Card className="!p-0">
        <Table>
          <thead>
            <tr>
              <TH>Client</TH>
              <TH>Engagement</TH>
              <TH className="w-[110px]">Stage</TH>
              <TH className="w-[120px]">Health</TH>
              <TH className="w-[120px]">MTD spend</TH>
              <TH className="w-[110px]">Owner</TH>
              <TH className="w-[140px]">Team</TH>
              <TH className="w-[110px]">Sprint</TH>
              <TH className="w-[120px]">Last active</TH>
            </tr>
          </thead>
          <tbody>
            {FA_DATA.projects.map((p) => {
              const pct = p.cap === 0 ? 0 : Math.min(100, Math.round((p.mtd / p.cap) * 100));
              const over = p.mtd > p.cap;
              return (
                <TR key={p.id}>
                  <TD>
                    <div className="flex items-center gap-[8px]">
                      <span
                        className="grid h-[22px] w-[22px] place-items-center rounded-md text-[10px] font-bold text-white"
                        style={{ background: p.color }}
                      >
                        {p.initial}
                      </span>
                      <div>
                        <div className="text-[12px] font-medium text-ink">{p.client}</div>
                        <div className="text-[10.5px] text-muted">started {p.started}</div>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-[11.5px] text-ink-2">{p.engagement}</TD>
                  <TD>
                    <Chip tone={STAGE_TONE[p.stage] ?? "gray"}>{p.stage}</Chip>
                  </TD>
                  <TD>
                    {p.state === "archive" ? (
                      <span className="text-[11px] text-muted">—</span>
                    ) : (
                      <Health tone={p.health}>{HEALTH_LABEL[p.health]}</Health>
                    )}
                  </TD>
                  <TD>
                    {p.cap === 0 ? (
                      <span className="font-mono text-[11px] text-muted">—</span>
                    ) : (
                      <div className="flex flex-col gap-[3px]">
                        <span
                          className={`font-mono text-[11.5px] ${
                            over ? "text-red-text font-semibold" : "text-ink"
                          }`}
                        >
                          ${p.mtd.toFixed(2)}
                          <span className="text-muted-2"> / ${p.cap}</span>
                        </span>
                        <div className="h-[4px] w-[80px] overflow-hidden rounded-pill bg-stripe">
                          <div
                            className={`h-full rounded-pill ${
                              over ? "bg-red-dot" : pct >= 80 ? "bg-yellow-dot" : "bg-indigo"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-[6px]">
                      <Avatar person={p.owner} size="xs" />
                      <span className="text-[11.5px] text-ink-2">
                        {p.owner.charAt(0).toUpperCase() + p.owner.slice(1)}
                      </span>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex items-center -space-x-[4px]">
                      {p.team.slice(0, 4).map((m) => (
                        <span key={m} className="ring-2 ring-surface rounded-full">
                          <Avatar person={m} size="xs" />
                        </span>
                      ))}
                      {p.team.length > 4 && (
                        <span className="ml-[6px] text-[10.5px] text-muted">+{p.team.length - 4}</span>
                      )}
                    </div>
                  </TD>
                  <TD className="font-mono text-[11px] text-ink-2">{p.sprint}</TD>
                  <TD className="text-[11px] text-muted">{p.lastActive}</TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
