import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const clerkUserId = await requireAuth()

    const memberships = await prisma.projectMember.findMany({
      where: { clerkUserId, status: "ACTIVE" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clientName: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    })

    const projects = memberships.map((m) => m.project)

    return NextResponse.json(projects)
  } catch {
    return NextResponse.json([], { status: 401 })
  }
}
