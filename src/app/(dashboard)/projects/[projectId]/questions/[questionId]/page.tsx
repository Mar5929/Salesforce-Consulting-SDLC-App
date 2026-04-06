/**
 * Question Detail Page
 *
 * Server component that loads a single question with all linked entities
 * and renders the QuestionDetail component.
 */

import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { getCurrentMember } from "@/lib/auth"
import { QuestionDetail } from "@/components/questions/question-detail"

interface QuestionDetailPageProps {
  params: Promise<{ projectId: string; questionId: string }>
}

export default async function QuestionDetailPage({ params }: QuestionDetailPageProps) {
  const { projectId, questionId } = await params

  const member = await getCurrentMember(projectId)

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      owner: { select: { id: true, displayName: true, email: true } },
      answeredBy: { select: { id: true, displayName: true, email: true } },
      scopeEpic: { select: { id: true, prefix: true, name: true } },
      scopeFeature: { select: { id: true, prefix: true, name: true } },
      questionBlocksStories: {
        include: { story: { select: { id: true, displayId: true, title: true } } },
      },
      questionBlocksEpics: {
        include: { epic: { select: { id: true, prefix: true, name: true } } },
      },
      questionBlocksFeatures: {
        include: { feature: { select: { id: true, prefix: true, name: true } } },
      },
      decisionQuestions: {
        include: { decision: { select: { id: true, displayId: true, title: true } } },
      },
    },
  })

  if (!question || question.projectId !== projectId) {
    notFound()
  }

  return (
    <QuestionDetail
      question={JSON.parse(JSON.stringify(question))}
      currentMemberRole={member.role}
    />
  )
}
