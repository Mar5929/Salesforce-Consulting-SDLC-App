// Sample data for Acme Manufacturing
window.DATA = {
  firm: { name: "Rihm Consulting" },
  project: {
    name: "Acme Sales Cloud Build",
    client: "Acme Manufacturing",
    engagementType: "Greenfield",
    created: "2026-03-18",
    activeStage: "Build",
    health: "yellow",
    version: "v3 · approved 2026-04-02 by Sarah Chen",
  },
  currentUser: { id: "sarah", name: "Sarah Chen", role: "Solution Architect" },

  team: [
    { id: "sarah",   name: "Sarah Chen",       role: "Solution Architect", avatar: "a-sarah",   initials: "SC" },
    { id: "david",   name: "David Kim",        role: "Developer",          avatar: "a-david",   initials: "DK" },
    { id: "jamie",   name: "Jamie Rodriguez",  role: "Project Manager",    avatar: "a-jamie",   initials: "JR" },
    { id: "priya",   name: "Priya Patel",      role: "Business Analyst",   avatar: "a-priya",   initials: "PP" },
    { id: "marcus",  name: "Marcus Thompson",  role: "QA Engineer",        avatar: "a-marcus",  initials: "MT" },
    { id: "michael", name: "Michael Rihm",     role: "Firm Administrator", avatar: "a-michael", initials: "MR" },
  ],

  stages: [
    "Initialization", "Discovery", "Roadmap & Design",
    "Build", "Testing", "Deployment", "Hypercare", "Archive"
  ],

  tabs: [
    { id: "home", label: "Home", shortcut: "h" },
    { id: "discovery", label: "Discovery", shortcut: "d" },
    { id: "questions", label: "Questions", shortcut: "q", count: 4 },
    { id: "work", label: "Work", shortcut: "w" },
    { id: "knowledge", label: "Knowledge", shortcut: "k" },
    { id: "org", label: "Org", shortcut: "o" },
    { id: "chat", label: "Chat", shortcut: "c" },
    { id: "documents", label: "Documents", shortcut: "m" },
    { id: "dashboards", label: "Dashboards", shortcut: "b" },
    { id: "settings", label: "Settings", shortcut: "s" },
  ],

  projects: [
    { id: "acme", name: "Acme Manufacturing", client: "Acme", health: "yellow", stage: "Build", active: true, badge: "1" },
    { id: "meridian", name: "Meridian Health", client: "Meridian", health: "green", stage: "Testing", active: false },
    { id: "harbor", name: "Harbor Financial", client: "Harbor", health: "green", stage: "Discovery", active: false },
    { id: "terra", name: "Terra Logistics", client: "Terra", health: "red", stage: "Hypercare", active: false },
  ],

  phases: [
    { id: "P1", name: "Lead Management", readiness: 92, epicCount: 2, descriptor: "Lead Capture · Lead Assignment", duration: "6 weeks" },
    { id: "P2", name: "Opportunity Workflow", readiness: 76, epicCount: 2, descriptor: "Opportunity Mgmt · Stage Gating", duration: "4 weeks" },
    { id: "P3", name: "Quoting", readiness: 34, epicCount: 1, descriptor: "Template-Gen Quoting — pending re-proposal", duration: "5 weeks", reprop: true },
    { id: "P4", name: "Reporting", readiness: 48, epicCount: 2, descriptor: "Standard Dashboards · Custom Analytics", duration: "3 weeks" },
  ],

  epics: [
    { id: "LM-LC", phase: "P1", name: "Lead Capture", readiness: 88, wiCount: 4, openQs: 1 },
    { id: "LM-LA", phase: "P1", name: "Lead Assignment", readiness: 96, wiCount: 5, openQs: 0 },
    { id: "OPP-MG", phase: "P2", name: "Opportunity Management", readiness: 78, wiCount: 1, openQs: 1 },
    { id: "OPP-ST", phase: "P2", name: "Stage Gating", readiness: 74, wiCount: 1, openQs: 0 },
    { id: "Q-TG",  phase: "P3", name: "Template-Gen Quoting", readiness: 34, wiCount: 4, openQs: 2, reprop: "remove" },
    { id: "R-SD",  phase: "P4", name: "Standard Dashboards", readiness: 52, wiCount: 3, openQs: 1 },
    { id: "R-CU",  phase: "P4", name: "Custom Analytics", readiness: 44, wiCount: 2, openQs: 2 },
  ],

  workItems: [
    // Sprint 3
    { id: "WI-LM-LA-01", title: "Round-robin assignment rules",     epic: "LM-LA", assignee: "david",      status: "review",   points: 8, sprint: 3 },
    { id: "WI-LM-LA-02", title: "Manager override",                 epic: "LM-LA", assignee: "david",      status: "progress", points: 5, sprint: 3 },
    { id: "WI-LM-LA-03", title: "Notify assignee on lead claim",    epic: "LM-LA", assignee: "david",      status: "sprint",   points: 3, sprint: 3 },
    { id: "WI-LM-LA-04", title: "Assignment audit trail",           epic: "LM-LA", assignee: "david",      status: "qa",       points: 5, sprint: 3 },
    { id: "WI-LM-LA-05", title: "Re-assignment reason logging",     epic: "LM-LA", assignee: null,         status: "sprint",   points: 3, sprint: 3 },
    { id: "WI-LM-LC-02", title: "Import leads from CSV",            epic: "LM-LC", assignee: null,         status: "ready",    points: 8, sprint: 3, carryover: true },
    { id: "WI-LM-LC-04", title: "Dedupe on phone + email",          epic: "LM-LC", assignee: "david",      status: "progress", points: 8, sprint: 3 },
    // Backlog
    { id: "WI-LM-LC-01", title: "Capture leads from web form",      epic: "LM-LC", assignee: null,         status: "ready",    points: 5, blocked: "Q-LM-LC-003" },
    { id: "WI-LM-LC-03", title: "Enrich leads with Clearbit lookup",epic: "LM-LC", assignee: null,         status: "ready",    points: 5 },
    { id: "WI-OPP-MG-01", title: "Configure 7-stage opportunity model", epic: "OPP-MG", assignee: null,    status: "ready",    points: 5 },
    { id: "WI-OPP-ST-01", title: "Stage-entry validation rules",    epic: "OPP-ST", assignee: null,        status: "ready",    points: 8 },
    // Build-in-progress being affected by re-proposal
    { id: "WI-QT-TG-02", title: "Build quote PDF template",         epic: "Q-TG", assignee: "david",       status: "progress", points: 8, affectedByReprop: true },
  ],

  statuses: [
    { id: "draft",    label: "Draft",         className: "status-draft" },
    { id: "ready",    label: "Ready",         className: "status-ready" },
    { id: "sprint",   label: "Sprint Planned",className: "status-sprint" },
    { id: "progress", label: "In Progress",   className: "status-progress" },
    { id: "review",   label: "In Review",     className: "status-review" },
    { id: "qa",       label: "QA",            className: "status-qa" },
    { id: "done",     label: "Done",          className: "status-done" },
  ],

  sprint: {
    name: "Sprint 3",
    window: "2026-04-14 → 2026-04-28",
    committed: 40, completed: 24, remaining: 16,
    capacity: 45,
    history: [
      { name: "Sprint 1", window: "Mar 19 → Apr 2",  committed: 32, completed: 28, carryover: 4 },
      { name: "Sprint 2", window: "Apr 2 → Apr 14",  committed: 38, completed: 36, carryover: 2 },
      { name: "Sprint 3", window: "Apr 14 → Apr 28 · active", committed: 40, completed: 24, carryover: null },
    ],
  },

  questions: [
    { id: "Q-ENG-005", text: "Does Acme need multi-currency? US and Canada ops are separate entities.", scope: "Engagement", state: "open", owner: "Acme CFO", ownerType: "client", blocks: 5, askedBy: "Sarah Chen", askedDate: "2026-04-05" },
    { id: "Q-P3-001",  text: "Native Opportunity Products or Salesforce CPQ?", scope: "Phase · P3", state: "answered", owner: "Sarah Chen", ownerType: "team", blocks: 0, askedBy: "Priya Patel", askedDate: "2026-04-08", answeredDate: "2026-04-16", answer: "Salesforce CPQ. Configurable product bundles are required.", triggered: "Phase 3 re-proposal" },
    { id: "Q-LM-LC-003", text: "What fields should the web form capture beyond name, email, phone?", scope: "Feature · LM-LC", state: "open", owner: "Priya Patel", ownerType: "team", blocks: 1, blocksList: ["WI-LM-LC-01"], askedBy: "Priya Patel", askedDate: "2026-04-14" },
    { id: "Q-LM-LA-001", text: "What happens if a round-robin target is out of office?", scope: "Feature · LM-LA", state: "answered", owner: "Sarah Chen", ownerType: "team", blocks: 0, askedBy: "David Kim", askedDate: "2026-04-10", answeredDate: "2026-04-12", answer: "Skip to next available rep; log skip reason on audit trail." },
    { id: "Q-OPP-MG-002", text: "How do renewals differ from new business?", scope: "Epic · OPP-MG", state: "open", owner: "Jamie Rodriguez", ownerType: "team", blocks: 1, askedBy: "Sarah Chen", askedDate: "2026-04-12" },
    { id: "Q-DM-004",  text: "Do historical closed-lost opportunities migrate into Salesforce?", scope: "Engagement", state: "parked", owner: "Acme IT", ownerType: "client", blocks: 0, askedBy: "Priya Patel", askedDate: "2026-04-03", parkedReason: "Acme will decide after Phase 2 ships." },
  ],

  decisions: [
    { id: "D-LM-001",  text: "Leads owned by Sales only; Marketing releases the lead at conversion.", date: "2026-04-02", by: "Sarah Chen" },
    { id: "D-OPP-003", text: "Opportunity stages follow Acme's 7-stage model, not Salesforce default.", date: "2026-04-08", by: "Sarah Chen" },
    { id: "D-DM-002",  text: "Data migration scope limited to last 3 years of Lead and Account records.", date: "2026-03-30", by: "Sarah Chen" },
  ],

  risks: [
    { id: "R-001", text: "Acme data team has not validated proposed import format.",  sev: "High",   owner: "Priya Patel",     status: "Open",     mitigation: "Schedule data review workshop" },
    { id: "R-002", text: "CPQ re-proposal may extend timeline by 4 weeks.",            sev: "Medium", owner: "Jamie Rodriguez", status: "Open",     mitigation: "TBD" },
    { id: "R-003", text: "Acme sponsor availability during UAT window uncertain.",     sev: "Medium", owner: "Jamie Rodriguez", status: "Monitoring", mitigation: "Confirm UAT schedule by 2026-04-30" },
  ],

  adminTasks: [
    { id: "AT-01", title: "Set up Jane Smith's sandbox user",                   owner: "sarah",   due: "2026-04-20", status: "Open" },
    { id: "AT-02", title: "Schedule Discovery workshop #3 (CPQ scope) w/ Acme", owner: "jamie",   due: "2026-04-22", status: "Open" },
    { id: "AT-03", title: "Grant Marcus access to Gong",                        owner: "michael", due: "2026-04-15", status: "Done" },
    { id: "AT-04", title: "Confirm go-live target with Acme VP Sales",          owner: "jamie",   due: "2026-04-30", status: "In Progress" },
    { id: "AT-05", title: "Send UAT kickoff email to Acme sponsors",            owner: "priya",   due: "2026-05-15", status: "Open" },
  ],

  // The pending AI re-proposal
  reproposal: {
    firedAt: "2026-04-17 08:14",
    trigger: "Answer to Q-P3-001 landed 2026-04-16",
    summary: "Replace Phase 3 (Quoting) with CPQ Implementation — adds 3 epics, re-parents 1 work item, affects 1 in-flight build.",
    changes: [
      {
        type: "removed",
        label: "Removed",
        title: "Phase 3 epic: Q-TG Template-Gen Quoting",
        detail: "4 work items will be closed or re-assigned.",
        evidence: "Q-P3-001 answer (2026-04-16) + workshop transcript 2026-04-10 Acme Sales & IT Joint Session @ 14:22",
      },
      {
        type: "renamed",
        label: "Phase renamed",
        title: "P3 \"Quoting\" → \"CPQ Implementation\"",
        detail: null,
        evidence: "Q-P3-001 answer (2026-04-16)",
      },
      {
        type: "added",
        label: "Added (3 epics)",
        title: "CPQ-IM Product Catalog  ·  CPQ-PR Pricing Rules  ·  CPQ-DC Document Creation",
        detail: "12 new work items drafted — 5 + 4 + 3 across the three epics.",
        evidence: "Workshop 2026-04-10 @ 14:22: \"We need configurable bundles with volume pricing and branded PDFs.\"",
      },
      {
        type: "reparented",
        label: "Re-parented",
        title: "WI-R-CU-02 Quote-level custom report  →  P4 R-CU  moves to  P3 CPQ-DC",
        detail: "Belongs with Document Creation scope.",
        evidence: "Sarah Chen decision 2026-04-17 (pending confirmation)",
      },
    ],
    impactInFlight: [
      {
        id: "WI-QT-TG-02",
        title: "Build quote PDF template",
        status: "In Progress",
        assignee: "david",
        points: 8,
        recommendation: "CPQ uses a different document engine. Recommend close + replace with WI-CPQ-DC-01.",
      },
    ],
    evidenceLinks: [
      { type: "question", id: "Q-P3-001" },
      { type: "transcript", id: "2026-04-10 Acme Sales & IT Joint Session @ 14:22" },
    ],
  },

  // Component samples
  components: [
    { apiName: "Lead",                         label: "Lead",                      type: "Object",       ns: "standard", custom: false, lastMod: "2026-04-05", annotations: 2, domains: ["Lead Management"] },
    { apiName: "Lead_Source_Detail__c",        label: "Lead Source Detail",        type: "Field",        ns: "custom",   parent: "Lead", custom: true,  lastMod: "2026-04-07", annotations: 1, domains: ["Lead Management"] },
    { apiName: "Region__c",                    label: "Region",                    type: "Field",        ns: "custom",   parent: "Lead", custom: true,  lastMod: "2026-04-05", annotations: 0, domains: ["Lead Management"] },
    { apiName: "Opportunity",                  label: "Opportunity",               type: "Object",       ns: "standard", custom: false, lastMod: "2026-04-08", annotations: 3, domains: ["Opportunity Workflow"] },
    { apiName: "Acme_Territory__c",            label: "Territory",                 type: "Object",       ns: "custom",   custom: true,  lastMod: "2026-04-05", annotations: 1, domains: ["Lead Management"] },
    { apiName: "LeadAssignmentHandler",        label: "Lead Assignment Handler",   type: "Apex class",   ns: "custom",   custom: true,  lastMod: "2026-04-16", annotations: 2, domains: ["Lead Management"], loc: 280, cov: 82 },
    { apiName: "Lead_Web_Form_Routing",        label: "Lead Web Form Routing",     type: "Flow",         ns: "custom",   custom: true,  lastMod: "2026-04-12", annotations: 0, domains: ["Lead Management"] },
    { apiName: "AccountTriggerHandler",        label: "Account Trigger Handler",   type: "Apex class",   ns: "custom",   custom: true,  lastMod: "2026-03-28", annotations: 0, domains: [], loc: 420 },
  ],

  domains: [
    { name: "Lead Management",    members: 14, source: "human",    status: "confirmed" },
    { name: "Opportunity Workflow", members: 22, source: "ai",     status: "proposed" },
  ],

  // Transcript processing sample
  transcriptReview: {
    meeting: "Acme Sales & IT Joint Session",
    date: "2026-04-10",
    attendees: ["Sarah Chen", "Priya Patel", "Acme VP Sales", "Acme IT Director"],
    duration: "62 min",
    processed: "2 min ago",
    applied: 14,
    review: 6,
    items: [
      { kind: "question",   text: "Should we support multi-currency across US and Canada entities?", conf: "md", applyTo: "New question: Q-ENG-005", action: "review" },
      { kind: "decision",   text: "Stages follow Acme's 7-stage model, not Salesforce default.", conf: "hi", applyTo: "Applied: D-OPP-003", action: "applied" },
      { kind: "requirement",text: "Configurable product bundles with volume pricing needed.", conf: "md", applyTo: "Mapped to P3 (pending)", action: "review" },
      { kind: "risk",       text: "Acme data team hasn't validated import format.", conf: "hi", applyTo: "Applied: R-001", action: "applied" },
      { kind: "scope",      text: "CPQ implementation replaces template-gen quoting.", conf: "md", applyTo: "Triggered roadmap re-proposal", action: "review" },
      { kind: "annotation", text: "\"Region\" field on Lead is used as a territory proxy, not a geographic filter.", conf: "lo", applyTo: "Propose annotation on Region__c", action: "review" },
      { kind: "action",     text: "Marcus needs Gong access this week.", conf: "hi", applyTo: "Applied: AT-03", action: "applied" },
    ],
  },

  notifications: 7,

  // Current focus narrative (AI-synthesized)
  currentFocus: "Build is on track for Sprint 3 — 60% burned with 4 days left. The CPQ re-proposal is the most consequential open item; Sarah hasn't yet reviewed the diff. Priya can unblock WI-LM-LC-01 this week by answering Q-LM-LC-003.",
  currentFocusTs: "generated 4 minutes ago",

  recommendedFocus: [
    { rank: 1, qid: "Q-P3-001", text: "Review pending CPQ re-proposal (fired 08:14 today).", reason: "Blocks 13 work items; affects 1 in-flight build.", owner: "sarah" },
    { rank: 2, qid: "Q-LM-LC-003", text: "Q-LM-LC-003: What fields should the web form capture?", reason: "Blocks WI-LM-LC-01; Priya is owner.", owner: "priya" },
    { rank: 3, qid: "Q-ENG-005", text: "Q-ENG-005: Multi-currency for US and Canada entities?", reason: "Cross-cutting; blocks 5 items across P2–P3.", owner: "sarah" },
    { rank: 4, qid: "Q-OPP-MG-002", text: "Q-OPP-MG-002: Renewals vs new business?", reason: "Blocks OPP-MG epic design.", owner: "jamie" },
  ],
};
