"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  ChevronRight,
  Upload,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { useMilestoneTemplatesList } from "@/lib/hooks/use-milestone-templates"
import { useProjectMilestones, useStudentProjects } from "@/lib/hooks/use-student-milestones"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import { useMyGroupProjectProposals } from "@/lib/hooks/use-project-proposals"
import { useProject } from "@/lib/hooks/use-projects"
import type { MilestoneTemplate } from "@/types/milestone-templates"
import type { ProjectProposal } from "@/types/project-proposals"

// ----------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------
interface Milestone {
  id: string
  name: string
  dueDate: string
  status: "pending" | "submitted" | "approved" | "rejected"
  submittedAt?: string
  description?: string
  sequence?: number
}

interface ProjectData {
  title: string
  groupName: string
  status: "in-progress" | "completed" | "pending" | "submitted" | "approved" | "rejected"
  advisorName: string
  progress: number
  startDate: string
  dueDate: string
  milestones: Milestone[]
  description?: string
}

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "Invalid date"
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateString
  }
}

const getDaysUntilDue = (dueDate: string): number => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to start of day
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0) // Normalize to start of day
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch (error) {
    console.error("Error calculating days until due:", error)
    return 0
  }
}

const getStatusBadgeVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case "approved":
    case "completed":
      return "default"
    case "submitted":
    case "in-progress":
      return "secondary"
    case "rejected":
      return "destructive"
    case "pending":
    default:
      return "outline"
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const displayStatus = status.replace(/-/g, " ")
  const variant = getStatusBadgeVariant(status)
  const hoverClassName =
    variant === "default"
      ? "hover:bg-primary/90"
      : variant === "secondary"
        ? "hover:bg-secondary/90"
        : variant === "destructive"
          ? "hover:bg-destructive/90"
          : "hover:bg-accent hover:text-accent-foreground"
  return (
    <Badge
      variant={variant}
      className={cn(
        "capitalize cursor-default select-none transition-colors",
        hoverClassName
      )}
    >
      {displayStatus}
    </Badge>
  )
}

const normalizeMilestoneName = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ")

function addDays(baseDate: string, daysToAdd: number): string {
  const date = new Date(baseDate)
  if (Number.isNaN(date.getTime())) return baseDate
  const next = new Date(date)
  next.setDate(next.getDate() + Math.max(0, daysToAdd))
  return next.toISOString().split("T")[0]
}

function getActiveMilestoneTemplate(templates: MilestoneTemplate[]): MilestoneTemplate | null {
  if (!templates.length) return null
  return templates.find((t) => t.isActive) ?? templates[0]
}

const mapStudentMilestoneStatus = (status: string): Milestone["status"] => {
  const normalized = status.trim().toLowerCase()
  if (normalized === "approved" || normalized === "completed") return "approved"
  if (normalized === "submitted") return "submitted"
  return "pending"
}

const isProposalRelatedMilestoneName = (name: string): boolean => {
  const normalized = normalizeMilestoneName(name)
  if (normalized.includes("proposal")) return true
  if (normalized === "project title" || normalized.includes("project title")) return true
  return false
}

function getLatestProposal(proposals: ProjectProposal[] | undefined): ProjectProposal | null {
  const items = proposals ?? []
  if (!items.length) return null

  return (
    items
      .slice()
      .sort((a, b) => {
        const aTime = Date.parse(a.updatedAt ?? a.submittedAt ?? a.createdAt ?? "")
        const bTime = Date.parse(b.updatedAt ?? b.submittedAt ?? b.createdAt ?? "")
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
      })[0] ?? null
  )
}

function getApprovedProposalTitle(proposal: ProjectProposal | null): string | null {
  if (!proposal) return null
  const normalized = String(proposal.status ?? "").trim().toUpperCase()
  if (normalized !== "APPROVED") return null

  const fromReviewSummary = proposal.reviewSummary?.selectedTitle?.trim()
  if (fromReviewSummary) return fromReviewSummary

  const fromTitle = proposal.title?.trim()
  if (fromTitle) return fromTitle

  const idx = typeof proposal.selectedTitleIndex === "number" ? proposal.selectedTitleIndex : null
  const fromProposed = idx !== null ? proposal.proposedTitles?.[idx]?.trim() : null
  if (fromProposed) return fromProposed

  return null
}

function getProposalUploadedAt(proposal: ProjectProposal | null): string | null {
  if (!proposal) return null
  const documents = proposal.documents ?? []
  if (!documents.length) return null

  const preferred =
    documents.find((doc) => String(doc.key ?? "").toLowerCase() === "proposal.pdf") ?? documents[0]

  const uploadedAt = preferred?.uploadedAt?.trim()
  if (uploadedAt) return uploadedAt

  const anyUploadedAt = documents.find((doc) => doc.uploadedAt?.trim())?.uploadedAt?.trim()
  return anyUploadedAt ?? null
}

