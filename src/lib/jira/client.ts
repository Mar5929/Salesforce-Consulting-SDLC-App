import { Version3Client } from "jira.js"
import { decrypt } from "@/lib/encryption"
import type { JiraConfig } from "@/generated/prisma"

export type JiraClientConfig = {
  instanceUrl: string
  email: string
  apiToken: string
  jiraProjectKey: string
}

/**
 * Create a Jira V3 client from an encrypted JiraConfig.
 * Decrypts the API token using the per-project derived key (HKDF-SHA256).
 * T-05-16: Token never returned in plain text to client.
 */
export async function createJiraClient(
  config: JiraConfig
): Promise<Version3Client> {
  const apiToken = await decrypt(config.encryptedToken, config.projectId)

  return new Version3Client({
    host: config.instanceUrl,
    authentication: {
      basic: { email: config.email, apiToken },
    },
  })
}
