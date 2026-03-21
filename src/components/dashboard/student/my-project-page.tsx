"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  CheckCircle,
  Upload,
  Clock,
  FileText,
  AlertCircle,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { useMilestoneTemplatesList } from "@/lib/hooks/use-milestone-templates"
import { useProjectMilestones, useStudentProjects } from "@/lib/hooks/use-student-milestones"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import { getTemplateDueDate } from "@/lib/milestone-template-dates"

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
}

interface ProjectData {
  title: string
  groupName: string
  status: "in-progress" | "completed" | "pending"
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
  return (
    <Badge variant={getStatusBadgeVariant(status)} className="capitalize">
      {displayStatus}
    </Badge>
  )
}

const normalizeMilestoneName = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ")

const mapStudentMilestoneStatus = (status: string): Milestone["status"] => {
  const normalized = status.trim().toLowerCase()
  if (normalized === "approved" || normalized === "completed") return "approved"
  if (normalized === "submitted") return "submitted"
  if (normalized === "rejected") return "rejected"
  return "pending"
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const [projectState, setProjectState] = useState<ProjectData>(initialProjectData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const user = useAuthStore((state) => state.user)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const studentId = user?.id ?? null
  const { data: myGroupData } = useMyProjectGroup(Boolean(user))

  const { data: templatesData } = useMilestoneTemplatesList(departmentId, {
    page: 1,
    limit: 100,
  })

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

  const { data: projectMilestonesData } = useProjectMilestones({
    projectId: activeProject?.id,
    enabled: Boolean(activeProject?.id),
  })

  const templateMilestones = useMemo<Milestone[]>(() => {
    const templates = templatesData?.templates ?? []
    if (!templates.length) return []

    return templates
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((template) => ({
        id: template.templateId,
        name: template.name,
        dueDate: getTemplateDueDate(template),
        status: "pending" as const,
        description:
          template.milestones?.[0]?.description ??
          template.description ??
          undefined,
      }))
  }, [templatesData?.templates])

  const mergedBackendMilestones = useMemo<Milestone[]>(() => {
    if (!templateMilestones.length) return []

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

      if (!matchedProjectMilestone) return templateMilestone

      return {
        ...templateMilestone,
        id: matchedProjectMilestone.id,
        dueDate: matchedProjectMilestone.dueDate,
        status: mapStudentMilestoneStatus(matchedProjectMilestone.status),
        submittedAt: matchedProjectMilestone.submittedAt ?? undefined,
      }
    })
  }, [templateMilestones, projectMilestonesData?.items])

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
        (milestone) => milestone.status === "approved" || milestone.status === "submitted"
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

    return nextProject
  }, [projectState, mergedBackendMilestones, myGroupData?.name])

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

  const handleFileSelect = (milestoneId: string) => {
    setSelectedMilestoneId(milestoneId)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedMilestoneId) {
      return
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a PDF, Word document, or ZIP file.",
      })
      e.target.value = ""
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Please upload a file smaller than 10MB.",
      })
      e.target.value = ""
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Update UI state
    setProjectState((prevProject) => {
      const updatedMilestones = prevProject.milestones.map((m) =>
        m.id === selectedMilestoneId
          ? {
              ...m,
              status: "submitted" as const,
              submittedAt: new Date().toISOString().split("T")[0],
            }
          : m
      )

      // Calculate new progress
      const completedMilestones = updatedMilestones.filter(
        (m) => m.status === "approved" || m.status === "submitted"
      ).length
      const newProgress = Math.round(
        (completedMilestones / updatedMilestones.length) * 100
      )

      return {
        ...prevProject,
        milestones: updatedMilestones,
        progress: newProgress,
      }
    })

    const milestoneName = myProject.milestones.find((m) => m.id === selectedMilestoneId)?.name

    toast.success("Milestone Submitted", {
      description: `File "${file.name}" has been successfully submitted for ${milestoneName}.`,
    })

    setSelectedMilestoneId(null)
    setIsSubmitting(false)
    e.target.value = ""
  }

  const completedMilestones = myProject.milestones.filter(
    (m) => m.status === "approved" || m.status === "submitted"
  ).length
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
              <div>
                <h3 className="font-semibold mb-2 text-base">Project Overview</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {myProject.description ||
                    "This project focuses on developing an innovative solution using cutting-edge technology to address real-world challenges in the academic environment."}
                </p>
              </div>
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
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                  <p className="font-medium text-sm">{formatDate(myProject.dueDate)}</p>
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
                      <span className="font-semibold text-base">{index + 1}</span>
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
                    {milestone.status === "pending" && (
                      <Button
                        size="sm"
                        variant={isOverdue ? "destructive" : "default"}
                        onClick={() => handleFileSelect(milestone.id)}
                        disabled={isSubmitting}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Submit
                      </Button>
                    )}
                    {milestone.status === "submitted" && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
          />
        </CardContent>
      </Card>
    </div>
  )
}