const mapProposalStatusToProjectStatus = (
  status: unknown
): ProjectData["status"] => {
  const normalized = String(status ?? "").trim().toUpperCase()
  if (normalized === "APPROVED") return "approved"
  if (normalized === "REJECTED") return "rejected"
  if (normalized === "SUBMITTED") return "submitted"
  if (normalized === "DRAFT") return "pending"
  return "pending"
}

const mapProposalStatusToMilestoneStatus = (
  status: unknown
): Milestone["status"] => {
  const normalized = String(status ?? "").trim().toUpperCase()
  if (normalized === "APPROVED") return "approved"
  if (normalized === "REJECTED") return "rejected"
  if (normalized === "SUBMITTED") return "submitted"
  return "pending"
}

const mergeProposalMilestoneStatus = (
  backendStatus: Milestone["status"],
  proposalStatus: Milestone["status"]
): Milestone["status"] => {
  // Proposal-derived statuses should only override when backend is still pending,
  // or when proposal is a stronger terminal state.
  if (proposalStatus === "pending") return backendStatus

  if (backendStatus === "pending") return proposalStatus
  if (proposalStatus === "approved" && backendStatus === "submitted") return "approved"
  if (proposalStatus === "rejected" && backendStatus !== "approved") return "rejected"
  return backendStatus
}

// ----------------------------------------------------------------------
// Mock Data
// ----------------------------------------------------------------------
const getInitialProjectData = (): ProjectData => {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setMonth(startDate.getMonth() - 2) // 2 months ago
  
  const dueDate = new Date(today)
  dueDate.setMonth(dueDate.getMonth() + 6) // 6 months from now

  // Milestone dates
  const milestone1Date = new Date(today)
  milestone1Date.setMonth(milestone1Date.getMonth() - 1)
  
  const milestone2Date = new Date(today)
  milestone2Date.setDate(milestone2Date.getDate() - 5)
  
  const milestone3Date = new Date(today)
  milestone3Date.setMonth(milestone3Date.getMonth() + 1)
  
  const milestone4Date = new Date(today)
  milestone4Date.setMonth(milestone4Date.getMonth() + 3)
  
  const milestone5Date = new Date(today)
  milestone5Date.setMonth(milestone5Date.getMonth() + 5)

  const formatDateString = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  return {
    title: "AI-Driven Academic Assistant",
    groupName: "Group 4",
    status: "in-progress",
    advisorName: "Dr. Alan Turing",
    progress: 40,
    startDate: formatDateString(startDate),
    dueDate: formatDateString(dueDate),
    description:
      "This project focuses on developing an innovative solution using cutting-edge technology to address real-world challenges in the academic environment. The system will help students and faculty manage academic workflows more efficiently.",
    milestones: [
      {
        id: "m1",
        name: "Project Proposal",
        dueDate: formatDateString(milestone1Date),
        status: "approved",
        description: "Initial project proposal and scope definition",
      },
      {
        id: "m2",
        name: "Software Requirements Specification Document (SRS)",
        dueDate: formatDateString(milestone2Date),
        status: "submitted",
        submittedAt: formatDateString(new Date(milestone2Date.getTime() - 2 * 24 * 60 * 60 * 1000)),
        description: "describes the system’s requirements, interfaces, and design constraints for the proposed platform.",
      },
      {
        id: "m3",
        name: "System Design Document (SDD) ",
        dueDate: formatDateString(milestone3Date),
        status: "pending",
        description: "Detailed system design and architecture documentation",
      },
      {
        id: "m4",
        name: "Implementation",
        dueDate: formatDateString(milestone4Date),
        status: "pending",
        description: "Core functionality implementation",
      },
      {
        id: "m5",
        name: "Final Presentation",
        dueDate: formatDateString(milestone5Date),
        status: "pending",
        description: "Final project presentation and demonstration",
      },
    ],
  }
}

const initialProjectData: ProjectData = getInitialProjectData()

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

function MyProjectHeader() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          My Project
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your project details, milestones, and submissions
        </p>
      </div>
    </div>
  )
}

