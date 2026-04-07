import { createSafeActionClient } from "next-safe-action"
import { auth } from "@clerk/nextjs/server"

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Action error:", e.message)
    return e.message
  },
}).use(async ({ next }) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  return next({ ctx: { userId } })
})
