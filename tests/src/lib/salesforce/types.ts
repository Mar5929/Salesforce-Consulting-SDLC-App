export type SfConnectionStatus =
  | "connected"
  | "disconnected"
  | "needs_reauthorization"
  | "syncing"
  | "sync_failed"

export interface SfOrgInfo {
  instanceUrl: string
  status: SfConnectionStatus
  lastSyncedAt: Date | null
  componentCount: number
}

export interface MetadataTypeConfig {
  type: string
  describeFields: boolean // Whether to describe individual fields (only for CustomObject)
}

export const SUPPORTED_METADATA_TYPES: MetadataTypeConfig[] = [
  { type: "CustomObject", describeFields: true },
  { type: "ApexClass", describeFields: false },
  { type: "ApexTrigger", describeFields: false },
  { type: "LightningComponentBundle", describeFields: false },
  { type: "Flow", describeFields: false },
  { type: "PermissionSet", describeFields: false },
  { type: "Profile", describeFields: false },
  { type: "CustomLabel", describeFields: false },
  { type: "CustomSetting", describeFields: false },
  { type: "CustomMetadata", describeFields: false },
]
