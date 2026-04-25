// Settings › Security & data
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// `SecuritySettings` component (lines 656-699).

import {
  Avatar,
  Card,
  Chip,
  Icon,
  Table,
  TD,
  TH,
  TR,
  Toggle,
} from "@/components/primitives";
import { Field, SectionHead, SelectMock } from "../_components";

interface AuditRow {
  when: string;
  actor: string;
  action: string;
  detail: string;
}

const AUDIT_LOG: AuditRow[] = [
  { when: "Apr 16 14:32", actor: "sarah", action: "roadmap.bump", detail: "CPQ re-proposal accepted → roadmap v3" },
  { when: "Apr 16 09:11", actor: "system", action: "health.flip", detail: "Yellow signal: Q-LM-LC-003 past follow-up threshold" },
  { when: "Apr 15 16:48", actor: "priya", action: "transcript.upload", detail: "Acme · Discovery session 7 (28 min)" },
  { when: "Apr 15 11:20", actor: "sarah", action: "guardrails.audit_view", detail: "Viewed firm guardrail registry" },
  { when: "Apr 14 17:02", actor: "jamie", action: "export.docx", detail: "Status report · Sprint 3 week 1" },
  { when: "Apr 14 09:00", actor: "system", action: "sf.sync", detail: "Pulled 1,847 metadata components (Δ 23)" },
];

export default function SecuritySettingsPage() {
  return (
    <div>
      <SectionHead
        title="Security & data handling"
        sub="Per §22. Most controls are firm-locked; per-project knobs appear below where allowed."
      />

      <Card className="mb-[14px] !p-[4px_18px]">
        <Field label="Data residency">
          <Chip tone="violet">us-east-1 · firm-locked</Chip>
        </Field>
        <Field label="Encryption at rest">
          <Chip tone="green">AES-256 · always on</Chip>
        </Field>
        <Field label="Encryption in transit">
          <Chip tone="green">TLS 1.3</Chip>
        </Field>
        <Field
          label="PII scrubbing in prompts"
          hint="Strips email, phone, SSN, credit-card patterns before AI calls and logs."
        >
          <Toggle on={true} />
        </Field>
        <Field
          label="Org metadata retention"
          hint="How long parsed metadata is kept after the project archives."
        >
          <SelectMock value="90 days" options={["30 days", "90 days", "1 year", "Indefinite"]} />
        </Field>
        <Field label="Transcript retention">
          <SelectMock value="2 years" options={["90 days", "1 year", "2 years", "7 years"]} />
        </Field>
        <Field label="Redact transcripts before model call">
          <Toggle on={true} />
        </Field>
      </Card>

      <SectionHead
        title="Audit log"
        sub="All settings changes, access grants, AI write-actions, and exports are recorded."
      />
      <Card className="!p-0">
        <Table>
          <thead>
            <tr>
              <TH className="w-[130px]">When</TH>
              <TH className="w-[140px]">Actor</TH>
              <TH className="w-[160px]">Action</TH>
              <TH>Detail</TH>
            </tr>
          </thead>
          <tbody>
            {AUDIT_LOG.map((r, i) => (
              <TR key={i}>
                <TD className="font-mono text-sm">{r.when}</TD>
                <TD>
                  <div className="flex items-center gap-[6px]">
                    {r.actor === "system" ? (
                      <Icon name="zap" size={11} color="#94A3B8" />
                    ) : (
                      <Avatar person={r.actor} size="xs" />
                    )}
                    <span className="text-sm">{r.actor}</span>
                  </div>
                </TD>
                <TD className="font-mono text-sm">{r.action}</TD>
                <TD className="text-sm">{r.detail}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
