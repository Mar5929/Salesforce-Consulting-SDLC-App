// Settings › Health thresholds
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// `HealthSettings` component (lines 419-457).

import { Card, Table, TD, TH, TR, Toggle } from "@/components/primitives";
import { SectionHead, TextMock } from "../_components";

interface SignalRow {
  sig: string;
  y: string;
  r: string;
  cur: number;
}

const SIGNALS: SignalRow[] = [
  { sig: "Stale open question", y: "> 7 days", r: "> 14 days", cur: 2 },
  { sig: "Client Qs past follow-up", y: "> 3 days", r: "> 7 days", cur: 2 },
  { sig: "Blocked work item", y: "> 5 days", r: "> 10 days", cur: 1 },
  { sig: "High-severity risk w/o plan", y: "any", r: "> 7 days", cur: 0 },
  { sig: "Sprint commit overrun", y: "> 110%", r: "> 130%", cur: 0 },
  { sig: "Sprint completion under", y: "< 75%", r: "< 50%", cur: 0 },
];

export default function HealthSettingsPage() {
  return (
    <div>
      <SectionHead
        title="Health thresholds"
        sub="Tunable signals that drive Yellow / Red. Defaults match PRD §17.6."
      />
      <Card className="!p-0">
        <Table>
          <thead>
            <tr>
              <TH>Signal</TH>
              <TH className="w-[130px]">Yellow at</TH>
              <TH className="w-[130px]">Red at</TH>
              <TH className="w-[90px]">Active</TH>
              <TH className="w-[90px]">Current</TH>
            </tr>
          </thead>
          <tbody>
            {SIGNALS.map((s, i) => (
              <TR key={i}>
                <TD>{s.sig}</TD>
                <TD>
                  <TextMock value={s.y} mono className="!w-[110px]" />
                </TD>
                <TD>
                  <TextMock value={s.r} mono className="!w-[110px]" />
                </TD>
                <TD>
                  <Toggle on={true} />
                </TD>
                <TD>
                  <span
                    className={`font-semibold ${
                      s.cur > 0 ? "text-yellow-dot-2" : "text-green-dot"
                    }`}
                  >
                    {s.cur}
                  </span>
                  {s.cur > 0 && (
                    <span className="ml-[4px] text-[10.5px] text-muted">active</span>
                  )}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
