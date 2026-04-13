"use client"

import React, { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  DashboardBackButton,
  DASHBOARD_BACK_ICON_CLASS,
} from "@/components/dashboard/dashboard-back"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import DataTable, { type Column } from "@/components/shared/DataTable"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  FolderOpen,
  ClipboardCheck,
  Eye,
  Download,
  Calendar,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  Code,
  Archive,
  Award,
  GitBranch,
  Star,
  BookOpen,
  UserCheck,
  DollarSign,
  PieChart,
  Activity,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  Info,
  MessageSquare,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { useDepartmentProjectsOverview, useProjectDetails } from "@/lib/hooks/use-projects"
import type { ProjectDetail } from "@/types/projects"

function memberInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatOptionalDate(value?: string | null) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleDateString()
}

function formatAdvisorName(advisor?: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
} | null) {
  if (!advisor) {
    return "Unassigned"
  }

  const fullName = [advisor.firstName, advisor.lastName].filter(Boolean).join(" ").trim()
  return fullName || advisor.email || "Unassigned"
}

function normalizeMilestoneStatus(status?: string | null): "pending" | "in-progress" | "completed" {
  const normalized = status?.trim().toLowerCase() ?? "pending"

  if (normalized === "approved" || normalized === "completed") {
    return "completed"
  }

  if (normalized === "submitted" || normalized === "in-progress" || normalized === "active") {
    return "in-progress"
  }

  return "pending"
}

function formatUserName(user?: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
} | null) {
  if (!user) {
    return ""
  }

  return formatAdvisorName(user)
}

function mapProjectDetailToActiveProject(detail: ProjectDetail, fallback: Project): Project {
  const studentMembers = (detail.members ?? []).filter((member) => member.role?.toUpperCase() === "STUDENT")
  const groupMembers = studentMembers
    .map((member) => formatUserName(member.user ?? member))
    .filter(Boolean)
  const groupMemberProfiles = studentMembers.reduce<{ name: string; avatarUrl?: string | null }[]>(
    (result, member) => {
      const resolvedMember = member.user ?? member
      const name = formatUserName(resolvedMember)

      if (!name) {
        return result
      }

      result.push({
        name,
        avatarUrl: resolvedMember.avatarUrl ?? null,
      })

      return result
    },
    []
  )

  const technologies = detail.proposal?.projectGroup?.technologies?.filter(Boolean) ?? []
  const milestones = (detail.milestones ?? []).map((milestone) => ({
    id: milestone.id,
    name: milestone.title,
    status: normalizeMilestoneStatus(milestone.status),
    dueDate: milestone.dueDate,
    latestSubmission: milestone.latestSubmission?.fileUrl
      ? {
          fileName: milestone.latestSubmission.fileName,
          fileUrl: milestone.latestSubmission.fileUrl,
          sizeBytes: milestone.latestSubmission.sizeBytes ?? null,
          mimeType: milestone.latestSubmission.mimeType ?? null,
          createdAt: milestone.latestSubmission.createdAt ?? null,
          approvedAt: milestone.latestSubmission.approvedAt ?? null,
          approvedByName: formatUserName(milestone.latestSubmission.approvedBy) || undefined,
        }
      : null,
    finalApprovedFile: milestone.finalApprovedFile?.url
      ? {
          fileName: milestone.finalApprovedFile.fileName,
          fileUrl: milestone.finalApprovedFile.url,
          sizeBytes: milestone.finalApprovedFile.sizeBytes ?? null,
          mimeType: milestone.finalApprovedFile.mimeType ?? null,
          approvedAt: milestone.finalApprovedFile.approvedAt ?? null,
          approvedByName: formatUserName(milestone.finalApprovedFile.approvedBy) || undefined,
        }
      : null,
  }))
  const latestDueDate = [...(detail.milestones ?? [])]
    .sort((left, right) => new Date(right.dueDate).getTime() - new Date(left.dueDate).getTime())[0]?.dueDate

  return {
    ...fallback,
    title: detail.title || fallback.title,
    groupName: detail.proposal?.projectGroup?.name ?? fallback.groupName,
    advisorName: formatAdvisorName(detail.advisor),
    status: detail.status.toLowerCase().replace(/_/g, "-") as Project["status"],
    progress: fallback.progress,
    startDate: detail.createdAt ?? fallback.startDate,
    dueDate: latestDueDate ?? fallback.dueDate,
    departmentId: detail.departmentId ?? fallback.departmentId,
    departmentName: detail.department?.name ?? fallback.departmentName,
    groupMembers: groupMembers.length > 0 ? groupMembers : fallback.groupMembers,
    groupMemberProfiles: groupMemberProfiles.length > 0 ? groupMemberProfiles : fallback.groupMemberProfiles,
    description:
      detail.description ?? detail.proposal?.description ?? detail.proposal?.projectGroup?.objectives ?? fallback.description,
    technologies,
    milestones,
  }
}

