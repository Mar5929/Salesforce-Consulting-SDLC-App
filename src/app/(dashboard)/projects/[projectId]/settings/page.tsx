import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectSettingsForm } from "@/components/projects/project-settings-form"

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

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-foreground">Settings</h1>

      <div className="mt-6">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="mt-4">
            <div className="max-w-[560px]">
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
