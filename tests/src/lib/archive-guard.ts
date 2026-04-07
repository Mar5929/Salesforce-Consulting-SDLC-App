/**
 * Archive Guard
 *
 * Prevents mutations on archived projects.
 * Must be called before any write operation on project-scoped data.
 *
 * Per T-05-03 threat mitigation.
 */

import { prisma } from "./db"

export async function assertProjectNotArchived(
  projectId: string
): Promise<void> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { status: true },
  })
  if (project.status === "ARCHIVED") {
    throw new Error(
      "This project is archived. Reactivate to make changes."
    )
  }
}
