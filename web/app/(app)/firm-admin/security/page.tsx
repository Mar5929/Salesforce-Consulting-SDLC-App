// Firm Admin › Security & data
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/firm-admin.jsx
// (lines 680-749) — firm-wide security posture, SSO, retention.

import { Card, Chip, Icon, Toggle } from "@/components/primitives";
import { SectionHead } from "../_components";

interface ControlRow {
  label: string;
  hint?: string;
  control: "chip" | "toggle";
  on?: boolean;
  chipTone?: "green" | "violet" | "amber";
  chipLabel?: string;
}

const POSTURE: ControlRow[] = [
  { label: "Data residency", control: "chip", chipTone: "violet", chipLabel: "us-east-1 · firm-locked" },
  { label: "Encryption at rest", control: "chip", chipTone: "green", chipLabel: "AES-256 · always on" },
  { label: "Encryption in transit", control: "chip", chipTone: "green", chipLabel: "TLS 1.3" },
  { label: "SOC 2 Type II", control: "chip", chipTone: "green", chipLabel: "current · audited Mar 2026" },
];

const TOGGLES: ControlRow[] = [
  {
    label: "PII scrubbing in prompts",
    hint: "Strips email, phone, SSN, credit-card before AI calls and logs (Guardrail #6).",
    control: "toggle",
    on: true,
  },
  {
    label: "Redact transcripts before model call",
    hint: "Apply firm redaction list before sending raw call audio to transcription.",
    control: "toggle",
    on: true,
  },
  {
    label: "Block production org auth from agents",
    hint: "Hard refusal at the skill level (Guardrail #1). Cannot be turned off.",
    control: "toggle",
    on: true,
  },
  {
    label: "Require re-auth for destructive ops",
    hint: "Step-up auth before any human-authored destructive changeset is run.",
    control: "toggle",
    on: true,
  },
];

const RETENTION = [
  { label: "Project metadata after archive", value: "90 days" },
  { label: "Discovery transcripts", value: "2 years" },
  { label: "Audit log", value: "7 years" },
  { label: "Generated documents", value: "Indefinite" },
];

export default function FirmAdminSecurityPage() {
  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHead
        title="Security & data handling"
        sub="Per §22. Firm-wide posture for every project. Per-project knobs live in each project's Settings → Security."
        actions={<Chip tone="violet">firm-managed</Chip>}
      />

      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          <Icon name="lock" size={12} />
          Posture
        </h3>
        <div>
          {POSTURE.map((row, i) => (
            <div
              key={i}
              className="flex items-start gap-[14px] border-b border-stripe py-[10px] last:border-b-0"
            >
              <div className="w-[260px] text-[12.5px] font-medium text-ink">{row.label}</div>
              <div>
                {row.chipTone && row.chipLabel && (
                  <Chip tone={row.chipTone}>{row.chipLabel}</Chip>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          <Icon name="shield" size={12} />
          Firm controls
        </h3>
        <div>
          {TOGGLES.map((row, i) => (
            <div
              key={i}
              className="flex items-start gap-[14px] border-b border-stripe py-[12px] last:border-b-0"
            >
              <div className="flex-1">
                <div className="text-[12.5px] font-medium text-ink">{row.label}</div>
                {row.hint && (
                  <div className="mt-[3px] text-[11px] leading-[1.5] text-muted">{row.hint}</div>
                )}
              </div>
              <Toggle on={row.on ?? false} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          <Icon name="clock" size={12} />
          Retention
        </h3>
        <div className="grid grid-cols-2 gap-[10px]">
          {RETENTION.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between rounded-card border border-stripe bg-canvas px-[12px] py-[10px]"
            >
              <span className="text-[12px] text-ink-2">{r.label}</span>
              <Chip tone="outline">{r.value}</Chip>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          <Icon name="users" size={12} />
          SSO &amp; identity
        </h3>
        <div className="grid grid-cols-2 gap-[10px]">
          <div className="rounded-card border border-stripe bg-canvas px-[12px] py-[10px]">
            <div className="flex items-center gap-[8px]">
              <span className="text-[12px] font-medium text-ink">Okta SSO</span>
              <Chip tone="amber">test only</Chip>
            </div>
            <div className="mt-[3px] text-[10.5px] text-muted">Domain: rihm.okta.com</div>
          </div>
          <div className="rounded-card border border-stripe bg-canvas px-[12px] py-[10px]">
            <div className="flex items-center gap-[8px]">
              <span className="text-[12px] font-medium text-ink">SCIM provisioning</span>
              <Chip tone="gray">not enabled</Chip>
            </div>
            <div className="mt-[3px] text-[10.5px] text-muted">Manual invite only in V1.</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
