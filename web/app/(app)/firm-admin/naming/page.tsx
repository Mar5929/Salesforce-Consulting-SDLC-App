// Firm Admin › Naming registry
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/firm-admin.jsx
// (lines 512-568) — pattern table + per-project overrides counter.

import { Card, Chip, Icon, Table, TD, TH, TR } from "@/components/primitives";
import { FA_DATA } from "@/lib/firmAdminData";
import { SectionHead } from "../_components";

export default function FirmAdminNamingPage() {
  const totalOverrides = FA_DATA.naming.reduce((sum, n) => sum + n.over, 0);

  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHead
        title="Naming registry"
        sub="Firm-wide naming patterns. Per-project overrides require Firm Admin approval (Guardrail #5)."
        actions={
          <>
            <Chip tone="violet">firm-managed</Chip>
            <Chip tone="amber">{totalOverrides} active overrides</Chip>
          </>
        }
      />

      <Card className="!p-0">
        <Table>
          <thead>
            <tr>
              <TH className="w-[200px]">Component</TH>
              <TH>Pattern</TH>
              <TH>Example</TH>
              <TH className="w-[140px]">Overrides</TH>
            </tr>
          </thead>
          <tbody>
            {FA_DATA.naming.map((n, i) => (
              <TR key={i}>
                <TD className="text-[12px] font-medium text-ink">{n.c}</TD>
                <TD>
                  <code className="rounded-sm bg-stripe px-[6px] py-[2px] font-mono text-[11px] text-ink-2">
                    {n.p}
                  </code>
                </TD>
                <TD className="font-mono text-[11px] text-muted">{n.e}</TD>
                <TD>
                  {n.over === 0 ? (
                    <span className="text-[11px] text-muted-2">none</span>
                  ) : (
                    <Chip tone="amber">
                      {n.over} project{n.over === 1 ? "" : "s"}
                    </Chip>
                  )}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="flex items-center gap-[6px] rounded-lg border border-amber-border bg-amber-grad-1 px-[14px] py-[10px] text-[11.5px] text-yellow-text">
        <Icon name="info" size={12} />
        <span>
          Override requests are submitted from a project&apos;s Settings → Naming page and routed to
          the Firm Administrator for approval.
        </span>
      </div>
    </div>
  );
}
