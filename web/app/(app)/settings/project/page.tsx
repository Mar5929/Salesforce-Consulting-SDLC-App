// Settings › Project info
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// `ProjectSettings` component (lines 126-161).

import { Button, Card, Chip } from "@/components/primitives";
import { Field, SectionHead, SelectMock, TextMock } from "../_components";

const STAGES = [
  "Initialization",
  "Discovery",
  "Roadmap",
  "Build",
  "Testing",
  "Deployment",
  "Hypercare",
  "Archive",
];

export default function ProjectInfoPage() {
  return (
    <div>
      <SectionHead
        title="Project info"
        sub="Basic identity & lifecycle metadata. Some fields archive into the read-only project record per §21."
        actions={
          <>
            <Button size="sm">Cancel</Button>
            <Button size="sm" variant="primary">
              Save
            </Button>
          </>
        }
      />
      <Card className="!p-[4px_18px]">
        <Field label="Project name">
          <TextMock value="Acme Manufacturing" />
        </Field>
        <Field label="Client" hint="Used in branded deliverables and the project breadcrumb.">
          <TextMock value="Acme Manufacturing Inc." />
        </Field>
        <Field label="Engagement type">
          <SelectMock
            value="Greenfield"
            options={["Greenfield", "Migration", "Optimization", "Managed services"]}
          />
        </Field>
        <Field
          label="Salesforce cloud"
          hint="Drives template suggestions and discovery question presets."
        >
          <SelectMock
            value="Sales Cloud"
            options={[
              "Sales Cloud",
              "Service Cloud",
              "Sales + Service",
              "Experience Cloud",
              "CPQ",
              "Custom",
            ]}
          />
        </Field>
        <Field label="Started" hint="Locked once first sprint opens.">
          <TextMock value="2026-03-18" mono />
        </Field>
        <Field label="Target completion">
          <TextMock value="2026-07-03" mono />
        </Field>
        <Field
          label="Roadmap version"
          hint="Bumped automatically when an accepted re-proposal moves epics."
        >
          <span className="inline-flex items-center gap-[8px]">
            <Chip tone="violet">v3</Chip>
            <span className="text-[11px] text-muted">
              last bump · Apr 16 · CPQ re-proposal accepted
            </span>
          </span>
        </Field>
        <Field
          label="Lifecycle stage"
          hint="Build → Testing requires QA sign-off on the active sprint."
        >
          <div className="flex flex-wrap gap-[6px]">
            {STAGES.map((s) => (
              <Chip key={s} tone={s === "Build" ? "violet" : "gray"}>
                {s === "Build" ? `● ${s}` : s}
              </Chip>
            ))}
          </div>
        </Field>
      </Card>

      <div className="mt-[24px]" />
      <SectionHead
        title="Danger zone"
        sub="Irreversible operations. Archive freezes all data and disables AI; restore is not in V1."
      />
      <div className="flex items-center gap-[12px] rounded-card border border-red-soft-border bg-red-soft-bg px-[18px] py-[14px]">
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-red-text-2">Archive project</div>
          <div className="mt-[2px] text-[11.5px] text-red-text-2">
            Generates final knowledge package and snapshot. AI is disabled; the project becomes
            read-only forever.
          </div>
        </div>
        <Button size="sm" variant="danger">
          Archive…
        </Button>
      </div>
    </div>
  );
}
