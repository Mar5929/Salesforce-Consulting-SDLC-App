// Settings › AI behavior
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// `AISettings` component (lines 378-416).

"use client";

import { useState } from "react";

import { Card, Toggle } from "@/components/primitives";
import { Field, RangeMock, SectionHead, SelectMock, TextMock } from "../_components";

export default function AISettingsPage() {
  const [autoFile, setAutoFile] = useState(true);
  const [autoEnrich, setAutoEnrich] = useState(true);
  const [proactive, setProactive] = useState(true);

  return (
    <div>
      <SectionHead
        title="AI behavior"
        sub="How the project brain interacts with this project. Defaults are firm-recommended; per-project overrides are saved here."
      />
      <Card className="!p-[4px_18px]">
        <Field
          label="Default model"
          hint="Pinned to Claude per §3.3. Haiku for fast loops; Sonnet for synthesis & generation."
        >
          <SelectMock
            value="claude-haiku-4.5 (default) · claude-sonnet-4.5 (synthesis)"
            options={[
              "claude-haiku-4.5 (default) · claude-sonnet-4.5 (synthesis)",
              "claude-haiku-4.5 only",
              "claude-sonnet-4.5 only",
            ]}
            wide
          />
        </Field>
        <Field
          label="Auto-file new questions"
          hint="When a discovery transcript surfaces a question, scope and file it without confirmation."
        >
          <Toggle on={autoFile} onChange={setAutoFile} />
        </Field>
        <Field
          label="Auto-enrich stories"
          hint="Suggest acceptance criteria, impacted components, test stubs on save."
        >
          <Toggle on={autoEnrich} onChange={setAutoEnrich} />
        </Field>
        <Field
          label="Proactive surfacing"
          hint="Bubble blockers, stale Qs, missing info into Home and dashboards."
        >
          <Toggle on={proactive} onChange={setProactive} />
        </Field>
        <Field
          label="Confidence threshold"
          hint="AI suggestions below this confidence require explicit human approval before applying."
        >
          <div className="flex items-center gap-[12px]">
            <RangeMock min={0} max={100} defaultValue={65} width={220} />
            <span className="font-mono text-[12px] font-semibold text-indigo">0.65</span>
          </div>
        </Field>
        <Field label="Tone for client deliverables">
          <SelectMock
            value="Professional · concise"
            options={[
              "Professional · concise",
              "Professional · detailed",
              "Conversational",
              "Formal",
            ]}
          />
        </Field>
      </Card>

      <div className="mt-[18px]" />
      <SectionHead
        title="Context budget"
        sub="Hard caps to prevent runaway calls. Hits are logged in Settings → Costs."
      />
      <Card className="!p-[4px_18px]">
        <Field label="Max context per call" half>
          <span className="font-mono text-[12px]">128K tokens</span>
        </Field>
        <Field label="Max output tokens" half>
          <span className="font-mono text-[12px]">8K</span>
        </Field>
        <Field label="Max background jobs / minute" half>
          <span className="font-mono text-[12px]">12</span>
        </Field>
        <Field label="Soft monthly cap" half>
          <div className="flex items-center gap-[10px]">
            <TextMock value="$40" />
            <span className="text-[11px] text-muted">notify owner at 80%, hard-stop at 100%</span>
          </div>
        </Field>
      </Card>
    </div>
  );
}
