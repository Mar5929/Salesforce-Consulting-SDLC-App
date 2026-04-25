// Settings › Costs & licensing
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// `BillingSettings` component (lines 702-761).

import {
  Avatar,
  Button,
  Card,
  Chip,
  KpiCard,
  Table,
  TD,
  TH,
  TR,
} from "@/components/primitives";
import { DATA } from "@/lib/data";
import { Field, RangeMock, SectionHead, SelectMock, TextMock } from "../_components";

interface SeatRow {
  who: string;
  seat: string;
  proj: string;
  st: "active" | "firm admin";
}

const SEATS: SeatRow[] = [
  { who: "sarah", seat: "Architect", proj: "4", st: "active" },
  { who: "jamie", seat: "PM", proj: "3", st: "active" },
  { who: "priya", seat: "BA", proj: "2", st: "active" },
  { who: "david", seat: "Dev", proj: "2", st: "active" },
  { who: "marcus", seat: "QA", proj: "5", st: "active" },
  { who: "michael", seat: "Admin", proj: "—", st: "firm admin" },
];

export default function BillingSettingsPage() {
  return (
    <div>
      <SectionHead
        title="Costs & consultant licensing"
        sub="Per §23. Per-project caps, firm seat ledger, and Inngest free-tier headroom."
      />

      <div className="mb-[14px] grid grid-cols-3 gap-[12px]">
        <KpiCard
          label="This project · MTD"
          value="$10.81"
          sub={
            <>
              <div>of $40 cap · 27%</div>
              <div className="mt-[6px] h-[6px] rounded-pill bg-stripe">
                <div
                  className="h-full rounded-pill bg-indigo"
                  style={{ width: "27%" }}
                />
              </div>
            </>
          }
        />
        <KpiCard label="Firm · MTD" value="$184.40" sub="across 6 active projects" />
        <KpiCard
          label="Active seats"
          value={
            <>
              23<span className="ml-[4px] text-[13px] text-muted-2">/30</span>
            </>
          }
          sub="7 seats remaining"
        />
      </div>

      <Card className="mb-[14px] !p-[4px_18px]">
        <Field
          label="Per-project soft cap"
          hint="Owner is notified at 80%; AI calls hard-stop at 100% until reset."
        >
          <div className="flex items-center gap-[10px]">
            <TextMock value="$40 / month" />
            <Button size="sm">Request increase</Button>
          </div>
        </Field>
        <Field label="Default model strategy">
          <SelectMock
            value="Haiku-first · escalate to Sonnet for synthesis"
            options={[
              "Haiku-first · escalate to Sonnet for synthesis",
              "Sonnet always",
              "Haiku only (cost-saver)",
            ]}
          />
        </Field>
        <Field
          label="Inngest free-tier guard"
          hint="Throttle background jobs when monthly events exceed threshold."
        >
          <div className="flex items-center gap-[10px]">
            <RangeMock min={50} max={100} defaultValue={90} width={200} />
            <span className="font-mono text-[12px] font-semibold text-yellow-dot-2">90%</span>
            <span className="text-[11px] text-muted">currently 4,820 / 5,000 events</span>
          </div>
        </Field>
      </Card>

      <SectionHead
        title="Seat ledger"
        sub="Firm-wide consultant seats. Seat = web-app login. Claude Code is licensed separately."
      />
      <Card className="!p-0">
        <Table>
          <thead>
            <tr>
              <TH>Member</TH>
              <TH className="w-[160px]">Role</TH>
              <TH className="w-[120px]">Seat type</TH>
              <TH className="w-[120px]">Active projects</TH>
              <TH className="w-[100px]">Status</TH>
            </tr>
          </thead>
          <tbody>
            {SEATS.map((r) => {
              const p = DATA.team.find((x) => x.id === r.who);
              return (
                <TR key={r.who}>
                  <TD>
                    <div className="flex items-center gap-[8px]">
                      <Avatar person={r.who} size="xs" />
                      {p?.name}
                    </div>
                  </TD>
                  <TD className="text-sm text-muted">{p?.role}</TD>
                  <TD>{r.seat}</TD>
                  <TD className="font-mono text-sm">{r.proj}</TD>
                  <TD>
                    <Chip tone={r.st === "firm admin" ? "violet" : "green"}>{r.st}</Chip>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
