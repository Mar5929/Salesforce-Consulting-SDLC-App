"use client"

import { UserButton, useUser } from "@clerk/nextjs"

export function UserMenu() {
  const { user } = useUser()

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <UserButton />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground">
          {user?.fullName ?? "User"}
        </p>
        <p className="truncate text-[13px] text-muted-foreground">
          {user?.primaryEmailAddress?.emailAddress ?? ""}
        </p>
      </div>
    </div>
  )
}
