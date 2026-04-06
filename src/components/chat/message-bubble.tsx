"use client"

import { cn } from "@/lib/utils"

interface TokenUsage {
  input: number
  output: number
}

interface MessageBubbleProps {
  role: "user" | "assistant" | "system"
  content: string
  tokenUsage?: TokenUsage
  cost?: number
}

function formatCost(cost: number): string {
  return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`
}

function formatTokens(count: number): string {
  return count.toLocaleString()
}

export function MessageBubble({
  role,
  content,
  tokenUsage,
  cost,
}: MessageBubbleProps) {
  if (role === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="text-muted-foreground text-[13px] font-normal">
          {content}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex w-full",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-3",
          role === "user"
            ? "bg-muted text-foreground"
            : "border-border bg-background text-foreground border-l-2"
        )}
      >
        {role === "assistant" ? (
          <div className="prose prose-sm max-w-none text-[14px] leading-[1.5]">
            {content.split("\n").map((line, i) => {
              if (!line.trim()) return <br key={i} />
              if (line.startsWith("# "))
                return (
                  <h1
                    key={i}
                    className="mb-2 mt-4 text-[18px] font-semibold first:mt-0"
                  >
                    {line.slice(2)}
                  </h1>
                )
              if (line.startsWith("## "))
                return (
                  <h2
                    key={i}
                    className="mb-2 mt-3 text-[16px] font-semibold first:mt-0"
                  >
                    {line.slice(3)}
                  </h2>
                )
              if (line.startsWith("### "))
                return (
                  <h3
                    key={i}
                    className="mb-1 mt-2 text-[14px] font-semibold first:mt-0"
                  >
                    {line.slice(4)}
                  </h3>
                )
              if (line.startsWith("- ") || line.startsWith("* "))
                return (
                  <li key={i} className="ml-4 list-disc">
                    {line.slice(2)}
                  </li>
                )
              if (line.startsWith("```"))
                return (
                  <code
                    key={i}
                    className="bg-muted block rounded p-2 text-[13px]"
                  >
                    {line.slice(3)}
                  </code>
                )
              if (line.match(/^\d+\. /))
                return (
                  <li key={i} className="ml-4 list-decimal">
                    {line.replace(/^\d+\. /, "")}
                  </li>
                )
              return <p key={i}>{renderInlineMarkdown(line)}</p>
            })}
          </div>
        ) : (
          <p className="text-[14px] leading-[1.5]">{content}</p>
        )}

        {/* Token/cost footer for AI messages (D-15) */}
        {role === "assistant" && tokenUsage && (
          <div className="text-muted-foreground mt-2 text-[13px] font-normal">
            tokens: {formatTokens(tokenUsage.input + tokenUsage.output)}
            {cost != null && ` | ${formatCost(cost)}`}
          </div>
        )}
      </div>
    </div>
  )
}

/** Simple inline markdown rendering for bold, italic, and code */
function renderInlineMarkdown(text: string): React.ReactNode {
  // Split on bold (**text**), italic (*text*), and inline code (`text`)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="bg-muted rounded px-1 text-[13px]">
          {part.slice(1, -1)}
        </code>
      )
    return part
  })
}