export function StudentMyProjectPage() {
  const router = useRouter()
  const [projectState, setProjectState] = useState<ProjectData>(initialProjectData)

  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const studentId = user?.id ?? null
  const { data: myGroupData } = useMyProjectGroup(Boolean(user))

  const groupProposalsQuery = useMyGroupProjectProposals(Boolean(accessToken))
  const latestGroupProposal = useMemo(
    () => getLatestProposal(groupProposalsQuery.data),
    [groupProposalsQuery.data]
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

  const projectDetailsQuery = useProject(
    activeProject?.id ?? null,
    Boolean(accessToken) && Boolean(activeProject?.id)
  )

  const { data: projectMilestonesData } = useProjectMilestones({
    projectId: activeProject?.id,
    enabled: Boolean(activeProject?.id),
  })

  const templateMilestones = useMemo<Milestone[]>(() => {
    const templates = templatesData?.templates ?? []
    const activeTemplate = getActiveMilestoneTemplate(templates)
    if (!activeTemplate?.milestones?.length) return []

    const baseDate = projectState.startDate?.trim() ? projectState.startDate : activeTemplate.createdAt

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
          description: milestone.description ?? undefined,
          sequence: milestone.sequence,
        }
      })
  }, [projectState.startDate, templatesData?.templates])

  const mergedBackendMilestones = useMemo<Milestone[]>(() => {
    if (!templateMilestones.length) return []

    const proposalMilestoneStatus = mapProposalStatusToMilestoneStatus(latestGroupProposal?.status)
    const proposalSubmittedAt = latestGroupProposal?.submittedAt ?? latestGroupProposal?.updatedAt ?? undefined

    const projectMilestonesByName = new Map(
      (projectMilestonesData?.items ?? []).map((milestone) => [
        normalizeMilestoneName(milestone.title),
        milestone,
      ])
    )

    return templateMilestones.map((templateMilestone) => {
      const matchedProjectMilestone = projectMilestonesByName.get(
        normalizeMilestoneName(templateMilestone.name)
      )

      const isProposalRelated = isProposalRelatedMilestoneName(templateMilestone.name)

      if (!matchedProjectMilestone) {
        if (!isProposalRelated || proposalMilestoneStatus === "pending") return templateMilestone

        return {
          ...templateMilestone,
          status: proposalMilestoneStatus,
          submittedAt: proposalSubmittedAt,
        }
      }

      const backendStatus = mapStudentMilestoneStatus(matchedProjectMilestone.status)
      const resolvedStatus =
        isProposalRelated
          ? mergeProposalMilestoneStatus(backendStatus, proposalMilestoneStatus)
          : backendStatus

      return {
        ...templateMilestone,
        id: matchedProjectMilestone.id,
        dueDate: matchedProjectMilestone.dueDate,
        status: resolvedStatus,
        submittedAt:
          matchedProjectMilestone.submittedAt ??
          (resolvedStatus !== "pending" ? proposalSubmittedAt : undefined),
      }
    })
  }, [latestGroupProposal?.status, latestGroupProposal?.submittedAt, latestGroupProposal?.updatedAt, projectMilestonesData?.items, templateMilestones])

  const computedMyProject = useMemo<ProjectData>(() => {
    let nextProject = projectState

    if (mergedBackendMilestones.length) {
      const existingMilestonesById = new Map(
        nextProject.milestones.map((milestone) => [milestone.id, milestone])
      )

      const mergedMilestones = mergedBackendMilestones.map((milestone) => {
        const existing = existingMilestonesById.get(milestone.id)
        if (!existing) return milestone

        return {
          ...milestone,
          status: milestone.status,
          submittedAt: milestone.submittedAt ?? existing.submittedAt,
        }
      })

      const completedMilestonesCount = mergedMilestones.filter(
        (milestone) => milestone.status === "approved"
      ).length
      const progress = Math.round((completedMilestonesCount / mergedMilestones.length) * 100)

      nextProject = {
        ...nextProject,
        milestones: mergedMilestones,
        progress,
      }
    }

    const backendGroupName = myGroupData?.name?.trim()
    if (backendGroupName && backendGroupName !== nextProject.groupName) {
      nextProject = {
        ...nextProject,
        groupName: backendGroupName,
      }
    }

    // If the proposal milestone is submitted/approved/rejected, reflect it on the
    // project status badge so students can see the current review state.
    if (latestGroupProposal) {
      const proposalStatus = mapProposalStatusToProjectStatus(latestGroupProposal.status)
      const hasProposalMilestone = nextProject.milestones.some((m) => isProposalRelatedMilestoneName(m.name))
      if (hasProposalMilestone && proposalStatus !== nextProject.status) {
        nextProject = {
          ...nextProject,
          status: proposalStatus,
        }
      }

      const approvedTitle = getApprovedProposalTitle(latestGroupProposal)
      if (approvedTitle && approvedTitle !== nextProject.title) {
        nextProject = {
          ...nextProject,
          title: approvedTitle,
        }
      }

      const uploadedAt = getProposalUploadedAt(latestGroupProposal)
      const startedAt =
        uploadedAt ??
        latestGroupProposal.submittedAt ??
        latestGroupProposal.updatedAt ??
        latestGroupProposal.createdAt ??
        null
      if (startedAt && startedAt !== nextProject.startDate) {
        nextProject = {
          ...nextProject,
          startDate: startedAt,
        }
      }
    }

    const advisor = projectDetailsQuery.data?.advisor
    const advisorName = advisor
      ? `${advisor.firstName ?? ""} ${advisor.lastName ?? ""}`.trim() || advisor.email || ""
      : ""
    if (advisorName && advisorName !== nextProject.advisorName) {
      nextProject = {
        ...nextProject,
        advisorName,
      }
    }

    return nextProject
  }, [latestGroupProposal, mergedBackendMilestones, myGroupData?.name, projectDetailsQuery.data?.advisor, projectState])

  const myProject = computedMyProject

  // Ensure we have valid project data
  if (!myProject || !myProject.milestones || myProject.milestones.length === 0) {
    return (
      <div className="space-y-6 w-full">
        <MyProjectHeader />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No project data available.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedMilestones = myProject.milestones.filter((m) => m.status === "approved").length
  const totalMilestones = myProject.milestones.length

  return (
    <div className="space-y-6 w-full">
      <MyProjectHeader />

      {/* Project Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-display">{myProject.title}</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{myProject.groupName}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Due: <span className="font-medium">{formatDate(myProject.dueDate)}</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span>
                      {completedMilestones}/{totalMilestones} milestones completed
                    </span>
                  </span>
                </div>
              </CardDescription>
            </div>
            <StatusBadge status={myProject.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium mb-1">Advisor</p>
                  <p className="text-muted-foreground text-sm">{myProject.advisorName}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-base">Overall Progress</h3>
                  <span className="text-sm font-medium">{myProject.progress}%</span>
                </div>
                <Progress value={myProject.progress} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Started</p>
                  <p className="font-medium text-sm">{formatDate(myProject.startDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-xl">Project Milestones</CardTitle>
              <CardDescription className="mt-1">
                Track your progress and submit deliverables for each milestone
                {activeTemplate ? (
                  <span className="block mt-1">
                    Template: {activeTemplate.name} • {activeTemplate.isActive ? "Active" : "Inactive"} • Created {formatDate(activeTemplate.createdAt)}
                  </span>
                ) : null}
                {myProject.milestones.length ? (
                  <span className="block mt-1">
                    Sequences:{" "}
                    {myProject.milestones
                      .slice()
                      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                      .map((m, idx) => m.sequence ?? idx + 1)
                      .join(" • ")}
                  </span>
                ) : null}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myProject.milestones.map((milestone, index) => {
              const daysUntilDue = getDaysUntilDue(milestone.dueDate)
              const isOverdue = daysUntilDue < 0 && milestone.status === "pending"
              const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0 && milestone.status === "pending"
              const isProposalRelated = isProposalRelatedMilestoneName(milestone.name)
              const canResubmitProposal = isProposalRelated && milestone.status === "rejected"
              const handleResubmit = () => {
                const milestoneParam = "Project Proposal"
                router.push(`/dashboard/student/upload-documents?milestone=${encodeURIComponent(milestoneParam)}`)
              }

              return (
                <div
                  key={milestone.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-all",
                    milestone.status === "approved"
                      ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                      : milestone.status === "submitted"
                        ? "bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900"
                        : "bg-muted/30 border-border hover:border-primary/50",
                    isOverdue && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      milestone.status === "approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : milestone.status === "submitted"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {milestone.status === "approved" ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <span className="font-semibold text-base">{milestone.sequence ?? index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base">{milestone.name}</p>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {milestone.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Due: {formatDate(milestone.dueDate)}
                          </span>
                          {milestone.submittedAt && (
                            <span className="text-xs text-muted-foreground">
                              Submitted: {formatDate(milestone.submittedAt)}
                            </span>
                          )}
                          {isOverdue && (
                            <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                              <AlertCircle className="h-3 w-3" />
                              Overdue by {Math.abs(daysUntilDue)} days
                            </span>
                          )}
                          {isDueSoon && !isOverdue && (
                            <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500 font-medium">
                              <AlertCircle className="h-3 w-3" />
                              Due in {daysUntilDue} days
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={milestone.status} />
                    {milestone.status === "submitted" && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    {canResubmitProposal ? (
                      <Button size="sm" variant="destructive" onClick={handleResubmit}>
                        <Upload className="h-4 w-4 mr-2" />
                        Resubmit
                      </Button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
