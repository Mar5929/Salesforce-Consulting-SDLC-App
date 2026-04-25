// Settings › Salesforce orgs
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// `SalesforceSettings` component (lines 245-310).

import { Button, Card, Chip, Icon, Toggle } from "@/components/primitives";
import { Field, SectionHead, SelectMock } from "../_components";

interface ReadOption {
  name: string;
  on: boolean;
  lock?: boolean;
}

const READ_OPTIONS: ReadOption[] = [
  { name: "Object & field metadata", on: true },
  { name: "Apex classes & triggers", on: true },
  { name: "Lightning components", on: true },
  { name: "Validation & flow rules", on: true },
  { name: "Permission sets & profiles", on: true },
  { name: "Knowledge articles", on: true },
  { name: "Record data", on: false, lock: true },
];

interface SyncStat {
  label: string;
  value: string;
}

const SYNC_STATS: SyncStat[] = [
  { label: "Last sync", value: "4 hr ago" },
  { label: "Components", value: "1,847" },
  { label: "Custom objects", value: "62" },
  { label: "Knowledge articles", value: "148" },
];

export default function SalesforceSettingsPage() {
  return (
    <div>
      <SectionHead
        title="Salesforce orgs"
        sub="Per §13–14: one shared team sandbox is the source of truth for org knowledge. Read-only credentials only; the app never deploys."
        actions={
          <Button
            size="sm"
            variant="primary"
            iconLeft={<Icon name="plus" size={11} color="#ffffff" />}
          >
            Connect org
          </Button>
        }
      />

      <Card className="mb-[14px] !p-[16px]">
        <div className="flex items-center gap-[14px]">
          <div
            className="grid h-[44px] w-[44px] place-items-center rounded-card text-[16px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #00A1E0, #0070D2)" }}
          >
            SF
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-ink">Acme · shared sandbox</div>
            <div className="mt-[2px] font-mono text-[11.5px] text-muted">
              acme--shared.sandbox.my.salesforce.com · API v60.0
            </div>
          </div>
          <Chip tone="green">connected</Chip>
        </div>

        <div className="mt-[14px] grid grid-cols-4 gap-[10px] border-t border-stripe pt-[14px]">
          {SYNC_STATS.map((s) => (
            <div key={s.label}>
              <div className="text-[10.5px] uppercase tracking-[0.05em] text-muted">{s.label}</div>
              <div className="mt-[2px] text-[13px] font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-[4px_18px]">
        <Field
          label="Connection method"
          hint="OAuth refresh-token flow. Per §22 the secret never leaves the server."
        >
          <div className="flex items-center gap-[8px]">
            <Chip tone="green">OAuth · Connected App</Chip>
            <Button size="sm">Reauthorize</Button>
          </div>
        </Field>
        <Field label="Sync schedule">
          <SelectMock
            value="Every 4 hours"
            options={["Every hour", "Every 4 hours", "Every 12 hours", "Daily", "Manual only"]}
          />
        </Field>
        <Field
          label="What we read"
          hint="Only metadata enters our database. No record data is ever pulled."
        >
          <div className="flex flex-col gap-[6px]">
            {READ_OPTIONS.map((r) => (
              <div key={r.name} className="flex items-center gap-[10px] py-[4px]">
                <Toggle on={r.on} />
                <span className="text-[12px] text-ink">{r.name}</span>
                {r.lock && <Chip tone="gray">policy-locked</Chip>}
              </div>
            ))}
          </div>
        </Field>
        <Field
          label="Sandbox strategy"
          hint="V1 default per §14.1: shared team sandbox + per-developer scratch orgs."
        >
          <SelectMock
            value="Shared team sandbox + scratch orgs"
            options={[
              "Shared team sandbox + scratch orgs",
              "Per-developer dev sandboxes",
              "Custom",
            ]}
          />
        </Field>
      </Card>

      <div className="mt-[14px] flex items-center gap-[6px] rounded-lg border border-blue-text/20 bg-blue-bg/40 px-[14px] py-[12px] text-[12px] text-blue-text">
        <Icon name="warn" size={12} />
        <span>
          <b>Read-only.</b> The web application has no deployment scope. Code travels developer →
          scratch org → shared sandbox via your Git/CI pipeline; this app only observes the result.
        </span>
      </div>
    </div>
  );
}
