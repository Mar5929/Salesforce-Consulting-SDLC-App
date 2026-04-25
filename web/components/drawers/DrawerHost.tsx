"use client";

// DrawerHost — reads useDrawer() and renders the correct drawer for the
// active type. Each real drawer accepts (open, onClose) and pulls its own
// payload-shaped props off the typed context payload.

import { useDrawer, type DrawerPayloadMap } from "@/lib/context";
import { WorkItemDrawer } from "./WorkItemDrawer";
import { QuestionDrawer } from "./QuestionDrawer";
import { ReproposalDrawer } from "./ReproposalDrawer";
import { ReadinessDrawer } from "./ReadinessDrawer";

export function DrawerHost() {
  const { type, payload, closeDrawer } = useDrawer();
  if (type === null) return null;

  switch (type) {
    case "workItem": {
      const p = payload as DrawerPayloadMap["workItem"];
      return <WorkItemDrawer open onClose={closeDrawer} id={p.id} />;
    }
    case "question": {
      const p = payload as DrawerPayloadMap["question"];
      return <QuestionDrawer open onClose={closeDrawer} id={p.id} />;
    }
    case "reproposal": {
      return <ReproposalDrawer open onClose={closeDrawer} />;
    }
    case "readiness": {
      const p = payload as DrawerPayloadMap["readiness"];
      return (
        <ReadinessDrawer
          open
          onClose={closeDrawer}
          score={p.score}
          subject={p.subject}
        />
      );
    }
    default: {
      // Exhaustiveness check
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export default DrawerHost;
