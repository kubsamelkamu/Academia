"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, Upload, Clock3, CheckCircle2, AlertCircle } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useMilestoneTemplatesList } from "@/lib/hooks/use-milestone-templates"
import { useProjectMilestones, useStudentProjects } from "@/lib/hooks/use-student-milestones"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import { useMyGroupProposals } from "@/lib/hooks/use-project-proposals"
import {
  addDays,
  getActiveMilestoneTemplate,
  getLatestLinkedProposal,
  isProposalMilestoneName,
  normalizeMilestoneName,
  toProposalMilestoneState,
} from "@/lib/student-milestone-helpers"
import type { MilestoneTemplate } from "@/types/milestone-templates"
import type { ProposalProjectMilestone } from "@/types/project-proposals"

type MilestoneStatus = "pending" | "submitted" | "approved"

interface Milestone {
  id: string
  name: string
  dueDate: string
  status: MilestoneStatus
  submittedAt?: string
  sequence?: number
  latestSubmissionName?: string
  latestSubmissionId?: string
  latestSubmissionUrl?: string
  latestFeedbackMessage?: string
  latestFeedbackAttachmentName?: string
  latestFeedbackAttachmentUrl?: string
  approvedAt?: string
  approvedBy?: string
  canUploadFirst?: boolean
  canResubmit?: boolean
  waitingForReview?: boolean
  isApproved?: boolean
}

const myProject = {
  title: "AI-Driven Academic Assistant",
  milestones: [
    {
      id: "m1",
      name: "Project Proposal",
      dueDate: "2026-01-18",
      status: "approved",
      submittedAt: "2026-01-15",
    },
    {
      id: "m2",
      name: "Software Requirements Specification (SRS)",
      dueDate: "2026-02-05",
      status: "submitted",
      submittedAt: "2026-02-03",
    },
    {
      id: "m3",
      name: "System Design Document (SDD)",
      dueDate: "2026-03-20",
      status: "pending",
    },
    {
      id: "m4",
      name: "Implementation",
      dueDate: "2026-04-30",
      status: "pending",
    },
    {
      id: "m5",
      name: "Final Presentation",
      dueDate: "2026-05-30",
      status: "pending",
    },
  ] satisfies Milestone[],
}

function formatDate(date: string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString()
}

function milestoneStatusBadge(status: MilestoneStatus) {
  if (status === "approved") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    )
  }
  if (status === "submitted") {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        <Clock3 className="h-3 w-3 mr-1" />
        Submitted
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      <Clock3 className="h-3 w-3 mr-1" />
      Pending
    </Badge>
  )
}

function formatPersonName(firstName?: string | null, lastName?: string | null, email?: string | null) {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim() || email || "Advisor"
}

function mapBackendStatus(status: string): MilestoneStatus {
  const normalized = status.trim().toLowerCase()
  if (normalized === "approved" || normalized === "completed") return "approved"
  if (normalized === "submitted") return "submitted"
  return "pending"
}

function readProposalOverrideFromStorage(studentId: string | null): {
  status: MilestoneStatus
  submittedAt?: string
} | null {
  if (typeof window === "undefined") return null

  const host = window.location.host
  const candidateIds = [studentId?.trim() || "", "any", ""]

  for (const candidateId of candidateIds) {
    try {
      const storageKey = ["academia:proposal:lastSubmitted", host, candidateId].join(":")
      const raw = localStorage.getItem(storageKey)
      if (!raw) continue

      const parsed = JSON.parse(raw) as { status?: unknown; submittedAt?: unknown }
      const status = typeof parsed.status === "string" ? parsed.status : null
      const submittedAt = typeof parsed.submittedAt === "string" ? parsed.submittedAt : undefined
      if (status === "submitted" || status === "approved") {
        return { status, submittedAt }
      }
    } catch {
      // keep trying
    }
  }

  try {
    const prefix = `academia:proposal:lastSubmitted:${host}:`
    let best: { status: MilestoneStatus; submittedAt?: string; time: number } | null = null

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (!key || !key.startsWith(prefix)) continue

      const raw = localStorage.getItem(key)
      if (!raw) continue

      try {
        const parsed = JSON.parse(raw) as { status?: unknown; submittedAt?: unknown }
        const status = typeof parsed.status === "string" ? parsed.status : null
        const submittedAt = typeof parsed.submittedAt === "string" ? parsed.submittedAt : undefined
        if (status !== "submitted" && status !== "approved") continue

        const time = submittedAt ? Date.parse(submittedAt) : Number.NEGATIVE_INFINITY
        if (!best || (Number.isFinite(time) && time > best.time)) {
          best = { status, submittedAt, time: Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY }
        }
      } catch {
        // ignore malformed items
      }
    }

    if (best) return { status: best.status, submittedAt: best.submittedAt }
  } catch {
    // ignore localStorage scan failures
  }

  return null
}

