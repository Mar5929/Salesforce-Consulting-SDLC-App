"use client"

/**
 * Template Gallery
 *
 * Responsive grid of document template cards with Generate buttons.
 * Each card shows the template icon, name, description, and a generate action.
 */

import {
  FileText,
  Presentation,
  FileSpreadsheet,
  FileCheck,
  File,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { DocumentTemplate } from "@/lib/documents/templates/types"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Presentation,
  FileSpreadsheet,
  FileCheck,
  File,
}

interface TemplateGalleryProps {
  templates: DocumentTemplate[]
  onGenerate: (templateId: string) => void
}

export function TemplateGallery({
  templates,
  onGenerate,
}: TemplateGalleryProps) {
  if (templates.length === 0) {
    return (
      <p className="text-[14px] text-muted-foreground">
        No templates available
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => {
        const Icon = ICON_MAP[template.icon] ?? File
        return (
          <Card key={template.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Icon className="h-6 w-6 text-muted-foreground shrink-0" />
              <CardTitle className="text-[18px] font-semibold">
                {template.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-[14px] font-normal text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
                onClick={() => onGenerate(template.id)}
              >
                Generate Document
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
