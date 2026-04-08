"use client"

import { useEffect } from "react"
import { toast } from "sonner"

/**
 * Client component that triggers an error toast when an OAuth flow fails
 * and the user is redirected without a project context.
 * Rendered conditionally when ?error=oauth_failed is in the URL.
 */
export function OAuthErrorToast() {
  useEffect(() => {
    toast.error("Salesforce authorization failed. Please try again.")
  }, [])

  return null
}
