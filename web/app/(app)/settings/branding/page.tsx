// Settings › Branding & document templates
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/settings.jsx
// `BrandingSettings` component (lines 537-617).

import { Button, Card, Chip, Table, TD, TH, TR } from "@/components/primitives";
import { SectionHead } from "../_components";

const FIRM_COLORS = ["#0F172A", "#4F46E5", "#16A34A", "#F59E0B", "#EF4444"];
const PROJECT_COLORS = ["#7F1D1D", "#DC2626", "#FCA5A5", "#F8FAFC", "#0F172A"];

interface TemplateRow {
  n: string;
  t: "docx" | "pptx";
  scope: "Firm" | "This project";
  used: string;
  state: "active" | "draft";
}

const TEMPLATES: TemplateRow[] = [
  { n: "Status report — weekly", t: "docx", scope: "Firm", used: "4 days ago", state: "active" },
  { n: "Business Requirements Doc", t: "docx", scope: "Firm", used: "12 days ago", state: "active" },
  { n: "Solution Design Document", t: "docx", scope: "Firm", used: "8 days ago", state: "active" },
  { n: "Phase readout deck", t: "pptx", scope: "Firm", used: "20 days ago", state: "active" },
  { n: "Acme — exec quarterly deck", t: "pptx", scope: "This project", used: "6 days ago", state: "active" },
  { n: "Test plan", t: "docx", scope: "Firm", used: "Never", state: "draft" },
];

function ColorSwatch({ color }: { color: string }) {
  const needsBorder = color === "#F8FAFC";
  return (
    <div
      className={`relative h-[36px] flex-1 rounded-xs ${needsBorder ? "border border-border" : ""}`}
      style={{ background: color }}
    >
      <span className="absolute -bottom-[16px] left-0 font-mono text-[9.5px] text-muted">
        {color}
      </span>
    </div>
  );
}

export default function BrandingSettingsPage() {
  return (
    <div>
      <SectionHead
        title="Branding & document templates"
        sub="Used when generating client-facing deliverables (status reports, BRDs, SDDs, decks)."
      />

      <Card className="mb-[14px] !p-[18px]">
        <div className="grid grid-cols-2 gap-[18px]">
          <div>
            <div className="mb-[8px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
              Firm
            </div>
            <div className="flex items-center gap-[12px] rounded-card border border-dashed border-border-hover p-[16px]">
              <div
                className="grid h-[56px] w-[56px] place-items-center rounded-card text-[20px] font-bold tracking-[-0.04em] text-white"
                style={{ background: "#0F172A" }}
              >
                R/
              </div>
              <div>
                <div className="text-[13px] font-semibold">Rihm Consulting</div>
                <div className="mt-[2px] text-[11px] text-muted">Logo · 56×56 SVG</div>
                <Button size="sm" className="mt-[6px]">
                  Replace
                </Button>
              </div>
            </div>
            <div className="mt-[12px] flex gap-[6px]">
              {FIRM_COLORS.map((c) => (
                <ColorSwatch key={c} color={c} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-[8px] text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
              This project
            </div>
            <div className="flex items-center gap-[12px] rounded-card border border-dashed border-border-hover p-[16px]">
              <div className="grid h-[56px] w-[56px] place-items-center rounded-card border border-border bg-surface">
                <div
                  className="grid h-[30px] w-[30px] place-items-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #DC2626, #7F1D1D)" }}
                >
                  A
                </div>
              </div>
              <div>
                <div className="text-[13px] font-semibold">Acme Manufacturing</div>
                <div className="mt-[2px] text-[11px] text-muted">
                  Co-branded mark · used in client deliverables
                </div>
                <Button size="sm" className="mt-[6px]">
                  Upload
                </Button>
              </div>
            </div>
            <div className="mt-[12px] flex gap-[6px]">
              {PROJECT_COLORS.map((c, i) => (
                <ColorSwatch key={`${c}-${i}`} color={c} />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <SectionHead
        title="Document templates"
        sub="Word and PowerPoint templates the AI populates with project content."
        actions={
          <Button size="sm" variant="primary">
            Upload template
          </Button>
        }
      />
      <Card className="!p-0">
        <Table>
          <thead>
            <tr>
              <TH>Template</TH>
              <TH className="w-[120px]">Type</TH>
              <TH className="w-[120px]">Scope</TH>
              <TH className="w-[120px]">Last used</TH>
              <TH className="w-[100px]">State</TH>
            </tr>
          </thead>
          <tbody>
            {TEMPLATES.map((r, i) => (
              <TR key={i}>
                <TD>
                  <div className="flex items-center gap-[8px]">
                    <div
                      className="grid h-[32px] w-[28px] place-items-center rounded-xs text-[9px] font-bold text-white"
                      style={{ background: r.t === "docx" ? "#2B579A" : "#D24726" }}
                    >
                      {r.t.toUpperCase()}
                    </div>
                    {r.n}
                  </div>
                </TD>
                <TD className="text-sm text-muted">{r.t}</TD>
                <TD>
                  <Chip tone={r.scope === "Firm" ? "violet" : "blue"}>{r.scope}</Chip>
                </TD>
                <TD className="text-sm text-muted">{r.used}</TD>
                <TD>
                  <Chip tone={r.state === "active" ? "green" : "gray"}>{r.state}</Chip>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
