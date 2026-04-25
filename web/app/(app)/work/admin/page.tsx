// Work › Admin Tasks
// Source: visuals/claude-design-exports/salesforce-consulting-sdlc-app/project/work.jsx
// `AdminTasks` component (lines 85-115).

import {
  Avatar,
  Button,
  Card,
  Chip,
  Icon,
  Table,
  TD,
  TH,
  TR,
} from "@/components/primitives";
import { DATA } from "@/lib/data";
import type { AdminTaskStatus } from "@/lib/types";

function StatusChipInline({ status }: { status: AdminTaskStatus }) {
  if (status === "Done") return <Chip tone="green">Done</Chip>;
  if (status === "In Progress") return <Chip tone="amber">In Progress</Chip>;
  return <Chip tone="gray">Open</Chip>;
}

export default function AdminTasksPage() {
  return (
    <>
      <div className="mb-[10px] flex items-center gap-[10px]">
        <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          Admin tasks
        </h2>
        <div className="ml-auto flex gap-[6px]">
          <Button>Filter</Button>
          <Button
            variant="primary"
            iconLeft={<Icon name="plus" size={12} color="#ffffff" />}
          >
            New task
          </Button>
        </div>
      </div>

      <Card className="!p-0">
        <Table>
          <thead>
            <tr>
              <TH>Title</TH>
              <TH>Owner</TH>
              <TH>Due</TH>
              <TH>Status</TH>
              <TH>Created</TH>
            </tr>
          </thead>
          <tbody>
            {DATA.adminTasks.map((t) => {
              const member = DATA.team.find((m) => m.id === t.owner);
              return (
                <TR key={t.id}>
                  <TD className="font-medium text-ink">{t.title}</TD>
                  <TD>
                    <div className="flex items-center gap-[6px]">
                      <Avatar person={t.owner} size="xs" />
                      <span>{member?.name}</span>
                    </div>
                  </TD>
                  <TD className="font-mono text-sm">{t.due}</TD>
                  <TD>
                    <StatusChipInline status={t.status} />
                  </TD>
                  <TD className="text-sm text-muted-2">Apr 10</TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
