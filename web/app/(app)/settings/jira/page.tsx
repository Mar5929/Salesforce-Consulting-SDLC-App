// Settings › Jira sync
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// `JiraSettings` component (lines 313-375).

"use client";

import { useState } from "react";

import { Card, Chip, Icon, Table, TD, TH, TR, Toggle } from "@/components/primitives";
import { Field, SectionHead, TextMock } from "../_components";

const PUSH_OPTIONS: ReadonlyArray<readonly [string, boolean]> = [
  ["Story title & description", true],
  ["Status transitions", true],
  ["Story points", true],
  ["Acceptance criteria", true],
  ["Comments from this app", false],
];

const STATUS_MAP: ReadonlyArray<readonly [string, string]> = [
  ["Ready", "To Do"],
  ["Sprint Planned", "Selected for Development"],
  ["In Progress", "In Progress"],
  ["In Review", "In Code Review"],
  ["QA", "QA"],
  ["Done", "Done"],
];

export default function JiraSettingsPage() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div>
      <SectionHead
        title="Client Jira sync"
        sub="Optional one-directional push from this app → client Jira (per §20). Never pulls; never round-trips."
        actions={
          <Toggle on={enabled} onChange={setEnabled} label={enabled ? "Enabled" : "Disabled"} />
        }
      />

      {!enabled && (
        <Card className="!p-[24px_22px] text-center text-ink-3">
          <div className="mx-auto mb-[12px] grid h-[48px] w-[48px] place-items-center rounded-full bg-stripe text-muted-2">
            <Icon name="refresh" size={20} />
          </div>
          <div className="mb-[4px] text-[14px] font-semibold text-ink">Jira sync is off</div>
          <div className="mx-auto max-w-[460px] text-[12px] leading-[1.6]">
            Turn this on if the client requires their stories to live in Jira. We push status
            updates from this app to their instance; their edits don&apos;t flow back.
          </div>
        </Card>
      )}

      {enabled && (
        <>
          <Card className="mb-[14px] !p-[4px_18px]">
            <Field label="Jira instance">
              <TextMock value="acme.atlassian.net" mono wide />
            </Field>
            <Field label="Project key">
              <TextMock value="ACMSF" mono />
            </Field>
            <Field label="Auth">
              <Chip tone="amber">Awaiting client OAuth</Chip>
            </Field>
          </Card>
          <Card className="!p-[4px_18px]">
            <Field
              label="What we push"
              hint="One-directional only. Client edits in Jira are not pulled back."
            >
              <div className="flex flex-col gap-[6px]">
                {PUSH_OPTIONS.map(([n, on]) => (
                  <div key={n} className="flex items-center gap-[10px]">
                    <Toggle on={on} />
                    <span className="text-[12px]">{n}</span>
                  </div>
                ))}
              </div>
            </Field>
            <Field label="Status mapping">
              <Table className="!text-sm">
                <thead>
                  <tr>
                    <TH>Local status</TH>
                    <TH>Jira status</TH>
                  </tr>
                </thead>
                <tbody>
                  {STATUS_MAP.map(([a, b]) => (
                    <TR key={a}>
                      <TD>{a}</TD>
                      <TD>→ &nbsp;{b}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </Field>
          </Card>
        </>
      )}
    </div>
  );
}
