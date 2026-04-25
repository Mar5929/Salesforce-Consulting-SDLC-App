// Firm Admin › Costs & licensing
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/firm-admin.jsx
// (lines 752-824) — firm spend roll-up + Inngest headroom + per-project cap table.

import { Card, Chip, Icon, KpiCard, Table, TD, TH, TR } from "@/components/primitives";
import { FA_DATA } from "@/lib/firmAdminData";
import { SectionHead } from "../_components";

export default function FirmAdminBillingPage() {
  const active = FA_DATA.projects.filter((p) => p.state === "active");
  const firmMtd = active.reduce((sum, p) => sum + p.mtd, 0);
  const firmCap = active.reduce((sum, p) => sum + p.cap, 0);
  const overCap = active.filter((p) => p.mtd > p.cap);

  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHead
        title="Costs &amp; consultant licensing"
        sub="Per §23. Firm-wide spend, per-project caps, Inngest free-tier headroom, and seat ledger."
      />

      <div className="grid grid-cols-4 gap-[12px]">
        <KpiCard
          label="Firm · MTD spend"
          value={`$${firmMtd.toFixed(2)}`}
          sub={
            <span>
              of ${firmCap.toFixed(0)} aggregate cap ·{" "}
              {firmCap === 0 ? 0 : Math.round((firmMtd / firmCap) * 100)}%
            </span>
          }
        />
        <KpiCard
          label="Projects over cap"
          value={overCap.length}
          sub={overCap.length > 0 ? overCap.map((p) => p.client).join(", ") : "all within cap"}
        />
        <KpiCard
          label="Inngest events · MTM"
          value={
            <>
              4,820
              <span className="ml-[4px] text-[13px] text-muted-2">/5,000</span>
            </>
          }
          sub={<span className="text-yellow-text-2">96% · throttle armed</span>}
        />
        <KpiCard label="Web seats / CC seats" value="6 / 3" sub="firm plan: 30 / 15" />
      </div>

      <Card className="!p-0">
        <div className="flex items-center justify-between border-b border-stripe px-[14px] py-[10px]">
          <div className="flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            <Icon name="dollar" size={12} />
            Per-project caps &amp; spend
          </div>
          <span className="text-[10.5px] text-muted">soft cap notifies owner at 80% · hard-stop at 100%</span>
        </div>
        <Table>
          <thead>
            <tr>
              <TH>Project</TH>
              <TH className="w-[100px]">Owner</TH>
              <TH className="w-[120px]">Cap</TH>
              <TH className="w-[120px]">MTD</TH>
              <TH>Usage</TH>
              <TH className="w-[110px]">Status</TH>
            </tr>
          </thead>
          <tbody>
            {active.map((p) => {
              const pct = p.cap === 0 ? 0 : Math.min(100, Math.round((p.mtd / p.cap) * 100));
              const over = p.mtd > p.cap;
              const warn = pct >= 80 && !over;
              return (
                <TR key={p.id}>
                  <TD className="text-[12px] font-medium text-ink">{p.client}</TD>
                  <TD className="text-[11.5px] text-ink-2">{p.owner}</TD>
                  <TD className="font-mono text-[11.5px] text-ink">${p.cap}</TD>
                  <TD>
                    <span
                      className={`font-mono text-[11.5px] ${
                        over ? "font-semibold text-red-text" : "text-ink"
                      }`}
                    >
                      ${p.mtd.toFixed(2)}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-[8px]">
                      <div className="h-[5px] w-[120px] overflow-hidden rounded-pill bg-stripe">
                        <div
                          className={`h-full rounded-pill ${
                            over ? "bg-red-dot" : warn ? "bg-yellow-dot" : "bg-indigo"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10.5px] text-muted">{pct}%</span>
                    </div>
                  </TD>
                  <TD>
                    {over ? (
                      <Chip tone="red">over cap</Chip>
                    ) : warn ? (
                      <Chip tone="amber">approaching</Chip>
                    ) : (
                      <Chip tone="green">healthy</Chip>
                    )}
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          <Icon name="bolt" size={12} />
          Inngest free-tier guard
        </h3>
        <div className="flex items-center gap-[14px]">
          <div className="flex-1">
            <div className="h-[10px] w-full overflow-hidden rounded-pill bg-stripe">
              <div
                className="h-full rounded-pill bg-yellow-dot"
                style={{ width: "96%" }}
              />
            </div>
            <div className="mt-[6px] flex items-center justify-between text-[10.5px] text-muted">
              <span>0</span>
              <span className="font-mono">4,820 / 5,000 events</span>
              <span>5,000</span>
            </div>
          </div>
          <Chip tone="amber">throttle at 90% · armed</Chip>
        </div>
        <div className="mt-[10px] text-[11px] text-muted">
          Background jobs queue when monthly events exceed the threshold. Resets on the 1st of each month.
        </div>
      </Card>

      <div className="flex items-center gap-[6px] rounded-lg border border-amber-border bg-amber-grad-1 px-[14px] py-[10px] text-[11.5px] text-yellow-text">
        <Icon name="info" size={12} />
        <span>
          Anthropic API spend is metered on a delayed cycle — figures here may lag actual spend by up to 30 minutes.
        </span>
      </div>
    </div>
  );
}
