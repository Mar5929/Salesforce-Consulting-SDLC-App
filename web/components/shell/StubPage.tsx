// Tiny placeholder used by Wave 1B's stub pages until Wave 2 fills them in.
// Server-safe.

import { Card } from "@/components/primitives";

export interface StubPageProps {
  title: string;
}

export function StubPage({ title }: StubPageProps) {
  return (
    <div className="grid h-full place-items-center">
      <Card className="text-center">
        <div className="text-[18px] font-semibold tracking-[-0.015em] text-ink">
          {title}
        </div>
        <div className="mt-[6px] text-[12.5px] text-muted">coming in Wave 2</div>
      </Card>
    </div>
  );
}
