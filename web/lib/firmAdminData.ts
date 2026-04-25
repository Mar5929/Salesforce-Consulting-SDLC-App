// Firm Admin mock data — port of project/firm-admin.jsx FA_DATA constant.
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/firm-admin.jsx
// (lines 936-1050).

import { DATA } from "./data";
import type { TeamMember } from "./types";

export type FirmHealth = "green" | "yellow" | "red";
export type FirmProjectState = "active" | "archive";

export interface FirmProject {
  id: string;
  client: string;
  initial: string;
  color: string;
  engagement: string;
  stage: string;
  health: FirmHealth;
  mtd: number;
  cap: number;
  owner: string;
  team: string[];
  sprint: string;
  started: string;
  lastActive: string;
  state: FirmProjectState;
}

export type FirmSignalTone = "red" | "amber" | "green";
export interface FirmSignal {
  icon: "warn" | "dollar" | "shield" | "check" | "users";
  tone: FirmSignalTone;
  title: string;
  detail: string;
  when: string;
}

export interface FirmRecentAction {
  who: string;
  label: string;
  detail: string;
  when: string;
}

export interface FirmUtilization {
  who: string;
  name: string;
  role: string;
  proj: number;
  cap: number;
}

export interface FirmRosterRow {
  id: string;
  seat: "Architect" | "PM" | "BA" | "Dev" | "QA" | "Admin";
  cc: boolean;
  projects: string[];
  status: "active" | "pending" | "suspended";
  lastLogin: string;
  joined: string;
}

export interface FirmGuardrail {
  n: number;
  t: string;
  d: string;
  skill: string;
  refs: string[];
  triggered: number;
  lastFire: string;
  edited: string;
}

export interface FirmGuardrailFire {
  when: string;
  rule: number;
  what: string;
  project: string;
  who: string;
}

export interface FirmNamingPattern {
  c: string;
  p: string;
  e: string;
  active?: boolean;
  over: number;
}

export interface FirmTemplate {
  n: string;
  t: "docx" | "pptx";
  desc: string;
  owner: string;
  used: number;
  edited: string;
  state: "active" | "draft" | "review";
}

export interface FirmIntegration {
  id: string;
  name: string;
  role: string;
  glyph: string;
  bg: string;
  status: "connected" | "pending" | "disconnected";
  k1: string;
  v1: string;
  k2: string;
  v2: string;
}

export interface FirmAuditEvent {
  when: string;
  who: string;
  kind: "policy" | "access" | "export" | "guardrail" | "ai" | "integration";
  action: string;
  detail: string;
  project: string;
}

export interface FirmAdminData {
  team: TeamMember[];
  projects: FirmProject[];
  signals: FirmSignal[];
  recentActions: FirmRecentAction[];
  utilization: FirmUtilization[];
  roster: FirmRosterRow[];
  guardrails: FirmGuardrail[];
  guardrailFires: FirmGuardrailFire[];
  naming: FirmNamingPattern[];
  templates: FirmTemplate[];
  integrations: FirmIntegration[];
  audit: FirmAuditEvent[];
}

