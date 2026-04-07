"use client"

/**
 * Question Detail Component
 *
 * Full question detail view with status/priority badges, answer section,
 * impact assessment collapsible, linked entities, and SA review flagging.
 * Layout follows UI-SPEC Question Detail View.
 */

import { useState } from "react"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { format } from "date-fns"
import { ArrowLeft, Flag } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { answerQuestion, flagForReview } from "@/actions/questions"
import { ImpactAssessment } from "./impact-assessment"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface LinkedStory {
  story: { id: string; displayId: string; title: string }
}
interface LinkedEpic {
  epic: { id: string; prefix: string; name: string }
}
interface LinkedFeature {
  feature: { id: string; prefix: string; name: string }
}
interface LinkedDecision {
  decision: { id: string; displayId: string; title: string }
}

interface QuestionDetailData {
  id: string
  projectId: string
  displayId: string
  questionText: string
  scope: string
  priority: string
  status: string
  needsReview: boolean
  reviewReason?: string | null
  answerText?: string | null
  answeredDate?: string | Date | null
  impactAssessment?: string | null
  confidence: string
  createdAt: string | Date
  owner?: { id: string; displayName: string; email: string } | null
  answeredBy?: { id: string; displayName: string; email: string } | null
  scopeEpic?: { id: string; prefix: string; name: string } | null
  scopeFeature?: { id: string; prefix: string; name: string } | null
  questionBlocksStories?: LinkedStory[]
  questionBlocksEpics?: LinkedEpic[]
  questionBlocksFeatures?: LinkedFeature[]
  decisionQuestions?: LinkedDecision[]
}

interface QuestionDetailProps {
  question: QuestionDetailData
  currentMemberRole?: string
}

// ────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  ANSWERED: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  PARKED: "bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]",
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-[#F5F5F5] text-[#737373]",
  MEDIUM: "bg-[#FFF7ED] text-[#EA580C]",
  HIGH: "bg-[#FEF2F2] text-[#DC2626]",
  CRITICAL: "bg-[#FEF2F2] text-[#DC2626] font-semibold",
}

