// Firm Admin › Branding & templates
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/firm-admin.jsx
// (lines 571-677) — firm brand tokens + document templates.

import { Avatar, Card, Chip, Icon, Table, TD, TH, TR } from "@/components/primitives";
import { FA_DATA, type FirmTemplate } from "@/lib/firmAdminData";
import { SectionHead } from "../_components";

const STATE_TONE: Record<FirmTemplate["state"], "green" | "amber" | "violet"> = {
  active: "green",
  draft: "amber",
  review: "violet",
};

const TYPE_GLYPH: Record<FirmTemplate["t"], { bg: string; label: string }> = {
  docx: { bg: "#2B579A", label: "DOC" },
  pptx: { bg: "#D24726", label: "PPT" },
};

const BRAND_SWATCHES = [
  { name: "Indigo (primary)", token: "--color-indigo", value: "#4F46E5" },
  { name: "Slate (rail)", token: "--color-rail", value: "#0F172A" },
  { name: "Logo grad start", token: "--color-logo-grad-start", value: "#6366F1" },
  { name: "Logo grad end", token: "--color-logo-grad-end", value: "#A855F7" },
];

export default function FirmAdminBrandingPage() {
  return (
    <div className="flex flex-col gap-[14px]">
      <SectionHead
        title="Branding & templates"
        sub="Firm-wide visual identity and document templates. Used by every generated artifact."
        actions={<Chip tone="violet">firm-managed</Chip>}
      />

      <Card>
        <h3 className="m-0 mb-[10px] flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          <Icon name="palette" size={12} />
          Firm brand
        </h3>
        <div className="grid grid-cols-[200px_1fr] items-start gap-[20px]">
          <div className="flex flex-col items-center gap-[8px] rounded-card border border-border bg-canvas px-[14px] py-[16px]">
            <div
              className="grid h-[56px] w-[56px] place-items-center rounded-[12px] text-[24px] font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #6366F1, #A855F7)",
              }}
            >
              R
            </div>
            <div className="text-[12px] font-semibold text-ink">Rihm Consulting</div>
            <div className="text-[10.5px] text-muted">v2026.4 · refreshed Apr 02</div>
          </div>
          <div>
            <div className="mb-[8px] text-[11px] font-medium uppercase tracking-[0.05em] text-muted-2">
              Palette
            </div>
            <div className="grid grid-cols-2 gap-[8px]">
              {BRAND_SWATCHES.map((s) => (
                <div
                  key={s.token}
                  className="flex items-center gap-[10px] rounded-card border border-stripe bg-canvas px-[10px] py-[8px]"
                >
                  <span
                    className="h-[28px] w-[28px] shrink-0 rounded-md border border-border"
                    style={{ background: s.value }}
                  />
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-ink">{s.name}</div>
                    <code className="font-mono text-[10.5px] text-muted">{s.value}</code>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-[10px] text-[10.5px] text-muted">
              Tokens map to <code className="font-mono">web/app/globals.css</code>; updates ship with the next deploy.
            </div>
          </div>
        </div>
      </Card>

      <Card className="!p-0">
        <div className="flex items-center justify-between border-b border-stripe px-[14px] py-[10px]">
          <div className="flex items-center gap-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            <Icon name="clipboard" size={12} />
            Document templates
            <span className="rounded-pill bg-stripe px-[7px] py-[2px] text-xs font-medium text-ink-3">
              {FA_DATA.templates.length}
            </span>
          </div>
        </div>
        <Table>
          <thead>
            <tr>
              <TH>Template</TH>
              <TH className="w-[60px]">Type</TH>
              <TH>Description</TH>
              <TH className="w-[120px]">Owner</TH>
              <TH className="w-[80px]">Used</TH>
              <TH className="w-[100px]">Edited</TH>
              <TH className="w-[90px]">State</TH>
            </tr>
          </thead>
          <tbody>
            {FA_DATA.templates.map((t) => {
              const glyph = TYPE_GLYPH[t.t];
              return (
                <TR key={t.n}>
                  <TD className="text-[12px] font-medium text-ink">{t.n}</TD>
                  <TD>
                    <span
                      className="grid h-[22px] w-[28px] place-items-center rounded-sm text-[9px] font-bold text-white"
                      style={{ background: glyph.bg }}
                    >
                      {glyph.label}
                    </span>
                  </TD>
                  <TD className="text-[11.5px] text-muted">{t.desc}</TD>
                  <TD>
                    <div className="flex items-center gap-[6px]">
                      <Avatar person={t.owner} size="xs" />
                      <span className="text-[11.5px] text-ink-2">
                        {t.owner.charAt(0).toUpperCase() + t.owner.slice(1)}
                      </span>
                    </div>
                  </TD>
                  <TD className="font-mono text-[11px] text-muted">{t.used}×</TD>
                  <TD className="text-[11px] text-muted">{t.edited}</TD>
                  <TD>
                    <Chip tone={STATE_TONE[t.state]}>{t.state}</Chip>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
