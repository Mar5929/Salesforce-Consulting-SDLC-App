// Settings › SF dev guardrails
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// `GuardrailsSettings` component (lines 499-534).

import { Card, Chip, Icon } from "@/components/primitives";
import { SectionHead } from "../_components";

interface Guardrail {
  n: number;
  t: string;
  d: string;
}

const GUARDRAILS: Guardrail[] = [
  {
    n: 1,
    t: "No production deploys from agent",
    d: "Claude Code skills refuse to authenticate against any production org. Hard-coded refusal at the skill level — no override.",
  },
  {
    n: 2,
    t: "No destructive metadata operations",
    d: "Skill blocks deleteMetadata, deleteRecord, and bulk truncates. Removals must go through a human-authored destructive changeset.",
  },
  {
    n: 3,
    t: "Test class with every Apex change",
    d: "Skill rejects PRs that touch Apex without a corresponding test class meeting the firm coverage threshold.",
  },
  {
    n: 4,
    t: "Validate against shared sandbox before PR",
    d: "Skill runs `sf project deploy validate -o shared-sandbox` before opening a PR. Validation must pass.",
  },
  {
    n: 5,
    t: "Naming conventions enforced",
    d: "New components must match the firm naming convention regex set below. Prefixes are non-optional.",
  },
  {
    n: 6,
    t: "No PII in prompts or logs",
    d: "Skill scrubs known PII patterns (email, phone, SSN, credit card) before sending to the model and before logging.",
  },
];

export default function GuardrailsSettingsPage() {
  return (
    <div>
      <SectionHead
        title="Salesforce dev guardrails"
        sub="The six hard-locked rules from §15. Enforced inside Claude Code skills; reflected here for visibility — they cannot be overridden from the web app."
        actions={<Chip tone="violet">firm-managed</Chip>}
      />
      <Card className="!p-[4px]">
        {GUARDRAILS.map((g, i) => (
          <div
            key={g.n}
            className={`grid grid-cols-[36px_1fr_auto] items-start gap-[14px] px-[14px] py-[14px] ${
              i < GUARDRAILS.length - 1 ? "border-b border-stripe" : ""
            }`}
          >
            <div className="grid h-[28px] w-[28px] place-items-center rounded-lg bg-rail text-[13px] font-bold text-white">
              {g.n}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-ink">{g.t}</div>
              <div className="mt-[4px] text-[11.5px] leading-[1.5] text-muted">{g.d}</div>
            </div>
            <div className="flex items-center gap-[8px]">
              <Chip tone="green">enforced</Chip>
              <Icon name="shield" size={12} color="#94A3B8" />
            </div>
          </div>
        ))}
      </Card>
      <div className="mt-[12px] flex items-center gap-[6px] rounded-lg border border-amber-border bg-amber-grad-1 px-[14px] py-[10px] text-[11.5px] text-yellow-text">
        <Icon name="warn" size={12} />
        <span>
          Changes here update the firm-wide guardrail registry and propagate to every project on
          next skill invocation. Audit log:{" "}
          <span className="cursor-pointer text-indigo">view 7 changes</span>.
        </span>
      </div>
    </div>
  );
}
