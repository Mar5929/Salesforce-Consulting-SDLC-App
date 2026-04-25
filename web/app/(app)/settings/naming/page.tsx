// Settings › Naming conventions
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// `NamingSettings` component (lines 620-653).

import { Card, Icon, Table, TD, TH, TR } from "@/components/primitives";
import { SectionHead, TextMock } from "../_components";

const ROWS: ReadonlyArray<readonly [string, string, string]> = [
  ["Custom object", "{Acronym}_{Name}__c", "ACM_LeadSource__c"],
  ["Custom field", "{Name}__c", "LegacyId__c"],
  ["Apex class", "{Domain}{Type}", "LeadAssignmentService"],
  ["Apex test class", "{Class}Test", "LeadAssignmentServiceTest"],
  ["Trigger", "{Object}Trigger", "LeadTrigger"],
  ["Trigger handler", "{Object}TriggerHandler", "LeadTriggerHandler"],
  ["Lightning component", "{domain}{Name}", "leadAssignmentPanel"],
  ["Permission set", "PS_{Domain}_{Action}", "PS_Lead_FullAccess"],
  ["Validation rule", "{Object}_{Rule}", "Lead_Phone_Required"],
];

export default function NamingSettingsPage() {
  return (
    <div>
      <SectionHead
        title="Naming conventions"
        sub="Enforced by Claude Code skill #5 when creating new Salesforce metadata."
      />
      <Card className="!p-0">
        <Table>
          <thead>
            <tr>
              <TH>Component</TH>
              <TH>Pattern</TH>
              <TH>Example</TH>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([n, p, e], i) => (
              <TR key={i}>
                <TD>{n}</TD>
                <TD>
                  <TextMock value={p} mono />
                </TD>
                <TD className="font-mono text-sm">{e}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
      <div className="mt-[12px] flex items-center gap-[6px] rounded-lg border border-blue-text/20 bg-blue-bg/40 px-[14px] py-[10px] text-[11.5px] text-blue-text">
        <Icon name="warn" size={12} />
        <span>
          Patterns are validated as regex inside the Claude Code skill. Override per-project
          requires Firm Admin approval.
        </span>
      </div>
    </div>
  );
}
