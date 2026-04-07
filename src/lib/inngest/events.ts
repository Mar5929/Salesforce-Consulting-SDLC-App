export const EVENTS = {
  // Audit events (Phase 1)
  AUDIT_SENSITIVE_OP: "audit/sensitive-operation",

  // Project events (Phase 1)
  PROJECT_CREATED: "project/created",
  PROJECT_MEMBER_INVITED: "project/member.invited",
  PROJECT_MEMBER_ROLE_CHANGED: "project/member.role-changed",

  // Transcript events (Phase 2)
  TRANSCRIPT_UPLOADED: "transcript/uploaded",

  // Knowledge events (Phase 2)
  ARTICLE_FLAGGED_STALE: "article/flagged-stale",
  ENTITY_CONTENT_CHANGED: "entity/content-changed",
  EMBEDDING_BATCH_REQUESTED: "embedding/batch-requested",

  // Notification events (Phase 2)
  NOTIFICATION_SEND: "notification/send",

  // Dashboard events (Phase 2)
  PROJECT_STATE_CHANGED: "project/state-changed",

  // Sprint events (Phase 3)
  SPRINT_STORIES_CHANGED: "sprint/stories-changed",
  STORY_STATUS_CHANGED: "story/status-changed",

  // Org events (Phase 4)
  ORG_SYNC_REQUESTED: "org/sync-requested",
  ORG_KNOWLEDGE_REFRESH: "org/knowledge-refresh-requested",
  ORG_INGESTION_REQUESTED: "org/ingestion-requested",
  ORG_SYNC_COMPLETED: "org/sync-completed",

  // Document events (Phase 5)
  DOCUMENT_GENERATION_REQUESTED: "document/generation-requested",
  DOCUMENT_GENERATION_COMPLETED: "document/generation-completed",

  // QA events (Phase 5)
  TEST_EXECUTION_RECORDED: "test-execution/recorded",
  DEFECT_CREATED: "defect/created",
  DEFECT_STATUS_CHANGED: "defect/status-changed",

  // Jira events (Phase 5)
  JIRA_SYNC_REQUESTED: "jira/sync-requested",
  JIRA_SYNC_COMPLETED: "jira/sync-completed",
  JIRA_SYNC_FAILED: "jira/sync-failed",

  // Project lifecycle events (Phase 5)
  PROJECT_ARCHIVED: "project/archived",
  PROJECT_REACTIVATED: "project/reactivated",

  // PM Dashboard events (Phase 5)
  PM_DASHBOARD_SYNTHESIS_REQUESTED: "pm-dashboard/synthesis-requested",
} as const
