"use client"

/**
 * Component Selector (D-08)
 *
 * Inline multi-entry widget for attaching Salesforce components to a story.
 * Each entry has: componentName (free-text) and impactType (CREATE, MODIFY, DELETE).
 * Controlled component used inside story-form.tsx.
 */

import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type ImpactType = "CREATE" | "MODIFY" | "DELETE"

export interface ComponentEntry {
  componentName: string
  impactType: ImpactType
}

interface ComponentSelectorProps {
  value: ComponentEntry[]
  onChange: (value: ComponentEntry[]) => void
}

// ────────────────────────────────────────────
// Impact type styling
// ────────────────────────────────────────────

const IMPACT_LABELS: Record<ImpactType, string> = {
  CREATE: "Create",
  MODIFY: "Modify",
  DELETE: "Delete",
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function ComponentSelector({ value, onChange }: ComponentSelectorProps) {
  function addEntry() {
    onChange([...value, { componentName: "", impactType: "MODIFY" }])
  }

  function removeEntry(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function updateEntry(index: number, field: keyof ComponentEntry, val: string) {
    const updated = value.map((entry, i) =>
      i === index ? { ...entry, [field]: val } : entry
    )
    onChange(updated)
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder="e.g. Account, Lead, Custom_Object__c"
            value={entry.componentName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEntry(index, "componentName", e.target.value)}
            className="flex-1"
          />
          <Select
            value={entry.impactType}
            onValueChange={(v: string | null) => v && updateEntry(index, "impactType", v)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue>
                {(value: string) => IMPACT_LABELS[value as ImpactType] ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(IMPACT_LABELS) as ImpactType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {IMPACT_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-red-600"
            onClick={() => removeEntry(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit gap-1.5"
        onClick={addEntry}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Component
      </Button>
    </div>
  )
}