export const FA_DATA: FirmAdminData = {
  team: DATA.team,

  projects: [
    { id: "acme", client: "Acme Manufacturing", initial: "A", color: "#DC2626", engagement: "Greenfield · Sales Cloud", stage: "Build", health: "yellow", mtd: 10.81, cap: 40, owner: "sarah", team: ["sarah", "jamie", "priya", "david", "marcus"], sprint: "S3 · 60%", started: "2026-03-18", lastActive: "2 min ago", state: "active" },
    { id: "meridian", client: "Meridian Health", initial: "M", color: "#0EA5E9", engagement: "Migration · Service Cloud", stage: "Testing", health: "green", mtd: 38.20, cap: 50, owner: "jamie", team: ["jamie", "priya", "david", "marcus"], sprint: "UAT 1", started: "2026-01-09", lastActive: "14 min ago", state: "active" },
    { id: "harbor", client: "Harbor Financial", initial: "H", color: "#0F766E", engagement: "Greenfield · Sales+Service", stage: "Discovery", health: "green", mtd: 24.60, cap: 40, owner: "sarah", team: ["sarah", "priya"], sprint: "—", started: "2026-04-01", lastActive: "1 hr ago", state: "active" },
    { id: "terra", client: "Terra Logistics", initial: "T", color: "#9333EA", engagement: "Optimization · Sales Cloud", stage: "Hypercare", health: "red", mtd: 62.40, cap: 50, owner: "jamie", team: ["jamie", "marcus", "david"], sprint: "—", started: "2025-09-12", lastActive: "3 hr ago", state: "active" },
    { id: "arden", client: "Arden Robotics", initial: "AR", color: "#475569", engagement: "Greenfield · Experience Cloud", stage: "Roadmap", health: "green", mtd: 18.90, cap: 40, owner: "sarah", team: ["sarah", "priya", "david"], sprint: "—", started: "2026-03-28", lastActive: "5 hr ago", state: "active" },
    { id: "orchid", client: "Orchid Health", initial: "O", color: "#16A34A", engagement: "Managed services", stage: "Build", health: "green", mtd: 29.49, cap: 60, owner: "jamie", team: ["jamie", "marcus"], sprint: "S8 · 30%", started: "2025-11-04", lastActive: "8 hr ago", state: "active" },
    { id: "vela", client: "Vela Insurance", initial: "V", color: "#1E40AF", engagement: "Migration · Sales Cloud", stage: "Archive", health: "green", mtd: 0, cap: 40, owner: "sarah", team: ["sarah", "priya", "david", "marcus"], sprint: "—", started: "2025-04-15", lastActive: "Mar 12", state: "archive" },
  ],

  signals: [
    { icon: "warn", tone: "amber", title: "Acme · health flipped Yellow", detail: "Q-LM-LC-003 past follow-up threshold (8 days). Priya is owner.", when: "4h ago" },
    { icon: "dollar", tone: "amber", title: "Terra · MTD spend over cap", detail: "$62.40 / $50.00 (124%). Hypercare load drove Sonnet calls; cap raise pending.", when: "8h ago" },
    { icon: "shield", tone: "red", title: "Guardrail #2 fired · Terra", detail: "David K attempted destructive metadata op against shared sandbox. Blocked at skill level.", when: "Yesterday" },
    { icon: "check", tone: "green", title: "Meridian · UAT 1 closed", detail: "94% pass · 2 deferred · ready for cutover scheduling.", when: "Yesterday" },
    { icon: "users", tone: "green", title: "2 invitations pending acceptance", detail: "Jane Smith (Dev), R. Alvarez (QA contractor).", when: "1 day ago" },
  ],

  recentActions: [
    { who: "michael", label: "Edited", detail: "naming pattern · Apex test class (Trv override approved for Terra)", when: "12:14" },
    { who: "sarah", label: "Approved", detail: "naming override on Meridian Health", when: "09:48" },
    { who: "system", label: "Throttled", detail: "background jobs after Inngest 4,500 events", when: "08:32" },
    { who: "michael", label: "Invited", detail: "Jane Smith as Developer", when: "Yesterday" },
    { who: "sarah", label: "Bumped", detail: "Acme roadmap to v3 (CPQ re-proposal)", when: "Apr 16" },
    { who: "michael", label: "Updated", detail: "Status report template (firm)", when: "Apr 14" },
  ],

  utilization: [
    { who: "sarah", name: "Sarah Chen", role: "Solution Architect", proj: 4, cap: 4 },
    { who: "jamie", name: "Jamie Rodriguez", role: "Project Manager", proj: 3, cap: 3 },
    { who: "priya", name: "Priya Patel", role: "Business Analyst", proj: 2, cap: 3 },
    { who: "david", name: "David Kim", role: "Developer", proj: 2, cap: 2 },
    { who: "marcus", name: "Marcus Thompson", role: "QA Engineer", proj: 5, cap: 4 },
    { who: "michael", name: "Michael Rihm", role: "Firm Admin", proj: 0, cap: 0 },
  ],

  roster: [
    { id: "sarah", seat: "Architect", cc: true, projects: ["acme", "harbor", "arden", "vela"], status: "active", lastLogin: "Just now", joined: "2024-09-12" },
    { id: "jamie", seat: "PM", cc: false, projects: ["acme", "meridian", "terra"], status: "active", lastLogin: "12 min ago", joined: "2024-09-12" },
    { id: "priya", seat: "BA", cc: false, projects: ["acme", "harbor"], status: "active", lastLogin: "1 hr ago", joined: "2025-01-06" },
    { id: "david", seat: "Dev", cc: true, projects: ["acme", "meridian"], status: "active", lastLogin: "4 min ago", joined: "2025-03-04" },
    { id: "marcus", seat: "QA", cc: false, projects: ["acme", "meridian", "terra", "orchid", "vela"], status: "active", lastLogin: "Yesterday", joined: "2025-05-18" },
    { id: "michael", seat: "Admin", cc: true, projects: [], status: "active", lastLogin: "2 min ago", joined: "2024-09-01" },
  ],

  guardrails: [
    { n: 1, t: "No production deploys from agent", d: "Claude Code skills refuse to authenticate against any production org. Hard-coded refusal at the skill level — no override.", skill: "sf-deploy.skill", refs: ["§15.1"], triggered: 4, lastFire: "Apr 14", edited: "Mar 04, Sarah C" },
    { n: 2, t: "No destructive metadata operations", d: "Skill blocks deleteMetadata, deleteRecord, and bulk truncates. Removals must go through a human-authored destructive changeset.", skill: "sf-meta.skill", refs: ["§15.2"], triggered: 1, lastFire: "Yesterday", edited: "Feb 18, Michael R" },
    { n: 3, t: "Test class with every Apex change", d: "Skill rejects PRs that touch Apex without a corresponding test class meeting the firm coverage threshold (currently 80%).", skill: "sf-apex.skill", refs: ["§15.3", "§9"], triggered: 12, lastFire: "2h ago", edited: "Jan 22, Michael R" },
    { n: 4, t: "Validate against shared sandbox before PR", d: "Skill runs `sf project deploy validate -o shared-sandbox` before opening a PR. Validation must pass; no overrides.", skill: "sf-deploy.skill", refs: ["§15.4", "§14.1"], triggered: 28, lastFire: "40m ago", edited: "Mar 04, Sarah C" },
    { n: 5, t: "Naming conventions enforced", d: "New components must match the firm naming convention regex set. Prefixes are non-optional; per-project overrides require Firm Admin approval (see Naming registry).", skill: "sf-meta.skill", refs: ["§15.5"], triggered: 6, lastFire: "1d ago", edited: "Apr 02, Michael R" },
    { n: 6, t: "No PII in prompts or logs", d: "Skill scrubs known PII patterns (email, phone, SSN, credit-card) before sending to the model and before logging.", skill: "core.skill", refs: ["§15.6", "§22"], triggered: 0, lastFire: "never", edited: "Jan 11, Michael R" },
  ],

  guardrailFires: [
    { when: "Apr 25 11:02", rule: 4, what: "Validate failed · 3 Apex test failures", project: "Acme", who: "david" },
    { when: "Apr 24 16:48", rule: 3, what: "PR rejected · LeadAssignmentService had no test class", project: "Acme", who: "david" },
    { when: "Apr 24 09:11", rule: 2, what: "Blocked deleteMetadata on Trv_Lead_Trigger", project: "Terra", who: "david" },
    { when: "Apr 22 14:25", rule: 5, what: 'Naming reject · "leadAssign" did not match camelCase rule', project: "Meridian", who: "david" },
    { when: "Apr 22 09:00", rule: 1, what: "Refused production deploy attempt · routed to staging", project: "Terra", who: "marcus" },
  ],

  naming: [
    { c: "Custom object", p: "{Acronym}_{Name}__c", e: "ACM_LeadSource__c", over: 0 },
    { c: "Custom field", p: "{Name}__c", e: "LegacyId__c", over: 1 },
    { c: "Apex class", p: "{Domain}{Type}", e: "LeadAssignmentService", over: 1 },
    { c: "Apex test class", p: "{Class}Test", e: "LeadAssignmentServiceTest", over: 0 },
    { c: "Trigger", p: "{Object}Trigger", e: "LeadTrigger", over: 0 },
    { c: "Trigger handler", p: "{Object}TriggerHandler", e: "LeadTriggerHandler", over: 0 },
    { c: "Lightning component", p: "{domain}{Name}", e: "leadAssignmentPanel", over: 0 },
    { c: "Permission set", p: "PS_{Domain}_{Action}", e: "PS_Lead_FullAccess", over: 0 },
    { c: "Validation rule", p: "{Object}_{Rule}", e: "Lead_Phone_Required", over: 0 },
    { c: "Flow", p: "{Object}_{Action}_Flow", e: "Lead_WebForm_Flow", over: 0 },
  ],

  templates: [
    { n: "Status report — weekly", t: "docx", desc: "Weekly client-facing status. Auto-populates from sprint + risks.", owner: "sarah", used: 84, edited: "Apr 02", state: "active" },
    { n: "Business Requirements Document", t: "docx", desc: "BRD scaffold. Auto-fills from Discovery + decisions.", owner: "sarah", used: 12, edited: "Mar 14", state: "active" },
    { n: "Solution Design Document", t: "docx", desc: "SDD scaffold. References component graph.", owner: "sarah", used: 18, edited: "Mar 14", state: "active" },
    { n: "Phase readout deck", t: "pptx", desc: "End-of-phase exec readout.", owner: "jamie", used: 22, edited: "Feb 28", state: "active" },
    { n: "Test plan", t: "docx", desc: "QA test plan template, milestone-aligned.", owner: "marcus", used: 6, edited: "Apr 11", state: "draft" },
    { n: "Discovery summary", t: "docx", desc: "Post-workshop synthesis with Q&D extracted.", owner: "priya", used: 41, edited: "Apr 18", state: "active" },
    { n: "Project closeout · final", t: "docx", desc: "Knowledge package generated at Archive.", owner: "sarah", used: 3, edited: "Jan 22", state: "review" },
  ],

  integrations: [
    { id: "anthropic", name: "Anthropic API", role: "Model provider · Claude family", glyph: "A", bg: "#D97757", status: "connected", k1: "Account", v1: "rihm-consulting", k2: "Last call", v2: "2 sec ago" },
    { id: "inngest", name: "Inngest", role: "Background jobs · scheduled syncs", glyph: "In", bg: "#1E40AF", status: "connected", k1: "Plan", v1: "Free · 5K events", k2: "Headroom", v2: "4%" },
    { id: "slack", name: "Slack", role: "Notifications to firm + project channels", glyph: "#", bg: "#611F69", status: "connected", k1: "Workspace", v1: "rihm.slack.com", k2: "Channels", v2: "12 mapped" },
    { id: "github", name: "GitHub", role: "PR + commit metadata for skill changelogs", glyph: "G", bg: "#0F172A", status: "connected", k1: "Org", v1: "rihm-consulting", k2: "Repos", v2: "4 watched" },
    { id: "gong", name: "Gong", role: "Meeting transcription · firm-managed", glyph: "G", bg: "#7C3AED", status: "connected", k1: "Workspace", v1: "rihm.gong.io", k2: "Last sync", v2: "14 min ago" },
    { id: "okta", name: "Okta", role: "SSO + SCIM provisioning", glyph: "O", bg: "#0F766E", status: "pending", k1: "Domain", v1: "rihm.okta.com", k2: "Mode", v2: "Test only" },
  ],

  audit: [
    { when: "Apr 25 12:14", who: "michael", kind: "policy", action: "naming.override", detail: "Approved Trv prefix override for Terra · Apex class", project: "Terra" },
    { when: "Apr 25 11:02", who: "system", kind: "guardrail", action: "g4.fire", detail: "sandbox validate failed · 3 Apex test failures", project: "Acme" },
    { when: "Apr 25 09:48", who: "sarah", kind: "policy", action: "naming.override.req", detail: "Requested override approval on Meridian Health", project: "Meridian" },
    { when: "Apr 25 08:32", who: "system", kind: "integration", action: "inngest.throttle", detail: "Background jobs queued · 4,500 events reached", project: "—" },
    { when: "Apr 24 17:20", who: "michael", kind: "access", action: "invite.send", detail: "Invited jane.smith@rihm.com as Developer", project: "—" },
    { when: "Apr 24 16:48", who: "system", kind: "guardrail", action: "g3.fire", detail: "PR rejected · LeadAssignmentService missing tests", project: "Acme" },
    { when: "Apr 24 14:11", who: "sarah", kind: "export", action: "docx.export", detail: "Status report — Acme Sprint 3 week 2", project: "Acme" },
    { when: "Apr 24 09:11", who: "system", kind: "guardrail", action: "g2.fire", detail: "Blocked deleteMetadata on Trv_Lead_Trigger", project: "Terra" },
    { when: "Apr 24 08:14", who: "system", kind: "ai", action: "reproposal.fire", detail: "CPQ re-proposal queued for Sarah review", project: "Acme" },
    { when: "Apr 23 18:00", who: "michael", kind: "policy", action: "template.update", detail: "Updated Status report — weekly (firm)", project: "—" },
    { when: "Apr 23 11:40", who: "priya", kind: "ai", action: "transcript.upload", detail: "Acme · Discovery session 7 (28 min)", project: "Acme" },
    { when: "Apr 22 16:30", who: "michael", kind: "access", action: "role.change", detail: "Marcus T → also QA on Orchid Health", project: "Orchid" },
    { when: "Apr 22 14:25", who: "system", kind: "guardrail", action: "g5.fire", detail: 'Naming reject · "leadAssign" did not match pattern', project: "Meridian" },
    { when: "Apr 22 09:00", who: "system", kind: "guardrail", action: "g1.fire", detail: "Refused production deploy attempt", project: "Terra" },
  ],
};
