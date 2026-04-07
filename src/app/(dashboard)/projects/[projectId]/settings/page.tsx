import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectSettingsForm } from "@/components/projects/project-settings-form"
import { JiraSettingsSection } from "./jira-settings-section"
import { ProjectLifecycleSection } from "./project-lifecycle-section"

interface SettingsPageProps {
  params: Promise<{ projectId: string }>
}

function formatDateForInput(date: Date | null): string {
  if (!date) return ""
  return date.toISOString().split("T")[0]
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    notFound()
  }

  // Fetch Jira config for this project
  const jiraConfig = await prisma.jiraConfig.findUnique({
    where: { projectId },
    select: {
      id: true,
      projectId: true,
      instanceUrl: true,
      email: true,
      jiraProjectKey: true,
      enabled: true,
      createdAt: true,
      updatedAt: true,
      // encryptedToken intentionally excluded (T-05-20)
    },
  })

  // Count failed syncs for retry button
  const failedSyncCount = jiraConfig
    ? await prisma.jiraSyncRecord.count({
        where: { projectId, status: "FAILED" },
      })
    : 0

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-foreground">Settings</h1>

      <div className="mt-6">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="mt-4">
            <div className="max-w-[560px] space-y-10">
              <ProjectSettingsForm
                projectId={projectId}
                defaultValues={{
                  name: project.name,
                  clientName: project.clientName,
                  engagementType: project.engagementType,
                  startDate: formatDateForInput(project.startDate),
                  targetEndDate: formatDateForInput(project.targetEndDate),
                  sandboxStrategy: "",
                }}
              />

              {/* Jira Integration section */}
              <JiraSettingsSection
                projectId={projectId}
                jiraConfig={jiraConfig}
                failedSyncCount={failedSyncCount}
              />

              {/* Project Lifecycle section */}
              <ProjectLifecycleSection
                projectId={projectId}
                projectStatus={project.status}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
