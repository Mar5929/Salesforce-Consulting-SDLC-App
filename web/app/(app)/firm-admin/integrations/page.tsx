// Firm Admin › Integrations
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/firm-admin.jsx
// (lines 827-859) — firm-managed integrations with status + key metadata.

import { Button, Chip, Icon } from "@/components/primitives";
import { FA_DATA, type FirmIntegration } from "@/lib/firmAdminData";
import { SectionHead } from "../_components";

const STATUS_TONE: Record<FirmIntegration["status"], "green" | "amber" | "gray"> = {
  connected: "green",
  pending: "amber",
  disconnected: "gray",
};

const STATUS_LABEL: Record<FirmIntegration["status"], string> = {
  connected: "connected",
  pending: "pending",
  disconnected: "disconnected",
};

export default function FirmAdminIntegrationsPage() {
  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHead
        title="Integrations"
        sub="Firm-managed connections. Project-level integrations (e.g. project Slack channels, Jira projects) are configured per project."
        actions={<Chip tone="violet">firm-managed</Chip>}
      />

      <div className="grid grid-cols-2 gap-[12px]">
        {FA_DATA.integrations.map((i) => (
          <div
            key={i.id}
            className="flex flex-col gap-[10px] rounded-card border border-border bg-surface p-[14px]"
          >
            <div className="flex items-start gap-[12px]">
              <span
                className="grid h-[36px] w-[36px] shrink-0 place-items-center rounded-md text-[13px] font-bold text-white"
                style={{ background: i.bg }}
              >
                {i.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-[8px]">
                  <span className="text-[13px] font-semibold text-ink">{i.name}</span>
                  <Chip tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status]}</Chip>
                </div>
                <div className="mt-[3px] text-[11px] leading-[1.45] text-muted">{i.role}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[8px] border-t border-stripe pt-[10px] text-[11px]">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.05em] text-muted-2">{i.k1}</div>
                <div className="mt-[2px] font-mono text-[11.5px] text-ink-2">{i.v1}</div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.05em] text-muted-2">{i.k2}</div>
                <div className="mt-[2px] font-mono text-[11.5px] text-ink-2">{i.v2}</div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-[6px] pt-[2px]">
              <Button size="sm" variant="ghost" iconLeft={<Icon name="sync" size={11} />}>
                Re-sync
              </Button>
              <Button size="sm" variant="default">
                Configure
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
