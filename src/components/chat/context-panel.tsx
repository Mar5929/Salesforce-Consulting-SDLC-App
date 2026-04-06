"use client"

import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RelatedEntity {
  id: string
  type: "question" | "decision" | "transcript"
  title: string
  href: string
}

interface ContextPanelProps {
  title: string
  relatedEntities?: RelatedEntity[]
  tokenUsage: {
    promptTokens: number
    responseTokens: number
    sessionTotal: number
    cost: number
  }
}

function formatCost(cost: number): string {
  return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`
}

/**
 * Right panel for task-specific chat sessions (D-14).
 * Shows related entities and token usage breakdown.
 * Fixed 320px width per UI-SPEC.
 */
export function ContextPanel({
  title,
  relatedEntities = [],
  tokenUsage,
}: ContextPanelProps) {
  return (
    <aside className="border-border flex w-[320px] shrink-0 flex-col border-l">
      <div className="border-border border-b px-4 py-3">
        <h3 className="text-[14px] font-semibold">{title}</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Related Entities Section */}
          <div className="mb-4">
            <h4 className="text-muted-foreground mb-2 text-[13px] font-semibold uppercase tracking-wider">
              Related Entities
            </h4>
            {relatedEntities.length === 0 ? (
              <p className="text-muted-foreground text-[13px]">
                No related entities
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {relatedEntities.map((entity) => (
                  <li key={entity.id}>
                    <a
                      href={entity.href}
                      className="text-primary text-[13px] hover:underline"
                    >
                      {entity.title}
                    </a>
                    <span className="text-muted-foreground ml-1 text-[12px]">
                      ({entity.type})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Separator className="my-3" />

          {/* Token Usage Section */}
          <div>
            <h4 className="text-muted-foreground mb-2 text-[13px] font-semibold uppercase tracking-wider">
              Token Usage
            </h4>
            <dl className="flex flex-col gap-1 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Prompt</dt>
                <dd className="font-mono">
                  {tokenUsage.promptTokens.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Response</dt>
                <dd className="font-mono">
                  {tokenUsage.responseTokens.toLocaleString()}
                </dd>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Session</dt>
                <dd className="font-mono">
                  {tokenUsage.sessionTotal.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Cost</dt>
                <dd className="font-mono">
                  {formatCost(tokenUsage.cost)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