const SCOPE_LABELS: Record<string, string> = {
  ENGAGEMENT: "Engagement",
  EPIC: "Epic",
  FEATURE: "Feature",
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function QuestionDetail({ question, currentMemberRole }: QuestionDetailProps) {
  const [showAnswerForm, setShowAnswerForm] = useState(false)
  const [answerText, setAnswerText] = useState("")
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewReason, setReviewReason] = useState("")

  const isSA = currentMemberRole === "SOLUTION_ARCHITECT"

  const { execute: submitAnswer, isExecuting: isAnswering } = useAction(answerQuestion, {
    onSuccess: () => {
      toast.success("Answer submitted")
      setShowAnswerForm(false)
      setAnswerText("")
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to submit answer")
    },
  })

  const { execute: submitFlag, isExecuting: isFlagging } = useAction(flagForReview, {
    onSuccess: () => {
      toast.success("Question flagged for review")
      setShowReviewForm(false)
      setReviewReason("")
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to flag for review")
    },
  })

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const hasLinkedEntities =
    (question.questionBlocksStories?.length ?? 0) > 0 ||
    (question.questionBlocksEpics?.length ?? 0) > 0 ||
    (question.questionBlocksFeatures?.length ?? 0) > 0 ||
    (question.decisionQuestions?.length ?? 0) > 0

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href={`/projects/${question.projectId}/questions`}
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-[#737373] hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Questions
      </Link>

      {/* Header: Status + Priority + ID */}
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn("text-[12px]", STATUS_STYLES[question.status])}
        >
          {question.status}
        </Badge>
        <Badge
          variant="outline"
          className={cn("text-[12px]", PRIORITY_STYLES[question.priority])}
        >
          {question.priority}
        </Badge>
        <span className="font-mono text-[13px] text-[#737373]">
          {question.displayId}
        </span>
        {question.needsReview && (
          <Badge variant="outline" className="bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA] text-[11px]">
            Needs Review
          </Badge>
        )}
      </div>

      {/* Question title */}
      <h1 className="mt-3 text-[18px] font-semibold leading-snug text-foreground">
        {question.questionText}
      </h1>

      {/* Metadata row */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-[#737373]">
        <span>Scope: {SCOPE_LABELS[question.scope] ?? question.scope}</span>

        {question.scopeEpic && (
          <span>
            Epic: {question.scopeEpic.prefix} - {question.scopeEpic.name}
          </span>
        )}
        {question.scopeFeature && (
          <span>
            Feature: {question.scopeFeature.prefix} - {question.scopeFeature.name}
          </span>
        )}

        {question.owner && (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px]">
                {getInitials(question.owner.displayName || question.owner.email)}
              </AvatarFallback>
            </Avatar>
            <span>{question.owner.displayName || question.owner.email}</span>
          </div>
        )}

        <span>Created {format(new Date(question.createdAt), "MMM d, yyyy")}</span>
      </div>

      {/* Review warning */}
      {question.needsReview && question.reviewReason && (
        <div className="mt-4 rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3">
          <p className="text-[13px] font-semibold text-[#EA580C]">Flagged for Review</p>
          <p className="mt-1 text-[13px] text-[#9A3412]">{question.reviewReason}</p>
        </div>
      )}

      <Separator className="my-6" />

      {/* Answer section */}
      <div>
        <h2 className="text-[16px] font-semibold text-foreground">Answer</h2>

        {question.answerText ? (
          <div className="mt-3">
            <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap">
              {question.answerText}
            </p>

            {question.answeredBy && (
              <div className="mt-3 flex items-center gap-2 text-[13px] text-[#737373]">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px]">
                    {getInitials(question.answeredBy.displayName || question.answeredBy.email)}
                  </AvatarFallback>
                </Avatar>
                <span>
                  Answered by {question.answeredBy.displayName || question.answeredBy.email}
                  {question.answeredDate && (
                    <> on {format(new Date(question.answeredDate), "MMM d, yyyy")}</>
                  )}
                </span>
              </div>
            )}

            {/* Impact Assessment */}
            <ImpactAssessment data={question.impactAssessment ?? null} />

            {/* SA: Flag for Review button */}
            {isSA && question.status === "ANSWERED" && !question.needsReview && (
              <div className="mt-4">
                {!showReviewForm ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReviewForm(true)}
                    className="text-[#EA580C] border-[#FED7AA] hover:bg-[#FFF7ED]"
                  >
                    <Flag className="mr-1 h-3.5 w-3.5" />
                    Flag for Review
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2 rounded-lg border border-[#E5E5E5] p-3">
                    <Textarea
                      placeholder="Why does this answer need review?"
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowReviewForm(false)
                          setReviewReason("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={!reviewReason.trim() || isFlagging}
                        onClick={() =>
                          submitFlag({
                            projectId: question.projectId,
                            questionId: question.id,
                            reviewReason,
                          })
                        }
                        className="bg-[#EA580C] text-white hover:bg-[#C2410C]"
                      >
                        {isFlagging ? "Flagging..." : "Flag"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-[14px] text-[#737373]">Not yet answered</p>

            {!showAnswerForm ? (
              <Button
                className="mt-3 bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                onClick={() => setShowAnswerForm(true)}
              >
                Answer
              </Button>
            ) : (
              <div className="mt-3 flex flex-col gap-2 rounded-lg border border-[#E5E5E5] p-3">
                <Textarea
                  placeholder="Type your answer..."
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAnswerForm(false)
                      setAnswerText("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!answerText.trim() || isAnswering}
                    onClick={() =>
                      submitAnswer({
                        projectId: question.projectId,
                        questionId: question.id,
                        answerText,
                      })
                    }
                    className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                  >
                    {isAnswering ? "Submitting..." : "Submit Answer"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Linked entities */}
      {hasLinkedEntities && (
        <>
          <Separator className="my-6" />
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">Linked Entities</h2>

            <div className="mt-3 flex flex-col gap-2">
              {question.questionBlocksStories?.map((link) => (
                <div key={link.story.id} className="flex items-center gap-2 text-[13px]">
                  <Badge variant="outline" className="text-[10px]">Story</Badge>
                  <span className="font-mono text-[#737373]">{link.story.displayId}</span>
                  <span>{link.story.title}</span>
                </div>
              ))}

              {question.questionBlocksEpics?.map((link) => (
                <div key={link.epic.id} className="flex items-center gap-2 text-[13px]">
                  <Badge variant="outline" className="text-[10px]">Epic</Badge>
                  <span className="font-mono text-[#737373]">{link.epic.prefix}</span>
                  <span>{link.epic.name}</span>
                </div>
              ))}

              {question.questionBlocksFeatures?.map((link) => (
                <div key={link.feature.id} className="flex items-center gap-2 text-[13px]">
                  <Badge variant="outline" className="text-[10px]">Feature</Badge>
                  <span className="font-mono text-[#737373]">{link.feature.prefix}</span>
                  <span>{link.feature.name}</span>
                </div>
              ))}

              {question.decisionQuestions?.map((link) => (
                <div key={link.decision.id} className="flex items-center gap-2 text-[13px]">
                  <Badge variant="outline" className="text-[10px]">Decision</Badge>
                  <span className="font-mono text-[#737373]">{link.decision.displayId}</span>
                  <span>{link.decision.title}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
