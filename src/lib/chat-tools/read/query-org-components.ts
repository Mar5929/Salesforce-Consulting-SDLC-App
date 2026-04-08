import { tool } from "ai"
import { z } from "zod"
import { scopedPrisma } from "@/lib/project-scope"

export function queryOrgComponentsTools(projectId: string) {
  const scoped = scopedPrisma(projectId)

  return {
    query_org_components: tool({
      description: "Search for Salesforce org components. Returns summary fields. Use get_org_component for full details.",
      inputSchema: z.object({
        componentType: z.enum([
          "OBJECT", "FIELD", "APEX_CLASS", "APEX_TRIGGER", "FLOW", "PROCESS_BUILDER",
          "WORKFLOW_RULE", "VALIDATION_RULE", "LWC", "AURA", "PERMISSION_SET", "PROFILE",
          "PERMISSION_SET_GROUP", "CONNECTED_APP", "NAMED_CREDENTIAL", "REMOTE_SITE_SETTING",
          "PLATFORM_EVENT", "CUSTOM_METADATA_TYPE", "RECORD_TYPE", "PAGE_LAYOUT",
          "INSTALLED_PACKAGE", "OTHER",
        ]).optional(),
        status: z.enum(["EXISTING", "PLANNED", "DEPRECATED"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ componentType, status, limit }) => {
        try {
          const components = await scoped.orgComponent.findMany({
            where: {
              ...(componentType && { componentType }),
              ...(status && { componentStatus: status }),
            },
            select: {
              id: true,
              apiName: true,
              componentType: true,
              componentStatus: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
          return { success: true, count: components.length, components }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),

    get_org_component: tool({
      description: "Get full details of a single org component by ID.",
      inputSchema: z.object({
        componentId: z.string().describe("The org component ID"),
      }),
      execute: async ({ componentId }) => {
        try {
          const component = await scoped.orgComponent.findUnique({
            where: { id: componentId },
          })
          if (!component) return { success: false, error: "Org component not found" }
          return { success: true, component }
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : "Query failed" }
        }
      },
    }),
  }
}
