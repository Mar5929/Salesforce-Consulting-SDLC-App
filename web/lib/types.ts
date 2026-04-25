// Entity types — port of project/data.js shape, typed.
// Enum values copied verbatim from data.js. Source of truth: lib/data.ts.

export type Health = "green" | "yellow" | "red";
export type AvatarKey =
  | "a-sarah"
  | "a-david"
  | "a-jamie"
  | "a-priya"
  | "a-marcus"
  | "a-michael"
  | "a-client";

export interface Firm {
  name: string;
}

export interface Project {
  name: string;
  client: string;
  engagementType: string;
  created: string;
  activeStage: string;
  health: Health;
  version: string;
}

export type Role =
  | "Solution Architect"
  | "Developer"
  | "Project Manager"
  | "Business Analyst"
  | "QA Engineer"
  | "Firm Administrator";

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
}

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  avatar: AvatarKey;
  initials: string;
}

export type Stage =
  | "Initialization"
  | "Discovery"
  | "Roadmap & Design"
  | "Build"
  | "Testing"
  | "Deployment"
  | "Hypercare"
  | "Archive";

export interface TabDef {
  id: string;
  label: string;
  shortcut: string;
  count?: number;
}

export interface ProjectListItem {
  id: string;
  name: string;
  client: string;
  health: Health;
  stage: string;
  active: boolean;
  badge?: string;
}

export interface Phase {
  id: string;
  name: string;
  readiness: number;
  epicCount: number;
  descriptor: string;
  duration: string;
  reprop?: boolean;
}

export interface Epic {
  id: string;
  phase: string;
  name: string;
  readiness: number;
  wiCount: number;
  openQs: number;
  reprop?: "remove" | "add" | "rename";
}

export type WIStatus =
  | "draft"
  | "ready"
  | "sprint"
  | "progress"
  | "review"
  | "qa"
  | "done"
  | "blocked";

export interface WorkItem {
  id: string;
  title: string;
  epic: string;
  assignee: string | null;
  status: WIStatus;
  points: number;
  sprint?: number;
  carryover?: boolean;
  blocked?: string;
  affectedByReprop?: boolean;
}

export interface StatusDef {
  id: WIStatus;
  label: string;
  className: string;
}

export interface SprintHistory {
  name: string;
  window: string;
  committed: number;
  completed: number;
  carryover: number | null;
}

export interface Sprint {
  name: string;
  window: string;
  committed: number;
  completed: number;
  remaining: number;
  capacity: number;
  history: SprintHistory[];
}

export type QuestionState = "open" | "answered" | "parked";
export type OwnerType = "client" | "team";
export interface Question {
  id: string;
  text: string;
  scope: string;
  state: QuestionState;
  owner: string;
  ownerType: OwnerType;
  blocks: number;
  blocksList?: string[];
  askedBy: string;
  askedDate: string;
  answeredDate?: string;
  answer?: string;
  parkedReason?: string;
  triggered?: string;
}

export interface Decision {
  id: string;
  text: string;
  date: string;
  by: string;
}

export type RiskSeverity = "Low" | "Medium" | "High";
export type RiskStatus = "Open" | "Monitoring" | "Closed";
export interface Risk {
  id: string;
  text: string;
  sev: RiskSeverity;
  owner: string;
  status: RiskStatus;
  mitigation: string;
}

export type AdminTaskStatus = "Open" | "In Progress" | "Done";
export interface AdminTask {
  id: string;
  title: string;
  owner: string;
  due: string;
  status: AdminTaskStatus;
}

export type ReproposalChangeType =
  | "removed"
  | "added"
  | "renamed"
  | "reparented";

export interface ReproposalChange {
  type: ReproposalChangeType;
  label: string;
  title: string;
  detail: string | null;
  evidence: string;
}

export interface ReproposalImpactItem {
  id: string;
  title: string;
  status: string;
  assignee: string;
  points: number;
  recommendation: string;
}

export interface ReproposalEvidenceLink {
  type: "question" | "transcript" | "decision";
  id: string;
}

export interface Reproposal {
  firedAt: string;
  trigger: string;
  summary: string;
  changes: ReproposalChange[];
  impactInFlight: ReproposalImpactItem[];
  evidenceLinks: ReproposalEvidenceLink[];
}

export type ComponentType = "Object" | "Field" | "Apex class" | "Flow";
export interface SfComponent {
  apiName: string;
  label: string;
  type: ComponentType;
  ns: "standard" | "custom";
  parent?: string;
  custom: boolean;
  lastMod: string;
  annotations: number;
  domains: string[];
  loc?: number;
  cov?: number;
}

export interface Domain {
  name: string;
  members: number;
  source: "human" | "ai";
  status: "confirmed" | "proposed";
}

export type Confidence = "hi" | "md" | "lo";
export type TranscriptItemKind =
  | "question"
  | "decision"
  | "requirement"
  | "risk"
  | "scope"
  | "annotation"
  | "action";
export type TranscriptAction = "applied" | "review";

export interface TranscriptItem {
  kind: TranscriptItemKind;
  text: string;
  conf: Confidence;
  applyTo: string;
  action: TranscriptAction;
}

export interface TranscriptReview {
  meeting: string;
  date: string;
  attendees: string[];
  duration: string;
  processed: string;
  applied: number;
  review: number;
  items: TranscriptItem[];
}

export interface RecommendedFocus {
  rank: number;
  qid: string;
  text: string;
  reason: string;
  owner: string;
}

export interface AppData {
  firm: Firm;
  project: Project;
  currentUser: CurrentUser;
  team: TeamMember[];
  stages: Stage[];
  tabs: TabDef[];
  projects: ProjectListItem[];
  phases: Phase[];
  epics: Epic[];
  workItems: WorkItem[];
  statuses: StatusDef[];
  sprint: Sprint;
  questions: Question[];
  decisions: Decision[];
  risks: Risk[];
  adminTasks: AdminTask[];
  reproposal: Reproposal;
  components: SfComponent[];
  domains: Domain[];
  transcriptReview: TranscriptReview;
  notifications: number;
  currentFocus: string;
  currentFocusTs: string;
  recommendedFocus: RecommendedFocus[];
}
