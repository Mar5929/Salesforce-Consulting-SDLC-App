// Firm Admin › People & seats
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/firm-admin.jsx
// (lines 350-441) — firm roster with seat type, Claude Code license flag, and project assignments.

import {
  Avatar,
  Button,
  Card,
  Chip,
  Icon,
  KpiCard,
  Table,
  TD,
  TH,
  TR,
} from "@/components/primitives";
import { DATA } from "@/lib/data";
import { FA_DATA, type FirmRosterRow } from "@/lib/firmAdminData";
import { SectionHead } from "../_components";

const SEAT_TONE: Record<FirmRosterRow["seat"], "indigo" | "violet" | "amber" | "green" | "blue" | "pink"> = {
  Architect: "indigo",
  PM: "amber",
  BA: "blue",
  Dev: "violet",
  QA: "pink",
  Admin: "green",
};

const STATUS_TONE: Record<FirmRosterRow["status"], "green" | "amber" | "red"> = {
  active: "green",
  pending: "amber",
  suspended: "red",
};

export default function FirmAdminPeoplePage() {
  const seats = FA_DATA.roster.length;
  const ccSeats = FA_DATA.roster.filter((r) => r.cc).length;
  const pending = FA_DATA.roster.filter((r) => r.status === "pending").length;

  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHead
        title="People & seats"
        sub="Web-app seats are billed firm-wide. Claude Code is licensed separately per seat."
        actions={
          <Button size="sm" variant="primary" iconLeft={<Icon name="plus" size={12} color="#fff" />}>
            Invite member
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-[12px]">
        <KpiCard
          label="Web-app seats"
          value={
            <>
              {seats}
              <span className="ml-[4px] text-[13px] text-muted-2">/30</span>
            </>
          }
          sub={`${30 - seats} remaining`}
        />
        <KpiCard
          label="Claude Code seats"
          value={
            <>
              {ccSeats}
              <span className="ml-[4px] text-[13px] text-muted-2">/15</span>
            </>
          }
          sub="add-on, $30/seat"
        />
        <KpiCard
          label="Pending invitations"
          value={pending + 2}
          sub="2 not yet accepted (24h+)"
        />
      </div>

      <Card className="!p-0">
        <Table>
          <thead>
            <tr>
              <TH>Member</TH>
              <TH className="w-[140px]">Role</TH>
              <TH className="w-[100px]">Seat</TH>
              <TH className="w-[80px]">Claude Code</TH>
              <TH className="w-[200px]">Active projects</TH>
              <TH className="w-[100px]">Status</TH>
              <TH className="w-[120px]">Last login</TH>
              <TH className="w-[110px]">Joined</TH>
            </tr>
          </thead>
          <tbody>
            {FA_DATA.roster.map((r) => {
              const member = DATA.team.find((t) => t.id === r.id);
              return (
                <TR key={r.id}>
                  <TD>
                    <div className="flex items-center gap-[8px]">
                      <Avatar person={r.id} size="sm" />
                      <div>
                        <div className="text-[12px] font-medium text-ink">{member?.name ?? r.id}</div>
                        <div className="text-[10.5px] text-muted">{r.id}@rihm.com</div>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-[11.5px] text-muted">{member?.role}</TD>
                  <TD>
                    <Chip tone={SEAT_TONE[r.seat]}>{r.seat}</Chip>
                  </TD>
                  <TD>
                    {r.cc ? (
                      <span className="inline-flex items-center gap-[4px] text-[11px] text-green-text">
                        <Icon name="check" size={11} />
                        on
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-2">—</span>
                    )}
                  </TD>
                  <TD>
                    {r.projects.length === 0 ? (
                      <span className="text-[11px] text-muted-2">—</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-[4px]">
                        {r.projects.map((proj) => (
                          <span
                            key={proj}
                            className="inline-flex rounded-sm bg-stripe px-[6px] py-[1px] font-mono text-[10.5px] text-ink-3"
                          >
                            {proj}
                          </span>
                        ))}
                      </div>
                    )}
                  </TD>
                  <TD>
                    <Chip tone={STATUS_TONE[r.status]}>{r.status}</Chip>
                  </TD>
                  <TD className="text-[11px] text-muted">{r.lastLogin}</TD>
                  <TD className="font-mono text-[11px] text-muted">{r.joined}</TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          Utilization vs. cap
        </h3>
        <div className="grid grid-cols-2 gap-[10px]">
          {FA_DATA.utilization.map((u) => {
            const pct = u.cap === 0 ? 0 : Math.min(100, Math.round((u.proj / u.cap) * 100));
            const over = u.cap > 0 && u.proj > u.cap;
            return (
              <div
                key={u.who}
                className="flex items-center gap-[10px] border-b border-stripe py-[8px] last:border-b-0"
              >
                <Avatar person={u.who} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-[8px]">
                    <span className="text-[12px] font-medium text-ink">{u.name}</span>
                    <span className="text-[10.5px] text-muted">{u.role}</span>
                    <span
                      className={`ml-auto font-mono text-[11px] ${
                        over ? "text-red-text font-semibold" : "text-muted"
                      }`}
                    >
                      {u.proj}/{u.cap || "—"}
                    </span>
                  </div>
                  <div className="mt-[5px] h-[5px] w-full overflow-hidden rounded-pill bg-stripe">
                    <div
                      className={`h-full rounded-pill ${
                        u.cap === 0
                          ? "bg-stripe"
                          : over
                            ? "bg-red-dot"
                            : pct >= 90
                              ? "bg-yellow-dot"
                              : "bg-indigo"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
