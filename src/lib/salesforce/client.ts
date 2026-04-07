import jsforce, { Connection } from "jsforce"
import { prisma } from "@/lib/db"
import { decrypt, encrypt } from "@/lib/encryption"

/**
 * Create an authenticated jsforce Connection for a project's Salesforce org.
 * Decrypts stored tokens and registers a refresh handler that re-encrypts
 * and persists the new access token when Salesforce rotates it.
 *
 * @param projectId - Project whose SF org credentials to use
 * @returns Authenticated Connection
 * @throws Error if project has no SF org connected
 */
export async function getSalesforceConnection(
  projectId: string
): Promise<Connection> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: {
      sfOrgInstanceUrl: true,
      sfOrgAccessToken: true,
      sfOrgRefreshToken: true,
    },
  })

  if (!project.sfOrgInstanceUrl || !project.sfOrgAccessToken) {
    throw new Error(`Project ${projectId} has no Salesforce org connected`)
  }

  const accessToken = await decrypt(project.sfOrgAccessToken, projectId)
  const refreshToken = project.sfOrgRefreshToken
    ? await decrypt(project.sfOrgRefreshToken, projectId)
    : undefined

  const oauth2 = new jsforce.OAuth2({
    clientId: process.env.SF_CONNECTED_APP_CLIENT_ID!,
    clientSecret: process.env.SF_CONNECTED_APP_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`,
  })

  const conn = new Connection({
    oauth2,
    instanceUrl: project.sfOrgInstanceUrl,
    accessToken,
    refreshToken,
  })

  // Register refresh handler to persist new access token when SF rotates it
  conn.on("refresh", async (newAccessToken: string) => {
    try {
      const encryptedToken = await encrypt(newAccessToken, projectId)
      await prisma.project.update({
        where: { id: projectId },
        data: { sfOrgAccessToken: encryptedToken },
      })
    } catch (error) {
      console.error(
        `Failed to persist refreshed SF token for project ${projectId}:`,
        error
      )
    }
  })

  return conn
}
