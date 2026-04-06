"use client"

interface TokenDisplayProps {
  totalTokens: number
  totalCost: number
}

function formatCost(cost: number): string {
  return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`
}

export function TokenDisplay({ totalTokens, totalCost }: TokenDisplayProps) {
  if (totalTokens === 0) return null

  return (
    <span className="text-muted-foreground text-[13px] font-normal">
      Session total: {totalTokens.toLocaleString()} tokens / {formatCost(totalCost)}
    </span>
  )
}
