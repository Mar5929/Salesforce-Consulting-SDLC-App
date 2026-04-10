"use client"

/**
 * Generation Dialog
 *
 * Configuration dialog for document generation with section checkboxes,
 * scope selector, and format selection. Transitions to progress view
 * after generation starts.
 *
 * Threat mitigations:
 * - T-05-13: Generate button disabled during active generation (DoS prevention)
 */

import { useState, useCallback } from "react"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { requestDocumentGeneration } from "@/actions/documents"
import type { DocumentTemplate, TemplateSection } from "@/lib/documents/templates/types"
import type { DocumentFormat } from "@/generated/prisma"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GenerationProgress } from "./generation-progress"

type DialogState = "configuring" | "generating" | "complete"

interface GenerationDialogProps {
  template: DocumentTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  epics: Array<{ id: string; title: string }>
}

const FORMAT_LABELS: Record<string, string> = {
  DOCX: "Word",
  PPTX: "PowerPoint",
  PDF: "PDF",
}

export function GenerationDialog({
  template,
  open,
  onOpenChange,
  projectId,
  epics,
}: GenerationDialogProps) {
  const [dialogState, setDialogState] = useState<DialogState>("configuring")
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set()
  )
  const [selectedFormat, setSelectedFormat] = useState<DocumentFormat>("DOCX")
  const [scopeEpicId, setScopeEpicId] = useState<string>("all")

  // Initialize sections when template changes
  const initSections = useCallback(
    (tmpl: DocumentTemplate) => {
      const required = new Set(
        tmpl.sections.filter((s) => s.required).map((s) => s.id)
      )
      setSelectedSections(required)
      setSelectedFormat(tmpl.supportedFormats[0] ?? "DOCX")
      setDialogState("configuring")
      setScopeEpicId("all")
    },
    []
  )

  // Track previous template to detect changes
  const [prevTemplateId, setPrevTemplateId] = useState<string | null>(null)
  if (template && template.id !== prevTemplateId) {
    setPrevTemplateId(template.id)
    initSections(template)
  }

  const { execute: executeGeneration, isExecuting } = useAction(
    requestDocumentGeneration,
    {
      onSuccess: () => {
        setDialogState("generating")
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Failed to start generation")
      },
    }
  )

  const handleSectionToggle = useCallback(
    (sectionId: string, checked: boolean) => {
      setSelectedSections((prev) => {
        const next = new Set(prev)
        if (checked) {
          next.add(sectionId)
        } else {
          next.delete(sectionId)
        }
        return next
      })
    },
    []
  )

  const handleGenerate = useCallback(() => {
    if (!template) return
    executeGeneration({
      projectId,
      templateId: template.id,
      sectionIds: Array.from(selectedSections),
      format: selectedFormat,
    })
  }, [template, projectId, selectedSections, selectedFormat, executeGeneration])

  const handleComplete = useCallback(() => {
    setDialogState("complete")
    setTimeout(() => {
      onOpenChange(false)
      setDialogState("configuring")
    }, 2000)
  }, [onOpenChange])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setDialogState("configuring")
      }
      onOpenChange(newOpen)
    },
    [onOpenChange]
  )

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {dialogState === "configuring" && (
          <>
            <DialogHeader>
              <DialogTitle>Generate {template.name}</DialogTitle>
              <DialogDescription>
                Configure sections and format for your document.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Section checkboxes */}
              <div className="space-y-3">
                <Label className="text-[14px] font-medium">
                  Sections to Include
                </Label>
                {template.sections.map((section: TemplateSection) => {
                  const isRequired = section.required
                  const isChecked = selectedSections.has(section.id)
                  return (
                    <div
                      key={section.id}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked: boolean) =>
                          handleSectionToggle(section.id, checked)
                        }
                        disabled={isRequired}
                        id={`section-${section.id}`}
                      />
                      <Label
                        htmlFor={`section-${section.id}`}
                        className="text-[14px] font-normal cursor-pointer"
                      >
                        {section.label}
                        {isRequired && (
                          <span className="text-muted-foreground ml-1">
                            (required)
                          </span>
                        )}
                      </Label>
                    </div>
                  )
                })}
              </div>

              {/* Scope selector */}
              {epics.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[14px] font-medium">Scope</Label>
                  <Select value={scopeEpicId} onValueChange={(v) => setScopeEpicId(v ?? "all")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope">
                        {(value: string) => {
                          if (value === "all") return "All Epics"
                          const e = epics.find((ep) => ep.id === value)
                          return e ? e.title : value
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Epics</SelectItem>
                      {epics.map((epic) => (
                        <SelectItem key={epic.id} value={epic.id}>
                          {epic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Format selector */}
              <div className="space-y-2">
                <Label className="text-[14px] font-medium">Format</Label>
                <div className="flex gap-2">
                  {template.supportedFormats.map((fmt) => (
                    <Button
                      key={fmt}
                      variant={
                        selectedFormat === fmt ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedFormat(fmt)}
                      className={
                        selectedFormat === fmt
                          ? "bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
                          : ""
                      }
                    >
                      {FORMAT_LABELS[fmt] ?? fmt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
                onClick={handleGenerate}
                disabled={isExecuting || selectedSections.size === 0}
              >
                {isExecuting ? "Starting..." : "Generate Document"}
              </Button>
            </DialogFooter>
          </>
        )}

        {(dialogState === "generating" || dialogState === "complete") && (
          <GenerationProgress
            templateName={template.name}
            templateId={template.id}
            sections={template.sections
              .filter((s) => selectedSections.has(s.id))
              .map((s) => s.label)}
            projectId={projectId}
            onComplete={handleComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
