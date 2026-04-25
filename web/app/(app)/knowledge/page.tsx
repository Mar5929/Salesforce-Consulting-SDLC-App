// Knowledge tab — KPIs (decisions, requirements, risks, action items),
// client context, recent decisions, risks, unmapped requirements.
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/tabs.jsx
// `Knowledge` component (lines 171-257).

import {
  Avatar,
  Button,
  Card,
  Chip,
  Icon,
  Table,
  TD,
  TH,
  TR,
  type ChipTone,
} from "@/components/primitives";
import { DATA } from "@/lib/data";
import type { RiskSeverity } from "@/lib/types";

interface UnmappedReq {
  id: string;
  t: string;
  pri: "High" | "Medium";
}

const UNMAPPED: UnmappedReq[] = [
  { id: "REQ-091", t: "Branded quote PDFs per customer", pri: "High" },
  { id: "REQ-092", t: "Volume-tier pricing on configurable bundles", pri: "High" },
  { id: "REQ-093", t: "Quote expiration + renewal reminder", pri: "Medium" },
  { id: "REQ-094", t: "Canada-specific tax handling", pri: "High" },
  { id: "REQ-095", t: "Quote approval matrix by deal size", pri: "Medium" },
];

function severityTone(sev: RiskSeverity): ChipTone {
  if (sev === "High") return "red";
  if (sev === "Medium") return "amber";
  return "gray";
}

function riskOwnerKey(owner: string): string {
  if (owner.includes("Priya")) return "priya";
  return "jamie";
}

function KnwStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="cursor-pointer rounded-card border border-border bg-surface px-[14px] py-[12px] hover:border-border-hover">
      <div className="mb-[8px] text-[10.5px] font-semibold uppercase tracking-[0.05em] text-muted">
        {label}
      </div>
      <div className="text-[22px] font-semibold">{value}</div>
      <div className="text-sm text-muted">{sub}</div>
    </div>
  );
}

function SecHead({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-[10px] flex items-center gap-[10px]">
      <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-3">
        {title}
      </h2>
      {actions && <div className="ml-auto flex gap-[6px]">{actions}</div>}
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <>
      {/* KPIs */}
      <div className="mb-[14px] grid grid-cols-4 gap-[12px]">
        <KnwStat label="Decisions" value="12" sub="+2 this week" />
        <KnwStat label="Requirements" value="54" sub="47 mapped · 7 unmapped" />
        <KnwStat label="Risks" value="3" sub="1 High · 2 Medium" />
        <KnwStat label="Action items" value="8" sub="3 overdue" />
      </div>

      {/* Row 1: client context + recent decisions */}
      <div className="grid grid-cols-2 gap-[12px]">
        <div>
          <SecHead
            title="Client context"
            actions={
              <>
                <Button
                  size="sm"
                  iconLeft={<Icon name="sparkle" size={11} />}
                >
                  Research &amp; propose
                </Button>
                <Button size="sm">Edit</Button>
              </>
            }
          />
          <Card className="text-[13px] leading-[1.65] text-ink-2">
            <div className="mb-[8px] font-semibold text-ink">
              Acme Manufacturing
            </div>
            <p className="m-0 mb-[8px]">
              B2B industrial parts distributor. ~$500M annual revenue. Operates
              across US and Canada with separate legal entities. 240 sales reps
              across 12 territories. Migrating from a homegrown Access-based CRM
              originally built in 2008.
            </p>
            <p className="m-0 mb-[8px]">
              <b>Primary stakeholders:</b> Amanda Ross (CFO), Tom Nguyen (VP
              Sales), Kelly Park (IT Director), Raj Patel (Sales Ops Lead).
            </p>
            <p className="m-0">
              <b>Engagement goals:</b> unified Lead→Cash flow, eliminate Access
              dependency, territory-based assignment, CPQ-backed quoting for
              configurable bundles.
            </p>
          </Card>
        </div>

        <div>
          <SecHead
            title="Recent decisions"
            actions={
              <Button size="sm" iconLeft={<Icon name="plus" size={11} />}>
                Record
              </Button>
            }
          />
          <Card className="!p-0">
            <Table>
              <tbody>
                {DATA.decisions.map((d) => (
                  <TR key={d.id}>
                    <TD style={{ width: 90 }}>
                      <Table.Mono>{d.id}</Table.Mono>
                    </TD>
                    <TD className="font-medium text-ink">{d.text}</TD>
                    <TD style={{ width: 100 }}>
                      <span className="inline-flex items-center gap-[4px]">
                        <Avatar person="sarah" size="xs" />
                        <span>Sarah</span>
                      </span>
                    </TD>
                    <TD className="font-mono text-sm" style={{ width: 90 }}>
                      {d.date.slice(5)}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Row 2: risks + unmapped requirements */}
      <div className="mt-[14px] grid grid-cols-2 gap-[12px]">
        <div>
          <SecHead
            title="Risks"
            actions={
              <Button size="sm" iconLeft={<Icon name="plus" size={11} />}>
                Create
              </Button>
            }
          />
          <Card className="!p-0">
            <Table>
              <thead>
                <tr>
                  <TH>ID</TH>
                  <TH>Risk</TH>
                  <TH>Severity</TH>
                  <TH>Owner</TH>
                  <TH>Status</TH>
                </tr>
              </thead>
              <tbody>
                {DATA.risks.map((r) => (
                  <TR key={r.id}>
                    <TD>
                      <Table.Mono>{r.id}</Table.Mono>
                    </TD>
                    <TD className="font-medium text-ink">{r.text}</TD>
                    <TD>
                      <Chip tone={severityTone(r.sev)}>{r.sev}</Chip>
                    </TD>
                    <TD>
                      <span className="inline-flex items-center gap-[4px]">
                        <Avatar person={riskOwnerKey(r.owner)} size="xs" />
                        <span className="text-sm">{r.owner.split(" ")[0]}</span>
                      </span>
                    </TD>
                    <TD>
                      <Chip tone="gray">{r.status}</Chip>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>

        <div>
          <SecHead
            title="Requirements · unmapped"
            actions={
              <span className="text-sm text-muted">7 of 54 unmapped</span>
            }
          />
          <Card className="!p-0">
            <Table>
              <tbody>
                {UNMAPPED.map((r) => (
                  <TR key={r.id}>
                    <TD>
                      <Table.Mono>{r.id}</Table.Mono>
                    </TD>
                    <TD className="font-medium text-ink">{r.t}</TD>
                    <TD>
                      <Chip tone={r.pri === "High" ? "red" : "amber"}>
                        {r.pri}
                      </Chip>
                    </TD>
                    <TD>
                      <Chip tone="gray">unmapped</Chip>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      </div>
    </>
  );
}