// Helper Components for better reusability and styling
const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-start gap-4 py-2.5 text-sm border-b border-border/50 last:border-0 last:pb-0 first:pt-0">
    <span className="text-muted-foreground shrink-0 text-xs font-medium uppercase tracking-wide">{label}</span>
    <span className="font-medium text-right min-w-0">{value}</span>
  </div>
);

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  onClick: () => void
}) => (
  <Button
    variant="outline"
    className="w-full justify-start gap-2 hover:bg-primary/5 hover:border-primary/20 transition-all group"
    onClick={onClick}
  >
    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    <span>{label}</span>
  </Button>
);

const DocumentButton = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  onClick: () => void
}) => (
  <Button 
    variant="outline" 
    className="justify-start gap-2 hover:bg-primary/5 hover:border-primary/20 transition-all group w-full"
    onClick={onClick}
  >
    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    <span className="truncate">{label}</span>
  </Button>
);

// Mock data interfaces
interface Project {
  id: string;
  title: string;
  groupName: string;
  advisorName: string;
  status: 'active' | 'completed' | 'on-hold' | 'pending' | 'submitted' | 'approved';
  progress: number;
  startDate: string;
  dueDate: string;
  departmentId: string;
  departmentName: string;
  groupMembers: string[];
  groupMemberProfiles?: { name: string; avatarUrl?: string | null }[];
  evaluators?: string[];
  budget?: number;
  category: string;
  tags: string[];
  lastActivity: string;
  /** Academic term label, e.g. Spring 2024 */
  semester?: string;
  description?: string;
  technologies?: string[];
  milestones?: {
    id?: string;
    name: string;
    status: "pending" | "in-progress" | "completed";
    dueDate: string;
    latestSubmission?: {
      fileName: string;
      fileUrl: string;
      sizeBytes?: number | null;
      mimeType?: string | null;
      createdAt?: string | null;
      approvedAt?: string | null;
      approvedByName?: string;
    } | null;
    finalApprovedFile?: {
      fileName: string;
      fileUrl: string;
      sizeBytes?: number | null;
      mimeType?: string | null;
      approvedAt?: string | null;
      approvedByName?: string;
    } | null;
  }[];
}

interface PastProject extends Project {
  completionDate: string;
  academicYear: string;
  grade: number;
  feedback: string;
  description?: string;
  documents: {
    srs?: string;
    sdd?: string;
    reports: string[];
    sourceCode?: string;
    poster?: string;
    presentation?: string;
  };
  metadata: {
    technologies: string[];
    keywords: string[];
    awards?: string[];
    publications?: string[];
  };
  students: string[];
  evaluatorNames: string[];
}

const mockPastProjects: PastProject[] = [
  {
    id: 'p1',
    title: 'Automated Grading System',
    groupName: 'Group Epsilon',
    advisorName: 'Dr. Sarah Johnson',
    status: 'completed',
    progress: 100,
    startDate: '2023-09-01',
    dueDate: '2023-12-15',
    completionDate: '2023-12-10',
    academicYear: '2023-2024',
    grade: 92,
    feedback: 'Excellent implementation with comprehensive testing.',
    departmentId: 'dept1',
    departmentName: 'Computer Science',
    groupMembers: ['John Doe', 'Jane Smith'],
    students: ['John Doe', 'Jane Smith'],
    evaluatorNames: ['Dr. Michael Chen', 'Prof. Emily Rodriguez'],
    documents: {
      srs: '/docs/srs.pdf',
      sdd: '/docs/sdd.pdf',
      reports: ['/docs/final.pdf', '/docs/technical.pdf'],
      sourceCode: '/code/archive.zip',
      poster: '/docs/poster.pdf',
      presentation: '/docs/slides.pptx'
    },
    metadata: {
      technologies: ['Python', 'Django', 'React', 'PostgreSQL'],
      keywords: ['Grading', 'Automation', 'Education'],
      awards: ['Best Project Award 2023'],
      publications: ['IEEE EDUCON 2024']
    },
    budget: 8000,
    category: 'EdTech',
    tags: ['Education', 'Automation', 'Web App'],
    lastActivity: '2023-12-10',
    description:
      "An automated grading system that streamlines evaluation and provides consistent feedback to students.",
  },
  {
    id: 'p2',
    title: 'Healthcare Analytics Platform',
    groupName: 'Group Zeta',
    advisorName: 'Dr. Lisa Thompson',
    status: 'completed',
    progress: 100,
    startDate: '2023-09-15',
    dueDate: '2023-12-20',
    completionDate: '2023-12-18',
    academicYear: '2023-2024',
    grade: 88,
    feedback: 'Good work on data visualization. Consider adding more security features.',
    departmentId: 'dept2',
    departmentName: 'Data Science',
    groupMembers: ['Alice Brown', 'Charlie Davis', 'Eva Green'],
    students: ['Alice Brown', 'Charlie Davis', 'Eva Green'],
    evaluatorNames: ['Dr. Michael Chen', 'Prof. David Kim'],
    documents: {
      srs: '/docs/healthcare-srs.pdf',
      reports: ['/docs/healthcare-final.pdf'],
      sourceCode: '/code/healthcare.zip'
    },
    metadata: {
      technologies: ['Python', 'TensorFlow', 'React', 'MongoDB'],
      keywords: ['Healthcare', 'Analytics', 'Machine Learning'],
      publications: ['HealthTech Journal 2024']
    },
    budget: 12000,
    category: 'Healthcare',
    tags: ['Healthcare', 'Analytics', 'ML'],
    lastActivity: '2023-12-18',
    description:
      "A comprehensive healthcare analytics platform for predicting patient outcomes and optimizing hospital resources.",
  }
];

const getStatusBadgeVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case "approved":
    case "completed":
    case "active":
      return "default"
    case "submitted":
    case "in-progress":
    case "pending":
      return "secondary"
    case "rejected":
      return "destructive"
    case "on-hold":
    default:
      return "outline"
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const displayStatus = status.replace(/-/g, " ")
  return (
    <Badge variant={getStatusBadgeVariant(status)} className="capitalize whitespace-nowrap">
      {displayStatus}
    </Badge>
  )
}

/** Popup card for one team member on an active project (matches team-detail MemberPopup style). */
function ActiveProjectMemberDetailDialog({
  member,
  project,
  open,
  onClose,
}: {
  member: string | null
  project: Project | null
  open: boolean
  onClose: () => void
}) {
  if (!project || !member) return null
  const memberProfiles = project.groupMemberProfiles?.length
    ? project.groupMemberProfiles
    : project.groupMembers.map((name) => ({ name, avatarUrl: null }))
  const activeMemberProfile = memberProfiles.find((item) => item.name === member)
  const fellowMembers = memberProfiles.filter((item) => item.name !== member)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{member} details</DialogTitle>
          <DialogDescription>View active project member details.</DialogDescription>
        </DialogHeader>
        <div className="relative h-[4.5rem] bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 left-2 h-6 gap-0.5 px-1.5 text-[10px] font-semibold bg-background/85 hover:bg-background border border-border/40 shadow-sm"
            onClick={onClose}
            title="Back"
          >
            <ArrowLeft className={cn("h-3 w-3", DASHBOARD_BACK_ICON_CLASS)} />
            Back
          </Button>
          <div className="absolute -bottom-6 left-5">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              {activeMemberProfile?.avatarUrl ? <AvatarImage src={activeMemberProfile.avatarUrl} /> : null}
              <AvatarFallback className="bg-primary/15 font-bold text-primary text-base">
                {memberInitials(member)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="pt-8 px-5 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold truncate">{member}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {project.groupName} · {project.departmentName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5 flex-wrap justify-end">
            <Badge variant="secondary" className="text-[10px]">Student</Badge>
            <StatusBadge status={project.status} />
          </div>
        </div>

        <Separator className="mx-5" />

        {/* KPI strip (aligned with team detail page) */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                label: "Members",
                value: String(project.groupMembers.length),
                icon: Users,
                iconBg: "bg-primary/10",
                iconColor: "text-primary",
              },
              {
                label: "Status",
                value: project.status
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" "),
                icon: Activity,
                iconBg: "bg-primary/10",
                iconColor: "text-primary",
              },
            ].map((k) => (
              <div
                key={k.label}
                className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5"
              >
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", k.iconBg)}>
                  <k.icon className={cn("h-4 w-4", k.iconColor)} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate" title={k.value}>
                    {k.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{k.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mx-5" />

        <div className="px-5 pt-4 pb-5 space-y-4 max-h-[min(55vh,420px)] overflow-y-auto [scrollbar-width:thin]">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <FolderOpen className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project context</p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Project</p>
                <p className="text-sm font-medium mt-0.5">{project.title}</p>
              </div>
              {[
                { label: "Group",       value: project.groupName },
                { label: "Advisor",     value: project.advisorName },
                { label: "Department",  value: project.departmentName },
                { label: "Progress",    value: `${project.progress}%` },
                { label: "Due date",     value: formatOptionalDate(project.dueDate) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="text-xs font-medium mt-0.5 truncate" title={value}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {fellowMembers.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fellow team members</p>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {fellowMembers.length}
                  </Badge>
                </div>
                <ul className="space-y-1.5">
                  {fellowMembers.map((m) => (
                    <li
                      key={m.name}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        {m.avatarUrl ? <AvatarImage src={m.avatarUrl} /> : null}
                        <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                          {memberInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate">{m.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Popup for one student on a completed (past) project — same layout as active member popup, view-only. */
function PastProjectMemberDetailDialog({
  member,
  project,
  open,
  onClose,
}: {
  member: string | null
  project: PastProject | null
  open: boolean
  onClose: () => void
}) {
  if (!project || !member) return null
  const fellowMembers = project.students.filter((m) => m !== member)
  const statusLabel = project.status
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{member} details</DialogTitle>
          <DialogDescription>View completed project member details.</DialogDescription>
        </DialogHeader>
        <div className="relative h-[4.5rem] bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 left-2 h-6 gap-0.5 px-1.5 text-[10px] font-semibold bg-background/85 hover:bg-background border border-border/40 shadow-sm"
            onClick={onClose}
            title="Back"
          >
            <ArrowLeft className={cn("h-3 w-3", DASHBOARD_BACK_ICON_CLASS)} />
            Back
          </Button>
          <div className="absolute -bottom-6 left-5">
            <div className="h-12 w-12 rounded-full bg-primary/15 border-2 border-background flex items-center justify-center font-bold text-primary text-base shadow-sm">
              {memberInitials(member)}
            </div>
          </div>
        </div>

        <div className="pt-8 px-5 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold truncate">{member}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {project.groupName} · {project.departmentName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5 flex-wrap justify-end">
            <Badge variant="secondary" className="text-[10px]">Student</Badge>
            <StatusBadge status={project.status} />
          </div>
        </div>

        <Separator className="mx-5" />

        <div className="px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              {
                label: "Members",
                value: String(project.students.length),
                icon: Users,
                iconBg: "bg-primary/10",
                iconColor: "text-primary",
              },
              {
                label: "Status",
                value: statusLabel,
                icon: Activity,
                iconBg: "bg-primary/10",
                iconColor: "text-primary",
              },
              {
                label: "Semester",
                value: project.academicYear,
                icon: Calendar,
                iconBg: "bg-muted/80",
                iconColor: "text-muted-foreground",
              },
              {
                label: "Last Activity",
                value: new Date(project.lastActivity).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }),
                icon: Clock,
                iconBg: "bg-muted/80",
                iconColor: "text-muted-foreground",
              },
            ].map((k) => (
              <div
                key={k.label}
                className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5"
              >
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", k.iconBg)}>
                  <k.icon className={cn("h-4 w-4", k.iconColor)} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate" title={k.value}>
                    {k.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{k.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mx-5" />

        <div className="px-5 pt-4 pb-5 space-y-4 max-h-[min(55vh,420px)] overflow-y-auto [scrollbar-width:thin]">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <FolderOpen className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project context</p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Project</p>
                <p className="text-sm font-medium mt-0.5">{project.title}</p>
              </div>
              {[
                { label: "Group", value: project.groupName },
                { label: "Advisor", value: project.advisorName },
                { label: "Department", value: project.departmentName },
                { label: "Completed", value: new Date(project.completionDate).toLocaleDateString() },
                { label: "Final grade", value: `${project.grade}%` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="text-xs font-medium mt-0.5 truncate" title={value}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {fellowMembers.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fellow team members</p>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {fellowMembers.length}
                  </Badge>
                </div>
                <ul className="space-y-1.5">
                  {fellowMembers.map((m) => (
                    <li
                      key={m}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-primary">{memberInitials(m)}</span>
                      </div>
                      <span className="text-sm truncate">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ProjectsOverview() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const overviewQuery = useDepartmentProjectsOverview({
    departmentId,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProject, setSelectedProject] = useState<PastProject | null>(null)
  const [showPastDetails, setShowPastDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<"active" | "past">("active")
  const [selectedActiveProject, setSelectedActiveProject] = useState<Project | null>(null)
  const [showActiveDetails, setShowActiveDetails] = useState(false)
  const [selectedActiveMemberName, setSelectedActiveMemberName] = useState<string | null>(null)
  const [selectedPastMemberName, setSelectedPastMemberName] = useState<string | null>(null)
  const [showProjectCommentDialog, setShowProjectCommentDialog] = useState(false)
  const [projectCommentText, setProjectCommentText] = useState("")
  const activeProjectDetailsQuery = useProjectDetails({
    projectId: showActiveDetails ? selectedActiveProject?.id : null,
    enabled: showActiveDetails && Boolean(selectedActiveProject?.id),
  })

  const departmentName = user?.departmentName ?? user?.department?.name ?? "Department"
  const activeProjects = (overviewQuery.data?.projects ?? []).map((project) => ({
    id: project.id,
    title: project.projectName,
    groupName: project.group.name,
    advisorName: formatAdvisorName(project.advisor),
    status: project.status.toLowerCase().replace(/_/g, "-") as Project["status"],
    progress: project.milestoneProgressPercent,
    startDate: "",
    dueDate: "",
    departmentId: departmentId ?? "",
    departmentName,
    groupMembers: [],
    groupMemberProfiles: [],
    evaluators: [],
    category: "—",
    tags: [],
    lastActivity: "",
    description: "",
    technologies: [],
  }))
  const allProjects = [...activeProjects, ...mockPastProjects];

  // Filter projects based on search
  const filterProjects = <T extends Project | PastProject>(projects: T[]): T[] => {
    return projects.filter((p) => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.advisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });
  };

  const filteredActiveProjects = filterProjects(activeProjects)
  const filteredPastProjects = filterProjects(mockPastProjects)

  const handleViewPastProject = (project: PastProject) => {
    setSelectedProject(project)
    setSelectedPastMemberName(null)
    setShowPastDetails(true)
  }

  const handleViewActiveProject = (project: Project) => {
    setSelectedActiveProject(project)
    setSelectedActiveMemberName(null)
    setShowProjectCommentDialog(false)
    setProjectCommentText("")
    setShowActiveDetails(true)
  }

  const triggerBrowserDownload = (filePath: string, fileName?: string) => {
    try {
      const link = document.createElement("a")
      link.href = filePath
      if (fileName) {
        link.download = fileName
      }
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Failed to start download", error)
    }
  }

  const handleDownloadDocument = (filePath: string, fileName: string) => {
    triggerBrowserDownload(filePath, fileName)
    toast("Download Started", {
      description: `Downloading ${fileName}...`,
    })
  }

  const handleDownloadActiveSummary = (project: Project) => {
    const safeTitle = project.title.replace(/\s+/g, "_")
    const fileName = `${safeTitle}_summary.pdf`
    // Placeholder path – wire to real report endpoint when available.
    triggerBrowserDownload("/docs/project-summary-placeholder.pdf", fileName)
    toast("Download Started", {
      description: `Downloading ${fileName}...`,
    })
  }

  const handleExportReport = () => {
    toast("Report Generated", {
      description: "Projects overview report has been generated and downloaded.",
    })
  };

  const totalProjectsValue = overviewQuery.data?.totalProjects ?? 0;
  const activeProjectsValue = overviewQuery.data?.activeProjects ?? 0;
  const completedProjectsValue = overviewQuery.data?.completedProjects ?? 0;
  const cancelledProjectsValue = overviewQuery.data?.cancelledProjects ?? 0;

  const renderOverviewValue = (value: number) => {
    if (overviewQuery.isLoading) {
      return "..."
    }

    return value
  }

  const activeColumns: Column<Project>[] = [
    { 
      key: 'title', 
      header: 'Project', 
      render: (p) => (
        <div className="min-w-[300px]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="font-medium hover:text-primary cursor-pointer truncate"
                onClick={() => handleViewActiveProject(p)}
                title={p.title}
              >
                {p.title}
              </p>
              <p className="text-sm text-muted-foreground truncate">{p.groupName}</p>
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'advisor', 
      header: 'Advisor', 
      render: (p) => (
        <div className="min-w-[180px] flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
            {memberInitials(p.advisorName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate" title={p.advisorName}>{p.advisorName}</p>
            <p className="text-xs text-muted-foreground truncate" title={p.departmentName}>{p.departmentName}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'progress', 
      header: 'Progress', 
      render: (p) => (
        <div className="min-w-[140px]">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{p.progress}%</span>
          </div>
          <Progress value={p.progress} className="h-2" />
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (p) => <StatusBadge status={p.status} /> 
    },
    { 
      key: 'actions', 
      header: 'Actions', 
      render: (p) => (
        <div className="flex gap-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewActiveProject(p)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-0 h-8 w-8" asChild>
            <Link
              href="/dashboard/department-head/messages"
              title="Contact coordinator"
              aria-label="Contact coordinator"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )
    },
  ];

  const pastColumns: Column<PastProject>[] = [
    { 
      key: 'title', 
      header: 'Project', 
      render: (p) => (
        <div className="min-w-[300px]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Archive className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="font-medium hover:text-primary cursor-pointer truncate"
                onClick={() => handleViewPastProject(p)}
                title={p.title}
              >
                {p.title}
              </p>
              <p className="text-sm text-muted-foreground truncate">{p.groupName}</p>
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'academicYear', 
      header: 'Academic Year', 
      render: (p) => (
        <div className="min-w-[120px]">
          <p className="font-medium whitespace-nowrap">{p.academicYear}</p>
          <p className="text-xs text-muted-foreground truncate" title={p.departmentName}>{p.departmentName}</p>
        </div>
      )
    },
    { 
      key: 'completionDate', 
      header: 'Completed', 
      render: (p) => (
        <div className="min-w-[120px]">
          <p className="font-medium whitespace-nowrap">{new Date(p.completionDate).toLocaleDateString()}</p>
          <p className="text-xs text-muted-foreground whitespace-nowrap">Grade: {p.grade}%</p>
        </div>
      )
    },
    { 
      key: 'technologies', 
      header: 'Technologies', 
      render: (p) => (
        <div className="min-w-[150px]">
          <div className="flex flex-wrap gap-1">
            {p.metadata.technologies.slice(0, 2).map(tech => (
              <Badge key={tech} variant="secondary" className="text-xs whitespace-nowrap">{tech}</Badge>
            ))}
            {p.metadata.technologies.length > 2 && (
              <Badge variant="outline" className="text-xs whitespace-nowrap">+{p.metadata.technologies.length - 2}</Badge>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (p) => <StatusBadge status={p.status} /> 
    },
    { 
      key: 'actions', 
      header: 'Actions', 
      render: (p) => (
        <div className="flex gap-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => handleViewPastProject(p)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownloadDocument(p.documents.reports[0] ?? "/docs/final.pdf", `${p.title.replace(/\s+/g, "_")}_final.pdf`)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  const renderPastProjectDetails = (project: PastProject) => {
    return (
      <div className="min-h-screen bg-muted/30 overflow-y-auto">
        <div className="border-b bg-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
                <DashboardBackButton
                  onClick={() => {
                    setSelectedPastMemberName(null)
                    setShowPastDetails(false)
                  }}
                />
                <div className="hidden sm:block h-10 w-px bg-border shrink-0" />
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                    <Archive className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Completed project</p>
                    <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate" title={project.title}>
                      {project.title}
                    </h1>
                    <p className="text-sm text-muted-foreground truncate">{project.groupName}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Badge variant="outline" className="px-2.5 py-1 gap-1 font-normal">
                  <Calendar className="h-3.5 w-3.5" />
                  {project.academicYear}
                </Badge>
                <Badge variant="outline" className="px-2.5 py-1 font-semibold bg-emerald-500/10 text-emerald-700 border-emerald-200/60 dark:text-emerald-400">
                  Grade {project.grade}%
                </Badge>
                <StatusBadge status={project.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2 rounded-xl shadow-sm border-0 sm:border overflow-hidden">
              <CardHeader className="space-y-1 pb-4 border-b bg-muted/30">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Info className="h-4 w-4 text-primary" />
                  </span>
                  Project overview
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {project.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 px-4 py-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Details</h4>
                    <DetailRow label="Advisor" value={project.advisorName} />
                    <DetailRow label="Department" value={project.departmentName} />
                    <DetailRow label="Category" value={project.category} />
                    <DetailRow label="Budget" value={`$${project.budget?.toLocaleString() ?? "—"}`} />
                  </div>
                  <div className="rounded-lg border bg-muted/20 px-4 py-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Timeline</h4>
                    <DetailRow label="Start" value={new Date(project.startDate).toLocaleDateString()} />
                    <DetailRow label="Completed" value={new Date(project.completionDate).toLocaleDateString()} />
                    <DetailRow label="Academic year" value={project.academicYear} />
                    <DetailRow label="Final grade" value={`${project.grade}%`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-0 sm:border overflow-hidden">
              <CardHeader className="space-y-0 pb-3 border-b bg-muted/30">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </span>
                  Team ({project.students.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 max-h-[320px] overflow-y-auto [scrollbar-width:thin]">
                <div className="space-y-2">
                  {project.students.map((student) => (
                    <div
                      key={student}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2.5 transition-colors hover:bg-muted/40",
                        "sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-x-3"
                      )}
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                        {memberInitials(student)}
                      </div>
                      <span className="text-sm font-medium truncate min-w-0" title={student}>
                        {student}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 shrink-0 w-full sm:w-auto justify-center"
                        title={`View ${student}`}
                        onClick={() => setSelectedPastMemberName(student)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="rounded-xl shadow-sm border-0 sm:border overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Code className="h-4 w-4 text-primary" />
                  </span>
                  Technologies
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {project.metadata.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary" className="px-2.5 py-1 font-normal">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {project.metadata.awards && project.metadata.awards.length > 0 && (
              <Card className="rounded-xl shadow-sm border-0 sm:border overflow-hidden">
                <CardHeader className="pb-3 border-b bg-muted/30">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
                      <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </span>
                    Awards
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {project.metadata.awards.map((awardText, index) => (
                      <div key={index} className="flex items-center gap-2.5 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                        <Star className="h-4 w-4 text-amber-500 shrink-0 fill-amber-500/30" />
                        {awardText}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {project.metadata.publications && project.metadata.publications.length > 0 && (
            <Card className="rounded-xl shadow-sm border-0 sm:border overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </span>
                  Publications
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {project.metadata.publications.map((pub, index) => (
                    <div key={index} className="flex items-start gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="leading-snug">{pub}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-xl shadow-sm border-0 sm:border overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </span>
                Documents
              </CardTitle>
              <CardDescription className="text-xs">Download project documentation and resources</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {project.documents.srs && (
                  <DocumentButton icon={FileText} label="SRS Document" onClick={() => handleDownloadDocument(project.documents.srs!, "SRS.pdf")} />
                )}
                {project.documents.sdd && (
                  <DocumentButton icon={FileText} label="SDD Document" onClick={() => handleDownloadDocument(project.documents.sdd!, "SDD.pdf")} />
                )}
                {project.documents.reports.map((report, index) => (
                  <DocumentButton
                    key={`${report}-${index}`}
                    icon={FileText}
                    label={index === 0 ? "Final Report" : `Appendix ${index}`}
                    onClick={() => handleDownloadDocument(report, `Report_${index + 1}.pdf`)}
                  />
                ))}
                {project.documents.sourceCode && (
                  <DocumentButton icon={Code} label="Source Code" onClick={() => handleDownloadDocument(project.documents.sourceCode!, "source_code.zip")} />
                )}
                {project.documents.poster && (
                  <DocumentButton icon={FileText} label="Project Poster" onClick={() => handleDownloadDocument(project.documents.poster!, "poster.pdf")} />
                )}
                {project.documents.presentation && (
                  <DocumentButton icon={FileText} label="Presentation" onClick={() => handleDownloadDocument(project.documents.presentation!, "presentation.pptx")} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-primary/15 bg-gradient-to-br from-primary/5 via-transparent to-transparent overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 border border-primary/10">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <p className="text-sm font-semibold">Evaluator feedback</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{project.feedback}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 flex-wrap">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate" title={project.evaluatorNames.join(", ")}>
                      {project.evaluatorNames.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <PastProjectMemberDetailDialog
          member={selectedPastMemberName}
          project={project}
          open={selectedPastMemberName !== null}
          onClose={() => setSelectedPastMemberName(null)}
        />
      </div>
    )
  }

  const renderActiveProjectDetails = (project: Project) => {
    const teamMembers = project.groupMemberProfiles?.length
      ? project.groupMemberProfiles
      : project.groupMembers.map((name) => ({ name, avatarUrl: null }))

    return (
      <div className="min-h-screen bg-muted/30 overflow-y-auto">
        <div className="border-b bg-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
                <DashboardBackButton
                  onClick={() => {
                    setSelectedActiveMemberName(null)
                    setShowProjectCommentDialog(false)
                    setProjectCommentText("")
                    setShowActiveDetails(false)
                  }}
                />
                <div className="hidden sm:block h-10 w-px bg-border shrink-0" />
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Active project</p>
                    <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate" title={project.title}>
                      {project.title}
                    </h1>
                    <p className="text-sm text-muted-foreground truncate">{project.groupName}</p>
                    <div className="mt-3 max-w-md">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-primary">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <StatusBadge status={project.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2 rounded-xl shadow-sm border-0 sm:border overflow-hidden">
              <CardHeader className="space-y-1 pb-4 border-b bg-muted/30">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Info className="h-4 w-4 text-primary" />
                  </span>
                  Project overview
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {activeProjectDetailsQuery.isLoading && !activeProjectDetailsQuery.data
                    ? "Loading project details..."
                    : project.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 px-4 py-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Details</h4>
                    <DetailRow label="Advisor" value={project.advisorName} />
                    <DetailRow label="Department" value={project.departmentName} />
                    <DetailRow label="Budget" value={`$${project.budget?.toLocaleString() ?? "—"}`} />
                  </div>
                  <div className="rounded-lg border bg-muted/20 px-4 py-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Timeline</h4>
                    <DetailRow label="Start" value={formatOptionalDate(project.startDate)} />
                    <DetailRow label="Status" value={<StatusBadge status={project.status} />} />
                    <DetailRow label="Progress" value={`${project.progress}%`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-0 sm:border overflow-hidden">
              <CardHeader className="space-y-0 pb-3 border-b bg-muted/30">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </span>
                  Team ({teamMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 max-h-[320px] overflow-y-auto [scrollbar-width:thin]">
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div
                      key={member.name}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2.5 transition-colors hover:bg-muted/40",
                        "sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-x-3"
                      )}
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        {member.avatarUrl ? <AvatarImage src={member.avatarUrl} /> : null}
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {memberInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate min-w-0" title={member.name}>
                        {member.name}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 shrink-0 w-full sm:w-auto justify-center sm:justify-center"
                        title={`View ${member.name}`}
                        onClick={() => setSelectedActiveMemberName(member.name)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {project.technologies && project.technologies.length > 0 && (
            <Card className="rounded-xl shadow-sm border-0 sm:border overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Code className="h-4 w-4 text-primary" />
                  </span>
                  Technologies
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary" className="px-2.5 py-1 font-normal">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {project.milestones && project.milestones.length > 0 && (
            <Card className="rounded-xl shadow-sm border-0 sm:border overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <GitBranch className="h-4 w-4 text-primary" />
                  </span>
                  Milestones
                </CardTitle>
                <CardDescription className="text-xs">Key phases and due dates</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {project.milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="flex gap-4 rounded-lg border bg-muted/20 px-3 py-3 sm:px-4"
                    >
                      <div
                        className={cn(
                          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background",
                          milestone.status === "completed" && "bg-emerald-500",
                          milestone.status === "in-progress" && "bg-primary",
                          milestone.status === "pending" && "bg-muted-foreground/35"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <p className="text-sm font-medium leading-snug" title={milestone.name}>
                            {milestone.name}
                          </p>
                          <Badge variant="outline" className="w-fit text-[10px] capitalize shrink-0">
                            {milestone.status.replace("-", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due {new Date(milestone.dueDate).toLocaleDateString()}
                        </p>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {milestone.latestSubmission ? (
                            <DocumentButton
                              icon={Download}
                              label={`Submitted: ${milestone.latestSubmission.fileName}`}
                              onClick={() =>
                                handleDownloadDocument(
                                  milestone.latestSubmission!.fileUrl,
                                  milestone.latestSubmission!.fileName
                                )
                              }
                            />
                          ) : (
                            <div className="rounded-md border border-dashed border-border/70 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
                              No submission uploaded yet.
                            </div>
                          )}

                          {milestone.finalApprovedFile ? (
                            <DocumentButton
                              icon={Download}
                              label={`Approved: ${milestone.finalApprovedFile.fileName}`}
                              onClick={() =>
                                handleDownloadDocument(
                                  milestone.finalApprovedFile!.fileUrl,
                                  milestone.finalApprovedFile!.fileName
                                )
                              }
                            />
                          ) : (
                            <div className="rounded-md border border-dashed border-border/70 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
                              No approved file yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-xl shadow-sm border-0 sm:border overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-base font-semibold">Quick actions</CardTitle>
              <CardDescription className="text-xs">Shortcuts for this project</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <ActionButton
                  icon={FileText}
                  label="Download Report"
                  onClick={() => handleDownloadActiveSummary(project)}
                />
                <ActionButton
                  icon={Calendar}
                  label="Schedule Meeting"
                  onClick={() => toast("Schedule meeting", { description: "Calendar integration coming soon" })}
                />
                <ActionButton
                  icon={MessageSquare}
                  label="Comment"
                  onClick={() => setShowProjectCommentDialog(true)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showProjectCommentDialog} onOpenChange={setShowProjectCommentDialog}>
          <DialogContent
            showCloseButton
            className="sm:max-w-[440px] gap-0 overflow-hidden rounded-xl border-0 p-0 shadow-xl sm:rounded-xl"
          >
            <div className="border-b bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-6 pt-6 pb-4">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </span>
                  Comment
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  Leave a note for <span className="font-medium text-foreground">{project.title}</span>
                  . This is a UI preview only until messaging is connected.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="space-y-3 px-6 py-5">
              <Textarea
                placeholder="Write your comment for the project team…"
                value={projectCommentText}
                onChange={(e) => setProjectCommentText(e.target.value)}
                className="min-h-[132px] resize-none rounded-lg border-border/80 bg-muted/20 text-sm leading-relaxed focus-visible:ring-primary/30"
              />
            </div>
            <DialogFooter className="border-t bg-muted/20 px-6 py-4 sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowProjectCommentDialog(false)
                  setProjectCommentText("")
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="btn-gradient"
                onClick={() => {
                  const trimmed = projectCommentText.trim()
                  if (!trimmed) {
                    toast.error("Comment is empty", {
                      description: "Add some text before sending.",
                    })
                    return
                  }
                  toast.success("Comment sent", {
                    description: `Your note on “${project.title}” was recorded (demo).`,
                  })
                  setProjectCommentText("")
                  setShowProjectCommentDialog(false)
                }}
              >
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ActiveProjectMemberDetailDialog
          member={selectedActiveMemberName}
          project={project}
          open={selectedActiveMemberName !== null}
          onClose={() => setSelectedActiveMemberName(null)}
        />
      </div>
    )
  }

  if (showActiveDetails && selectedActiveProject) {
    const activeProjectForDetails = activeProjectDetailsQuery.data
      ? mapProjectDetailToActiveProject(activeProjectDetailsQuery.data, selectedActiveProject)
      : selectedActiveProject

    return renderActiveProjectDetails(activeProjectForDetails)
  }

  if (showPastDetails && selectedProject) {
    return renderPastProjectDetails(selectedProject)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Projects Overview"
        description="Monitor and manage all department projects, both active and completed"
        actions={
          <div className="flex gap-2 whitespace-nowrap">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* ── KPI row (aligned with standard dashboard cards) ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold mt-2">{renderOverviewValue(totalProjectsValue)}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className="text-xs bg-primary/10 text-primary whitespace-nowrap">
                    <Activity className="h-3 w-3 mr-1" />
                    Active: {renderOverviewValue(activeProjectsValue)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Done: {renderOverviewValue(completedProjectsValue)}
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold mt-2">{renderOverviewValue(activeProjectsValue)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-2">{renderOverviewValue(completedProjectsValue)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelled Projects</p>
                <p className="text-3xl font-bold mt-2">{renderOverviewValue(cancelledProjectsValue)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Archive className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search + Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-muted/40 border rounded-xl px-4 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by title, group, advisor or tags…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background border-0 shadow-sm h-9 text-sm"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── Projects Tabs ── */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "active" | "past")}
        className="space-y-4"
      >
        <TabsList className="h-10 bg-muted/50 p-1 rounded-xl gap-1">
          <TabsTrigger
            value="active"
            className="rounded-lg text-sm gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-5"
          >
            <Activity className="h-3.5 w-3.5" />
            Active
            <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary">
              {filteredActiveProjects.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-lg text-sm gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-5"
          >
            <Archive className="h-3.5 w-3.5" />
            Past
            <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[11px] font-semibold bg-muted-foreground/15 text-muted-foreground">
              {filteredPastProjects.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Activity className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Current Projects</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {filteredActiveProjects.length} active project{filteredActiveProjects.length !== 1 ? "s" : ""} in progress
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                  <Link href="/dashboard/department-head/projects/active">
                    View All <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[1200px]">
                <DataTable
                  data={filteredActiveProjects}
                  columns={activeColumns}
                  onRowClick={(row) => handleViewActiveProject(row as Project)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="mt-0">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                    <Archive className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Completed Projects</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {filteredPastProjects.length} archived project{filteredPastProjects.length !== 1 ? "s" : ""} with documentation
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                  <Link href="/dashboard/department-head/projects/archived">
                    View Archive <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[1200px]">
                <DataTable
                  data={filteredPastProjects}
                  columns={pastColumns}
                  onRowClick={(row) => handleViewPastProject(row as PastProject)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Quick Stats strip ── */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border bg-primary/5 border-primary/10 px-5 py-4">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Upcoming Deadlines</p>
            <p className="text-2xl font-bold mt-0.5">5</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Next: May 30, 2024</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-emerald-500/5 border-emerald-200/40 px-5 py-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Awaiting Review</p>
            <p className="text-2xl font-bold mt-0.5">3</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pending evaluation</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-muted/40 px-5 py-4">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <PieChart className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Top Categories</p>
            <p className="text-2xl font-bold mt-0.5">6</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">AI, IoT, Blockchain…</p>
          </div>
        </div>
      </div>

    </div>
  );
}