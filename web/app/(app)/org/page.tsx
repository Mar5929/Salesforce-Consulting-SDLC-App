// Org tab — sandbox/components KPIs, components table, domains list,
// component detail sidebar (description list + 1-hop graph SVG + annotations).
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/tabs.jsx
// `Org` component (lines 259-390).

"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Icon,
  KpiCard,
  Table,
  TD,
  TH,
  TR,
  type ChipTone,
} from "@/components/primitives";
import { DATA } from "@/lib/data";
import type { ComponentType } from "@/lib/types";

function typeTone(type: ComponentType): ChipTone {
  if (type === "Object") return "indigo";
  if (type === "Field") return "sky";
  if (type === "Flow") return "teal";
  if (type === "Apex class") return "violet";
  return "gray";
}

function FilterPill({ k, v }: { k: string; v: string }) {
  return (
    <button
      type="button"
      className="inline-flex cursor-pointer items-center gap-[5px] rounded-lg border border-border bg-surface px-[9px] py-[4px] text-sm text-ink-3 hover:border-border-hover"
    >
      <span className="text-muted-2">{k}</span>
      <span className="font-medium text-ink">{v}</span>
      <Icon name="chevronDown" size={11} />
    </button>
  );
}

export default function OrgPage() {
  const [sel, setSel] = useState<string>("Lead");

  return (
    <>
      {/* KPIs */}
      <div className="mb-[14px] grid grid-cols-4 gap-[12px]">
        <KpiCard
          label="Sandbox"
          value={
            <span className="text-[14px] font-medium">
              acme-build · Partial Copy
            </span>
          }
          sub={
            <span className="text-green-dot">● Connected · last sync 14m ago</span>
          }
        />
        <KpiCard label="Components" value="847" sub="124 custom · 723 standard" />
        <KpiCard label="Annotations" value="34" sub="21 human · 13 AI-derived" />
        <KpiCard label="Domains" value="2" sub="1 confirmed · 1 proposed" />
      </div>

      {/* Two-column: components table+domains | detail sidebar */}
      <div className="grid gap-[12px] [grid-template-columns:1fr_420px]">
        {/* Left column */}
        <div>
          {/* Toolbar */}
          <div className="mb-[12px] flex items-center gap-[8px] rounded-card border border-border bg-surface px-[8px] py-[6px]">
            <FilterPill k="Type" v="All" />
            <FilterPill k="Domain" v="Any" />
            <FilterPill k="Changed since" v="Last sync" />
            <div className="flex-1" />
            <Button iconLeft={<Icon name="refresh" size={11} />}>Sync</Button>
            <Button iconLeft={<Icon name="sparkle" size={11} />}>
              Refresh KB
            </Button>
          </div>

          {/* Components table */}
          <Card className="!p-0">
            <Table>
              <thead>
                <tr>
                  <TH>API name</TH>
                  <TH>Type</TH>
                  <TH>Ns</TH>
                  <TH>Domains</TH>
                  <TH>Ann.</TH>
                  <TH>Last modified</TH>
                </tr>
              </thead>
              <tbody>
                {DATA.components.map((c) => (
                  <TR
                    key={c.apiName}
                    selected={sel === c.apiName}
                    onClick={() => setSel(c.apiName)}
                  >
                    <TD>
                      <span className="font-mono text-[11.5px] font-medium">
                        {c.apiName}
                      </span>
                      {c.parent && (
                        <span className="ml-[6px] text-sm text-muted">
                          on {c.parent}
                        </span>
                      )}
                    </TD>
                    <TD>
                      <Chip tone={typeTone(c.type)}>{c.type}</Chip>
                    </TD>
                    <TD>
                      {c.ns === "custom" ? (
                        <Chip tone="amber">custom</Chip>
                      ) : (
                        <Chip tone="gray">standard</Chip>
                      )}
                    </TD>
                    <TD className="text-sm">
                      {c.domains.length ? (
                        c.domains.join(", ")
                      ) : (
                        <span className="text-muted-2">—</span>
                      )}
                    </TD>
                    <TD className="text-sm">{c.annotations}</TD>
                    <TD className="font-mono text-sm">{c.lastMod}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* Domains */}
          <div className="mb-[10px] mt-[20px] flex items-center gap-[10px]">
            <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-3">
              Domains
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-[12px]">
            <div className="rounded-card border border-border bg-surface px-[14px] py-[12px]">
              <div className="mb-[6px] flex items-center gap-[8px]">
                <Icon name="database" size={14} color="#4F46E5" />
                <span className="font-semibold">Lead Management</span>
                <Chip tone="green">confirmed</Chip>
              </div>
              <div className="text-sm text-muted">14 members · human-created</div>
              <div className="mt-[8px] text-[11.5px] text-ink-3">
                Lead · 8 custom fields · LeadAssignmentHandler ·
                Lead_Web_Form_Routing · Acme_Territory__c + 3 more
              </div>
            </div>
            <div className="rounded-card border border-violet-border bg-violet-grad-start px-[14px] py-[12px]">
              <div className="mb-[6px] flex items-center gap-[8px]">
                <Icon name="sparkle" size={14} color="#7C3AED" />
                <span className="font-semibold">Opportunity Workflow</span>
                <Chip tone="violet">AI-proposed</Chip>
              </div>
              <div className="text-sm text-muted">
                22 members · awaiting SA confirmation
              </div>
              <div className="mt-[8px] flex gap-[6px]">
                <Button size="sm" variant="primary">
                  Confirm
                </Button>
                <Button size="sm">Edit</Button>
                <Button size="sm">Reject</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Component detail sidebar */}
        <div>
          <Card>
            <div className="mb-[10px] flex items-center gap-[8px]">
              <Icon name="database" size={16} color="#4F46E5" />
              <div className="font-mono text-[14px] font-semibold">{sel}</div>
            </div>
            <dl className="grid grid-cols-[100px_1fr] gap-x-[10px] gap-y-[6px] text-[12px]">
              <dt className="font-medium text-muted">Type</dt>
              <dd className="m-0 text-ink">Standard Object</dd>
              <dt className="font-medium text-muted">Domains</dt>
              <dd className="m-0 text-ink">Lead Management</dd>
              <dt className="font-medium text-muted">Custom fields</dt>
              <dd className="m-0 text-ink">12</dd>
              <dt className="font-medium text-muted">Last sync</dt>
              <dd className="m-0 font-mono text-sm text-ink">
                2026-04-17 09:43
              </dd>
              <dt className="font-medium text-muted">Work items</dt>
              <dd className="m-0 text-ink">7 items declare impact</dd>
            </dl>

            {/* 1-hop graph */}
            <div className="mb-[10px] mt-[14px] flex items-center gap-[10px]">
              <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-3">
                1-hop graph
              </h2>
            </div>
            <svg
              viewBox="0 0 360 200"
              className="h-[200px] w-full rounded-lg bg-canvas"
            >
              <line x1="180" y1="100" x2="70" y2="50" stroke="#CBD5E1" strokeWidth="1.2" />
              <line x1="180" y1="100" x2="290" y2="50" stroke="#CBD5E1" strokeWidth="1.2" />
              <line x1="180" y1="100" x2="70" y2="150" stroke="#CBD5E1" strokeWidth="1.2" />
              <line x1="180" y1="100" x2="290" y2="150" stroke="#CBD5E1" strokeWidth="1.2" />
              <text x="125" y="45" fontSize="9" fill="#64748B" fontFamily="Inter">
                trigger
              </text>
              <text x="235" y="45" fontSize="9" fill="#64748B" fontFamily="Inter">
                lookup
              </text>
              <text x="115" y="145" fontSize="9" fill="#64748B" fontFamily="Inter">
                invokes
              </text>
              <text x="235" y="145" fontSize="9" fill="#64748B" fontFamily="Inter">
                flow-on
              </text>
              <rect
                x="130"
                y="80"
                width="100"
                height="40"
                rx="8"
                fill="#EEF2FF"
                stroke="#4F46E5"
                strokeWidth="2"
              />
              <text
                x="180"
                y="105"
                fontSize="12"
                fill="#3730A3"
                textAnchor="middle"
                fontWeight="600"
                fontFamily="Inter"
              >
                Lead
              </text>
              {[
                { x: 10, y: 30, t: "LeadTrigger" },
                { x: 240, y: 30, t: "Territory__c" },
                { x: 10, y: 130, t: "LeadAssign..." },
                { x: 240, y: 130, t: "Web_Form_Routing" },
              ].map((n, i) => (
                <g key={i}>
                  <rect
                    x={n.x}
                    y={n.y}
                    width="110"
                    height="40"
                    rx="6"
                    fill="white"
                    stroke="#E2E8F0"
                  />
                  <text
                    x={n.x + 55}
                    y={n.y + 25}
                    fontSize="10.5"
                    fill="#0F172A"
                    textAnchor="middle"
                    fontFamily="JetBrains Mono"
                  >
                    {n.t}
                  </text>
                </g>
              ))}
            </svg>

            {/* Annotations */}
            <div className="mb-[10px] mt-[14px] flex items-center gap-[10px]">
              <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-3">
                Annotations · 2
              </h2>
              <div className="ml-auto">
                <Button size="sm">+ Add</Button>
              </div>
            </div>
            <div className="mb-[6px] rounded-sm border-l-[3px] border-violet-500 bg-violet-grad-start px-[10px] py-[8px] text-[12px]">
              <div className="mb-[3px] text-[10.5px] font-semibold text-violet-text-2">
                AI-DERIVED · 2026-04-12
              </div>
              Region__c is used as a territory proxy, not a geographic filter.
              Treat as categorical assignment key.
            </div>
            <div className="rounded-sm border-l-[3px] border-[#0EA5E9] bg-sky-bg px-[10px] py-[8px] text-[12px]">
              <div className="mb-[3px] text-[10.5px] font-semibold text-sky-text">
                SARAH CHEN · 2026-04-05
              </div>
              Lead ownership transfers to Sales at conversion; Marketing releases
              ownership automatically.
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