export function StudentMilestonesPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const studentId = user?.id ?? null
  const myProjectGroupQuery = useMyProjectGroup(Boolean(accessToken))
  const myGroupProposalsQuery = useMyGroupProposals(Boolean(accessToken))
  const [proposalOverride, setProposalOverride] = useState<{
    status: MilestoneStatus
    submittedAt?: string
  } | null>(() => {
    return readProposalOverrideFromStorage(studentId)
  })

  useEffect(() => {
    const nextOverride = readProposalOverrideFromStorage(studentId)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (nextOverride) setProposalOverride(nextOverride)
  }, [studentId])

  const proposalMilestoneState = useMemo(() => {
    const fromBackend = toProposalMilestoneState(myGroupProposalsQuery.data)
    return fromBackend ?? proposalOverride
  }, [myGroupProposalsQuery.data, proposalOverride])

  const latestLinkedProposal = useMemo(
    () => getLatestLinkedProposal(myGroupProposalsQuery.data),
    [myGroupProposalsQuery.data]
  )

  const { data: templatesData } = useMilestoneTemplatesList(departmentId, {
    page: 1,
    limit: 100,
  })

  const activeTemplate = useMemo(() => {
    const templates = templatesData?.templates ?? []
    return getActiveMilestoneTemplate(templates)
  }, [templatesData?.templates])

  const { data: projectsData } = useStudentProjects({
    departmentId,
    studentId,
  })

  const activeProject = useMemo(() => {
    const items = projectsData?.items ?? []
    if (!items.length) return null

    return (
      items.find((project) => project.status.toLowerCase() === "in-progress") ??
      items.find((project) => project.status.toLowerCase() === "active") ??
      items[0]
    )
  }, [projectsData?.items])

  const resolvedProjectId = latestLinkedProposal?.project?.id?.trim() || activeProject?.id || null

  const { data: projectMilestonesData } = useProjectMilestones({
    projectId: resolvedProjectId,
    enabled: Boolean(resolvedProjectId),
  })

  const milestones = useMemo<Milestone[]>(() => {
    const templates = templatesData?.templates ?? []
    const activeTemplate = getActiveMilestoneTemplate(templates)

    const templateMilestones: Milestone[] = (() => {
      if (!activeTemplate?.milestones?.length) return []
      const baseDate = activeTemplate.createdAt

      let cumulativeDays = 0
      return activeTemplate.milestones
        .slice()
        .sort((a, b) => a.sequence - b.sequence)
        .map((milestone) => {
          cumulativeDays += Math.max(0, milestone.defaultDurationDays ?? 0)
          return {
            id: `${activeTemplate.templateId}:${milestone.sequence}`,
            name: milestone.title,
            dueDate: addDays(baseDate, cumulativeDays),
            status: "pending" as const,
            sequence: milestone.sequence,
          }
        })
    })()

    const projectMilestonesByName = new Map(
      (projectMilestonesData?.items ?? []).map((milestone) => [
        normalizeMilestoneName(milestone.title),
        milestone,
      ])
    )

    const proposalMilestonesByName = new Map(
      (latestLinkedProposal?.project?.milestones ?? []).map((milestone) => [
        normalizeMilestoneName(milestone.title ?? ""),
        milestone,
      ])
    )

    function mergeMilestoneState(
      templateMilestone: Milestone,
      proposalMilestone: ProposalProjectMilestone | undefined,
      fallbackMilestone: (typeof projectMilestonesData.items)[number] | undefined
    ): Milestone {
      const latestSubmission = proposalMilestone?.submissions?.[0] ?? null
      const latestFeedback = latestSubmission?.feedbacks?.[0] ?? null
      const hasFeedback = Boolean(latestSubmission?.feedbacks?.length)
      const isApproved =
        proposalMilestone?.status === "APPROVED" ||
        latestSubmission?.status === "APPROVED" ||
        fallbackMilestone?.status === "APPROVED"
      const waitingForReview = Boolean(latestSubmission && !hasFeedback && !isApproved)
      const canResubmit = Boolean(latestSubmission && hasFeedback && !isApproved)
      const canUploadFirst = Boolean(!latestSubmission && !isApproved)

      const mergedStatus: MilestoneStatus = isApproved
        ? "approved"
        : latestSubmission
          ? "submitted"
          : fallbackMilestone
            ? mapBackendStatus(fallbackMilestone.status)
            : templateMilestone.status

      return {
        ...templateMilestone,
        id: proposalMilestone?.id || fallbackMilestone?.id || templateMilestone.id,
        dueDate: proposalMilestone?.dueDate || fallbackMilestone?.dueDate || templateMilestone.dueDate,
        status: mergedStatus,
        submittedAt:
          latestSubmission?.createdAt ||
          proposalMilestone?.submittedAt ||
          fallbackMilestone?.submittedAt ||
          templateMilestone.submittedAt,
        latestSubmissionName: latestSubmission?.fileName || undefined,
        latestSubmissionId: latestSubmission?.id || undefined,
        latestSubmissionUrl: latestSubmission?.fileUrl || undefined,
        latestFeedbackMessage: latestFeedback?.message || undefined,
        latestFeedbackAttachmentName: latestFeedback?.attachmentFileName || undefined,
        latestFeedbackAttachmentUrl: latestFeedback?.attachmentUrl || undefined,
        approvedAt: latestSubmission?.approvedAt || undefined,
        approvedBy: latestSubmission?.approvedBy
          ? formatPersonName(
              latestSubmission.approvedBy.firstName,
              latestSubmission.approvedBy.lastName,
              latestSubmission.approvedBy.email
            )
          : undefined,
        canUploadFirst,
        canResubmit,
        waitingForReview,
        isApproved,
      }
    }

    if (templateMilestones.length) {
      return templateMilestones.map((templateMilestone) => {
        const matchedProjectMilestone = projectMilestonesByName.get(
          normalizeMilestoneName(templateMilestone.name)
        )
        const matchedProposalMilestone = proposalMilestonesByName.get(
          normalizeMilestoneName(templateMilestone.name)
        )

        const maybeOverride =
          proposalMilestoneState &&
          isProposalMilestoneName(templateMilestone.name)

        if (!matchedProjectMilestone && !matchedProposalMilestone) {
          if (!maybeOverride) return templateMilestone

          return {
            ...templateMilestone,
            status: proposalMilestoneState.status,
            submittedAt: proposalMilestoneState.submittedAt,
            isApproved: proposalMilestoneState.status === "approved",
          }
        }

        const mapped = mergeMilestoneState(
          templateMilestone,
          matchedProposalMilestone,
          matchedProjectMilestone
        )

        if (proposalMilestoneState && isProposalMilestoneName(templateMilestone.name)) {
          return {
            ...mapped,
            status: proposalMilestoneState.status,
            submittedAt: proposalMilestoneState.submittedAt ?? mapped.submittedAt,
            isApproved: proposalMilestoneState.status === "approved",
          }
        }

        return mapped
      })
    }

    return myProject.milestones
  }, [
    projectMilestonesData?.items,
    proposalMilestoneState,
    templatesData?.templates,
    latestLinkedProposal?.project?.milestones,
  ])

  const completedMilestones = milestones.filter((m) => m.status === "approved").length
  const totalMilestones = milestones.length
  const progressPercent = totalMilestones ? (completedMilestones / totalMilestones) * 100 : 0
  const projectDisplayName = myProjectGroupQuery.data?.name?.trim() || myProject.title

  const handleSubmitMilestone = (milestone: Milestone) => {
    const milestoneParam = isProposalMilestoneName(milestone.name) ? "proposal" : milestone.name
    router.push(`/dashboard/student/upload-documents?milestone=${encodeURIComponent(milestoneParam)}`)
  }

  const handleOpenSubmissionDetails = (milestone: Milestone) => {
    if (!milestone.latestSubmissionId) return
    router.push(
      `/dashboard/student/submissions?focus=${encodeURIComponent(`milestone-submission:${milestone.latestSubmissionId}`)}`
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
            Milestones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your project milestones.
          </p>
        </div>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="px-3 pb-3 pt-3 sm:px-6 sm:pb-6 sm:pt-6">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <div>
              <h3 className="text-sm font-semibold sm:text-base">{projectDisplayName}</h3>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {completedMilestones} of {totalMilestones} milestones completed
              </p>
            </div>
            <span className="text-xl font-bold text-primary sm:text-2xl">{progressPercent.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>Project Milestones</CardTitle>
          <CardDescription>
            Submit pending milestones through the upload flow.
            {activeTemplate ? (
              <span className="block mt-1">
                Template: {activeTemplate.name} • {activeTemplate.isActive ? "Active" : "Inactive"} • Created {formatDate(activeTemplate.createdAt)}
              </span>
            ) : null}
            {milestones.length ? (
              <span className="block mt-1">
                Sequences: {milestones.map((m, idx) => m.sequence ?? idx + 1).join(" • ")}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {milestones.map((milestone, index) => {
            const previousMilestone = index > 0 ? milestones[index - 1] : null
            const previousMilestoneNumber = previousMilestone
              ? previousMilestone.sequence ?? index
              : null

            const isLocked =
              !milestone.isApproved &&
              !milestone.waitingForReview &&
              !milestone.canResubmit &&
              Boolean(previousMilestone) &&
              previousMilestone?.status !== "approved"

            const lockMessage =
              isLocked && previousMilestoneNumber
                ? `Locked until Milestone ${previousMilestoneNumber} is approved.`
                : null

            return (
              <div
                key={milestone.id}
                className="flex flex-col justify-between gap-3 rounded-lg border bg-muted/30 p-3 sm:gap-4 sm:p-4 lg:flex-row lg:items-center"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold sm:h-10 sm:w-10 ${
                      milestone.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : milestone.status === "submitted"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {milestone.status === "approved" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      milestone.sequence ?? index + 1
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">{milestone.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {formatDate(milestone.dueDate)}
                      </span>
                      {milestone.submittedAt && (
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          Submitted: {formatDate(milestone.submittedAt)}
                        </span>
                      )}
                      {milestone.canUploadFirst && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          Awaiting submission
                        </span>
                      )}
                      {milestone.waitingForReview ? (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Clock3 className="h-3 w-3" />
                          Awaiting Advisor Review
                        </span>
                      ) : null}
                      {milestone.canResubmit ? (
                        <span className="flex items-center gap-1 text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          Feedback Received
                        </span>
                      ) : null}
                      {milestone.approvedAt ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Approved: {formatDate(milestone.approvedAt)}
                        </span>
                      ) : null}
                    </div>
                    {milestone.latestSubmissionName ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Latest submission: {milestone.latestSubmissionName}
                      </p>
                    ) : null}
                    {milestone.latestFeedbackMessage ? (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        Feedback: {milestone.latestFeedbackMessage}
                      </p>
                    ) : null}
                    {milestone.approvedBy ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Approved by {milestone.approvedBy}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                  {milestoneStatusBadge(milestone.status)}
                  <div className="flex flex-col items-stretch gap-1 sm:items-end">
                    {milestone.latestSubmissionUrl ? (
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => handleOpenSubmissionDetails(milestone)}>
                        View Submission
                      </Button>
                    ) : null}
                    {milestone.latestFeedbackAttachmentUrl && milestone.latestFeedbackAttachmentName ? (
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => handleOpenSubmissionDetails(milestone)}>
                        Open Advisor Attachment
                      </Button>
                    ) : null}
                    {(milestone.canUploadFirst || milestone.canResubmit) ? (
                      <Button
                        size="sm"
                        className="w-full sm:w-auto"
                        disabled={isLocked}
                        onClick={() => handleSubmitMilestone(milestone)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {milestone.canResubmit ? "Resubmit" : "Upload Submission"}
                      </Button>
                    ) : null}
                    {lockMessage ? (
                      <p className="text-xs text-muted-foreground">{lockMessage}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
