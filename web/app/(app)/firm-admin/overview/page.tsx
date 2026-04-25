// Firm Admin › Overview
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/firm-admin.jsx
// (lines 132-239) — KPI band, signal feed, recent actions, utilization grid.

import { Avatar, Card, Chip, Icon, KpiCard } from "@/components/primitives";
import type { IconName } from "@/components/primitives";
import { FA_DATA, type FirmSignal, type FirmSignalTone } from "@/lib/firmAdminData";
import { SectionHead } from "../_components";

const SIGNAL_ICON: Record<FirmSignal["icon"], IconName> = {
  warn: "warn",
  dollar: "dollar",
  shield: "shield",
  check: "check",
  users: "users",
};

const SIGNAL_ACCENT: Record<FirmSignalTone, string> = {
  red: "border-red-dot",
  amber: "border-yellow-dot",
  green: "border-green-dot",
};

const SIGNAL_ICON_COLOR: Record<FirmSignalTone, string> = {
  red: "#EF4444",
  amber: "#F59E0B",
  green: "#16A34A",
};

const RECENT_TONE: Record<string, "indigo" | "green" | "amber" | "gray" | "violet"> = {
  Edited: "indigo",
  Approved: "green",
  Throttled: "amber",
  Invited: "violet",
  Bumped: "indigo",
  Updated: "indigo",
};

export default function FirmAdminOverviewPage() {
  const activeProjects = FA_DATA.projects.filter((p) => p.state === "active");
  const yellow = activeProjects.filter((p) => p.health === "yellow").length;
  const red = activeProjects.filter((p) => p.health === "red").length;
  const firmMtd = activeProjects.reduce((sum, p) => sum + p.mtd, 0);
  const overCap = activeProjects.filter((p) => p.mtd > p.cap).length;
  const seats = FA_DATA.roster.filter((r) => r.status === "active").length;

  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHead
        title="Firm overview"
        sub="Cross-project signal, spend, and roster at a glance. Today is Apr 25, 2026."
        actions={<Chip tone="violet">firm-managed</Chip>}
      />

      {/* KPI band */}
      <div className="grid grid-cols-4 gap-[12px]">
        <KpiCard
          label="Active projects"
          value={activeProjects.length}
          sub={
            <span>
              {yellow} yellow · <span className="text-red-text">{red} red</span>
            </span>
          }
        />
        <KpiCard
          label="Firm · MTD spend"
          value={`$${firmMtd.toFixed(2)}`}
          sub={
            overCap > 0 ? (
              <span className="text-yellow-text">{overCap} project over cap</span>
            ) : (
              "all projects within cap"
            )
          }
        />
        <KpiCard
          label="Active signals"
          value={FA_DATA.signals.length}
          sub="needs attention this week"
        />
        <KpiCard
          label="Active seats"
          value={
            <>
              {seats}
              <span className="ml-[4px] text-[13px] text-muted-2">/30</span>
            </>
          }
          sub={`${30 - seats} seats remaining`}
        />
      </div>

      {/* Signals + Recent actions */}
      <div className="grid gap-[12px] [grid-template-columns:2fr_1fr]">
        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Signals across firm
            <span className="ml-auto rounded-pill bg-stripe px-[7px] py-[2px] text-xs font-medium text-ink-3">
              {FA_DATA.signals.length}
            </span>
          </h3>
          <div className="flex flex-col gap-[10px]">
            {FA_DATA.signals.map((s, i) => (
              <div
                key={i}
                className={`flex items-start gap-[10px] border-l-[3px] ${SIGNAL_ACCENT[s.tone]} pl-[10px]`}
              >
                <div className="mt-[2px]">
                  <Icon name={SIGNAL_ICON[s.icon]} size={14} color={SIGNAL_ICON_COLOR[s.tone]} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium leading-[1.4] text-ink">{s.title}</div>
                  <div className="mt-[3px] text-[11.5px] leading-[1.5] text-muted">{s.detail}</div>
                </div>
                <div className="shrink-0 text-[10.5px] text-muted-2">{s.when}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            Recent actions
          </h3>
          <div className="flex flex-col gap-[8px] text-[12px]">
            {FA_DATA.recentActions.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-[8px] border-b border-stripe py-[6px] last:border-b-0"
              >
                {a.who === "system" ? (
                  <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-stripe text-[9px] font-semibold text-muted">
                    sys
                  </span>
                ) : (
                  <Avatar person={a.who} size="xs" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-[6px]">
                    <Chip tone={RECENT_TONE[a.label] ?? "gray"}>{a.label}</Chip>
                    <span className="text-[10.5px] text-muted-2">{a.when}</span>
                  </div>
                  <div className="mt-[3px] text-[11.5px] leading-[1.45] text-ink-2">{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Utilization */}
      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          Consultant utilization
          <span className="ml-auto text-[11px] font-normal normal-case tracking-normal text-muted">
            project load vs. cap
          </span>
        </h3>
        <div className="grid grid-cols-3 gap-[10px]">
          {FA_DATA.utilization.map((u) => {
            const pct = u.cap === 0 ? 0 : Math.min(100, Math.round((u.proj / u.cap) * 100));
            const over = u.cap > 0 && u.proj > u.cap;
            const fillClass = over
              ? "bg-red-dot"
              : pct >= 90
                ? "bg-yellow-dot"
                : "bg-indigo";
            return (
              <div
                key={u.who}
                className="flex items-center gap-[10px] rounded-card border border-stripe bg-canvas px-[10px] py-[9px]"
              >
                <Avatar person={u.who} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-ink">{u.name}</div>
                  <div className="text-[10.5px] text-muted">{u.role}</div>
                  {u.cap > 0 ? (
                    <div className="mt-[6px] flex items-center gap-[6px]">
                      <div className="h-[5px] flex-1 overflow-hidden rounded-pill bg-stripe">
                        <div
                          className={`h-full rounded-pill ${fillClass}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span
                        className={`font-mono text-[10.5px] ${
                          over ? "text-red-text" : "text-muted"
                        }`}
                      >
                        {u.proj}/{u.cap}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-[6px] text-[10.5px] text-muted">no project load</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
