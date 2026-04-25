// Firm Admin › Guardrails
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/firm-admin.jsx
// (lines 444-509) — six firm-wide guardrails + recent fires.

import { Card, Chip, Icon, Table, TD, TH, TR } from "@/components/primitives";
import { FA_DATA } from "@/lib/firmAdminData";
import { SectionHead } from "../_components";

export default function FirmAdminGuardrailsPage() {
  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHead
        title="Salesforce dev guardrails"
        sub="The six hard-locked rules from §15. Enforced inside Claude Code skills; this is the firm-wide registry."
        actions={<Chip tone="violet">firm-managed</Chip>}
      />

      <Card className="!p-[4px]">
        {FA_DATA.guardrails.map((g, i) => (
          <div
            key={g.n}
            className={`grid grid-cols-[36px_1fr_180px] items-start gap-[14px] px-[14px] py-[14px] ${
              i < FA_DATA.guardrails.length - 1 ? "border-b border-stripe" : ""
            }`}
          >
            <div className="grid h-[28px] w-[28px] place-items-center rounded-lg bg-rail text-[13px] font-bold text-white">
              {g.n}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-[8px]">
                <div className="text-[13px] font-semibold text-ink">{g.t}</div>
                {g.refs.map((ref) => (
                  <Chip key={ref} tone="outline">
                    {ref}
                  </Chip>
                ))}
              </div>
              <div className="mt-[4px] text-[11.5px] leading-[1.5] text-muted">{g.d}</div>
              <div className="mt-[6px] flex items-center gap-[12px] text-[10.5px] text-muted-2">
                <span className="inline-flex items-center gap-[4px]">
                  <Icon name="bolt" size={10} />
                  <span className="font-mono">{g.skill}</span>
                </span>
                <span>edited {g.edited}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-[6px] text-right">
              <Chip tone="green">enforced</Chip>
              <div className="text-[10.5px] text-muted">
                fired <span className="font-semibold text-ink-2">{g.triggered}×</span>
              </div>
              <div className="text-[10.5px] text-muted">last: {g.lastFire}</div>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          Recent guardrail fires
        </h3>
        <Table>
          <thead>
            <tr>
              <TH className="w-[140px]">When</TH>
              <TH className="w-[60px]">Rule</TH>
              <TH>What happened</TH>
              <TH className="w-[120px]">Project</TH>
              <TH className="w-[100px]">Who</TH>
            </tr>
          </thead>
          <tbody>
            {FA_DATA.guardrailFires.map((f, i) => (
              <TR key={i}>
                <TD className="text-[11px] text-muted">{f.when}</TD>
                <TD>
                  <span className="grid h-[20px] w-[20px] place-items-center rounded-md bg-rail text-[10px] font-bold text-white">
                    {f.rule}
                  </span>
                </TD>
                <TD className="text-[11.5px] text-ink-2">{f.what}</TD>
                <TD className="text-[11.5px] text-ink-2">{f.project}</TD>
                <TD className="text-[11px] text-muted">{f.who}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="flex items-center gap-[6px] rounded-lg border border-amber-border bg-amber-grad-1 px-[14px] py-[10px] text-[11.5px] text-yellow-text">
        <Icon name="warn" size={12} />
        <span>
          Changes propagate to every project on next skill invocation. View the full audit log on the Audit page.
        </span>
      </div>
    </div>
  );
}
