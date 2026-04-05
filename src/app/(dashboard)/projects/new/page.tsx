import { CreateWizard } from "@/components/projects/create-wizard"

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="text-[24px] font-semibold text-foreground">
        Create Project
      </h1>
      <div className="mt-8">
        <CreateWizard />
      </div>
    </div>
  )
}
