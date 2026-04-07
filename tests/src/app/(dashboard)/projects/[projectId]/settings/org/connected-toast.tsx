"use client"

import { useEffect } from "react"
import { toast } from "sonner"

/**
 * Client component that triggers a success toast when the OAuth flow completes.
 * Rendered conditionally when ?connected=true is in the URL.
 */
export function OrgConnectedToast() {
  useEffect(() => {
    toast.success("Salesforce org connected successfully")
  }, [])

  return null
}
