// Firm Admin › Audit log
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/firm-admin.jsx
// (lines 862-934) — firm-wide event ledger.

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
} from "@/components/primitives";
import { FA_DATA, type FirmAuditEvent } from "@/lib/firmAdminData";
import { SectionHead } from "../_components";

const KIND_TONE: Record<
  FirmAuditEvent["kind"],
  "indigo" | "green" | "amber" | "violet" | "blue" | "pink"
> = {
  policy: "indigo",
  access: "green",
  export: "blue",
  guardrail: "amber",
  ai: "violet",
  integration: "pink",
};

export default function FirmAdminAuditPage() {
  // Group counts for the chip strip
  const counts = FA_DATA.audit.reduce<Record<FirmAuditEvent["kind"], number>>(
    (acc, e) => {
      acc[e.kind] = (acc[e.kind] ?? 0) + 1;
      return acc;
    },
    { policy: 0, access: 0, export: 0, guardrail: 0, ai: 0, integration: 0 },
  );

  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHead
        title="Audit log"
        sub="Every policy change, access grant, AI write-action, export, and integration event. Retained 7 years."
        actions={
          <Button size="sm" variant="default" iconLeft={<Icon name="download" size={11} />}>
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-[6px]">
        {(Object.keys(counts) as FirmAuditEvent["kind"][]).map((k) => (
          <Chip key={k} tone={KIND_TONE[k]}>
            {k} · {counts[k]}
          </Chip>
        ))}
        <span className="ml-auto text-[10.5px] text-muted">
          showing {FA_DATA.audit.length} events · last 4 days
        </span>
      </div>

      <Card className="!p-0">
        <Table>
          <thead>
            <tr>
              <TH className="w-[140px]">When</TH>
              <TH className="w-[120px]">Who</TH>
              <TH className="w-[110px]">Kind</TH>
              <TH className="w-[180px]">Action</TH>
              <TH>Detail</TH>
              <TH className="w-[110px]">Project</TH>
            </tr>
          </thead>
          <tbody>
            {FA_DATA.audit.map((e, i) => (
              <TR key={i}>
                <TD className="font-mono text-[11px] text-muted">{e.when}</TD>
                <TD>
                  <div className="flex items-center gap-[6px]">
                    {e.who === "system" ? (
                      <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-stripe">
                        <Icon name="zap" size={10} color="#94A3B8" />
                      </span>
                    ) : (
                      <Avatar person={e.who} size="xs" />
                    )}
                    <span className="text-[11.5px] text-ink-2">{e.who}</span>
                  </div>
                </TD>
                <TD>
                  <Chip tone={KIND_TONE[e.kind]}>{e.kind}</Chip>
                </TD>
                <TD className="font-mono text-[11px] text-ink-2">{e.action}</TD>
                <TD className="text-[11.5px] text-ink-2">{e.detail}</TD>
                <TD className="text-[11px] text-muted">{e.project}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
