import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface EmptyStateProps {
  heading: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({
  heading,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <h2 className="text-[18px] font-semibold text-foreground">
            {heading}
          </h2>
          <p className="text-[14px] text-muted-foreground">{description}</p>
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="mt-2 inline-flex h-8 items-center justify-center rounded-lg bg-[#2563EB] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
            >
              {actionLabel}
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
