"use client"

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StatusBadge from '@/components/shared/StatusBadge'
import {
  UserPlus,
  Search,
  Archive,
  FolderKanban,
  GraduationCap,
  Users,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  ArrowLeft,
  Filter,
  ChevronRight,
  TrendingUp,
  ClipboardCheck,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { mockUsers, type ProjectSummary } from '@/data/mockData'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useAssignProjectAdvisor, useDepartmentProjectAdvisors, useDepartmentProjectsOverview } from '@/lib/hooks/use-projects'
import { useCoordinatorAdvisorOverview } from '@/lib/hooks/use-coordinator-analytics'
import { useDepartmentProjectProposals } from '@/lib/hooks/use-project-proposals'
import type { DepartmentProjectAdvisorDirectoryItem } from '@/types/projects'
import type { ProjectProposal, ProposalParty } from '@/types/project-proposals'
import type { CoordinatorAdvisorOverviewAdvisor } from '@/types/advisor-analytics'

type AssignmentProject = ProjectSummary & {
  projectId?: string
  isLegacyApprovedWithoutProject?: boolean
  advisorId?: string
  advisorName?: string
  advisorAvatarUrl?: string | null
  memberNames?: string[]
  evaluatorIds: string[]
}

type AssignmentOverride = {
  advisorId?: string
  advisorName?: string
  advisorAvatarUrl?: string | null
  evaluatorIds: string[]
}

type AdvisorOption = {
  id: string
  userId: string
  name: string
  email: string
  avatarUrl?: string | null
  loadLimit: number
  currentLoad: number
}

function formatAdvisorName(advisor: DepartmentProjectAdvisorDirectoryItem) {
  const firstName = advisor.user?.firstName?.trim() ?? ''
  const lastName = advisor.user?.lastName?.trim() ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  return fullName || advisor.user?.email?.trim() || 'Advisor'
}

function formatProposalPersonName(person?: ProposalParty | null) {
  if (!person) return ''

  const firstName = person.firstName?.trim() ?? ''
  const lastName = person.lastName?.trim() ?? ''
  return [firstName, lastName].filter(Boolean).join(' ').trim() || person.email?.trim() || ''
}

function initialsFromName(value?: string | null) {
  const parts = String(value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
}

function normalizeProjectLookupValue(value?: string | null) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function buildProjectLookupKey(title?: string | null, groupName?: string | null) {
  return `${normalizeProjectLookupValue(title)}::${normalizeProjectLookupValue(groupName)}`
}

function resolveProposalDisplayTitle(proposal: ProjectProposal) {
  const proposedTitles = (proposal.proposedTitles ?? proposal.titles ?? [])
    .map((title) => title.trim())
    .filter(Boolean)
  const selectedIndex = proposal.selectedTitleIndex ?? null
  const selectedTitle =
    selectedIndex !== null && selectedIndex >= 0 ? proposedTitles[selectedIndex] : undefined

  return proposal.title?.trim() || selectedTitle || proposedTitles[0] || 'Untitled proposal'
}

function buildVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, totalPages]
  }

  if (currentPage >= totalPages - 2) {
    return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, currentPage - 1, currentPage, currentPage + 1, totalPages]
}

function formatAnalyticsAdvisorName(advisor: CoordinatorAdvisorOverviewAdvisor) {
  const fullName = advisor.fullName?.trim() ?? ''
  if (fullName) return fullName

  const firstName = advisor.firstName?.trim() ?? ''
  const lastName = advisor.lastName?.trim() ?? ''
  return [firstName, lastName].filter(Boolean).join(' ').trim() || advisor.email.trim() || 'Advisor'
}

const PROJECT_ASSIGNMENTS_PAGE_SIZE = 6
const ADVISOR_WORKLOAD_PAGE_SIZE = 5

function collectProposalMemberNames(proposal: ProjectProposal) {
  const names = new Set<string>()

  const leaderName = formatProposalPersonName(proposal.projectGroup?.leader)
  if (leaderName) {
    names.add(leaderName)
  }

  for (const member of proposal.projectGroup?.members ?? []) {
    const memberName = formatProposalPersonName(member.user)
    if (memberName) {
      names.add(memberName)
    }
  }

  const submitterName = formatProposalPersonName(proposal.submitter)
  if (!names.size && submitterName) {
    names.add(submitterName)
  }

  return Array.from(names)
}

function mapApprovedProposalToAssignmentProject(
  proposal: ProjectProposal,
  advisors: AdvisorOption[],
  override?: AssignmentOverride
): AssignmentProject {
  const projectId = proposal.project?.id?.trim() || undefined
  const advisorFromProposal = proposal.advisor
  const advisorUserId = proposal.project?.advisorId?.trim() || proposal.advisorId?.trim() || ''
  const advisorFromDirectory = advisorUserId
    ? advisors.find((advisor) => advisor.id === advisorUserId)
    : undefined
  const advisorName =
    override?.advisorName ||
    formatProposalPersonName(advisorFromProposal) ||
    advisorFromDirectory?.name ||
    ''
  const advisorAvatarUrl =
    override?.advisorAvatarUrl ?? advisorFromProposal?.avatarUrl ?? advisorFromDirectory?.avatarUrl ?? null

  return {
    id: proposal.id,
    projectId,
    isLegacyApprovedWithoutProject: !projectId,
    title: resolveProposalDisplayTitle(proposal),
    status: proposal.project?.status?.trim().toLowerCase().replace(/_/g, '-') || 'approved',
    groupName: proposal.projectGroup?.name?.trim() || 'Student Group',
    advisorId: override?.advisorId ?? advisorUserId,
    advisorName,
    advisorAvatarUrl,
    memberNames: collectProposalMemberNames(proposal),
    evaluatorIds: override?.evaluatorIds ?? [],
    progress: undefined,
  }
}

/* ─── Assignment Dialog ─────────────────────────────────────────────────── */
interface AssignmentDialogProps {
  project: AssignmentProject
  advisors: AdvisorOption[]
  onClose: () => void
  onAssign: (advisorId: string, evaluatorIds: string[]) => void
  open: boolean
}

function AssignmentDialog({ project, advisors, onClose, onAssign, open }: AssignmentDialogProps) {
  const [selectedAdvisor, setSelectedAdvisor] = useState(project.advisorId || '')
  const [selectedEvaluators, setSelectedEvaluators] = useState<string[]>(project.evaluatorIds || [])

  const prevAdvisorRef = React.useRef(project.advisorId || '')
  const prevEvaluatorsRef = React.useRef(project.evaluatorIds || [])

  useEffect(() => {
    prevAdvisorRef.current = project.advisorId || ''
    prevEvaluatorsRef.current = project.evaluatorIds || []
  }, [project.advisorId, project.evaluatorIds])

  useEffect(() => {
    if (open) {
      setSelectedAdvisor(prevAdvisorRef.current)
      setSelectedEvaluators(prevEvaluatorsRef.current)
    }
  }, [open])
  const evaluators = mockUsers.filter(u => u.role === 'evaluator')

  const toggleEvaluator = (id: string) => {
    if (!selectedAdvisor) {
      toast.error('Select an advisor first before adding evaluators.')
      return
    }
    setSelectedEvaluators(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  return (
    <DialogContent onInteractOutside={onClose} onEscapeKeyDown={onClose}>
      <DialogHeader>
        <DialogTitle>Assign Team</DialogTitle>
        <DialogDescription className="line-clamp-1">{project.title}</DialogDescription>
      </DialogHeader>

      <div className="space-y-5 py-2">
        {/* Advisor */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Primary Advisor</Label>
          <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select advisor" />
            </SelectTrigger>
            <SelectContent>
              {advisors.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 shrink-0">
                      {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.name} /> : null}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {a.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{a.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Evaluators */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Evaluators <span className="text-muted-foreground/60 normal-case">({selectedEvaluators.length} selected)</span>
          </Label>
          <div className="grid gap-2">
            {evaluators.map(e => {
              const selected = selectedEvaluators.includes(e.id)
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggleEvaluator(e.id)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                    selected
                      ? 'border-primary/40 bg-primary/5 text-foreground'
                      : 'border-border bg-background hover:bg-muted/40'
                  } ${!selectedAdvisor ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className={`text-xs font-semibold ${selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {e.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.email}</p>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 shrink-0 transition-colors ${selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                    {selected && <CheckCircle2 className="h-full w-full text-primary-foreground" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gap-2" onClick={() => onAssign(selectedAdvisor, selectedEvaluators)} disabled={!selectedAdvisor}>
            <UserPlus className="h-4 w-4" /> Save Assignment
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}

/* ─── Project Card ──────────────────────────────────────────────────────── */
function ProjectCard({
  project,
  onAssign,
}: {
  project: AssignmentProject
  onAssign: (p: AssignmentProject) => void
}) {
  const evaluators = mockUsers.filter(u => u.role === 'evaluator' && project.evaluatorIds.includes(u.id))
  const isAssigned = Boolean(project.advisorName)
  const isComplete = project.status === 'completed'
  const isLegacyApprovedWithoutProject = Boolean(project.isLegacyApprovedWithoutProject)
  const visibleMembers = project.memberNames?.slice(0, 4) ?? []
  const remainingMembers = Math.max((project.memberNames?.length ?? 0) - visibleMembers.length, 0)

  return (
    <div className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-110">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{project.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{project.groupName || 'Student Group'}</p>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.memberNames && project.memberNames.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/[0.35] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Group Members</p>
            <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {project.memberNames.length} member{project.memberNames.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {visibleMembers.map((member) => (
              <div
                key={`${project.id}-${member}`}
                className="inline-flex max-w-full items-center gap-2 rounded-full border bg-background px-2.5 py-1 text-xs text-foreground shadow-sm transition-colors group-hover:border-primary/15"
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                    {initialsFromName(member)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{member}</span>
              </div>
            ))}
            {remainingMembers > 0 && (
              <div className="inline-flex items-center rounded-full border border-dashed bg-background px-2.5 py-1 text-xs text-muted-foreground">
                +{remainingMembers} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress */}
      {project.progress !== undefined && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>
      )}

      {/* Advisor & Evaluators */}
      <div className="grid gap-2 sm:grid-cols-2 text-sm">
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
          {isAssigned ? (
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9 shrink-0 ring-2 ring-background shadow-sm">
                {project.advisorAvatarUrl ? <AvatarImage src={project.advisorAvatarUrl} alt={project.advisorName} /> : null}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initialsFromName(project.advisorName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Advisor</p>
                <p className="truncate font-medium text-foreground">{project.advisorName}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Advisor</p>
                <p className="text-muted-foreground italic">No advisor yet</p>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
          {evaluators.length > 0 ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex -space-x-2 shrink-0">
                {evaluators.slice(0, 3).map(e => (
                  <Avatar key={e.id} className="h-7 w-7 border-2 border-card shadow-sm">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initialsFromName(e.name)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Evaluators</p>
                <p className="text-xs text-foreground">
                  {evaluators.length} evaluator{evaluators.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Star className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Evaluators</p>
                <p className="text-muted-foreground italic text-xs">No evaluators</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Badge
          variant={
            isLegacyApprovedWithoutProject
              ? 'secondary'
              : isComplete
                ? 'secondary'
                : isAssigned
                  ? 'outline'
                  : 'destructive'
          }
          className="text-xs"
        >
          {isLegacyApprovedWithoutProject
            ? 'Legacy Item'
            : isComplete
              ? 'Completed'
              : isAssigned
                ? 'Assigned'
                : 'Needs Assignment'}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs hover:border-primary hover:text-primary"
          disabled={isLegacyApprovedWithoutProject}
          onClick={() => onAssign(project)}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {isLegacyApprovedWithoutProject ? 'Legacy Item' : isAssigned ? 'Reassign' : 'Assign Team'}
        </Button>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function ProjectsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [assignmentOverrides, setAssignmentOverrides] = useState<Record<string, AssignmentOverride>>({})
  const [dialogProject, setDialogProject] = useState<AssignmentProject | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [advisorFilter, setAdvisorFilter] = useState('all')
  const [projectPage, setProjectPage] = useState(1)
  const [advisorWorkloadPage, setAdvisorWorkloadPage] = useState(1)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const overviewQuery = useDepartmentProjectsOverview({
    departmentId,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })
  const departmentAdvisorsQuery = useDepartmentProjectAdvisors({
    departmentId,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })
  const proposalsQuery = useDepartmentProjectProposals({
    departmentId,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })
  const advisorOverviewQuery = useCoordinatorAdvisorOverview({
    departmentId,
    enabled: Boolean(accessToken) && Boolean(departmentId),
    page: advisorWorkloadPage,
    limit: ADVISOR_WORKLOAD_PAGE_SIZE,
  })
  const assignProjectAdvisorMutation = useAssignProjectAdvisor()

  const advisors = useMemo<AdvisorOption[]>(() => {
    return (departmentAdvisorsQuery.data ?? []).map((advisor) => ({
      id: advisor.userId,
      userId: advisor.userId,
      name: formatAdvisorName(advisor),
      email: advisor.user?.email?.trim() || '',
      avatarUrl: advisor.user?.avatarUrl ?? null,
      loadLimit: advisor.loadLimit ?? 0,
      currentLoad: advisor.currentLoad ?? 0,
    }))
  }, [departmentAdvisorsQuery.data])
  const evaluators = mockUsers.filter(u => u.role === 'evaluator')

  const projects = useMemo<AssignmentProject[]>(() => {
    return (proposalsQuery.data?.items ?? [])
      .filter((proposal) => String(proposal.status ?? '').trim().toUpperCase() === 'APPROVED')
      .map((proposal) => {
        return mapApprovedProposalToAssignmentProject(
          proposal,
          advisors,
          assignmentOverrides[proposal.id]
        )
      })
  }, [advisors, assignmentOverrides, proposalsQuery.data?.items])

  const handleAssign = useCallback(async (advisorId: string, evaluatorIds: string[]) => {
    const advisor = advisors.find(u => u.id === advisorId)
    const advisorName = advisor?.name || 'Unknown'
    const advisorAvatarUrl = advisor?.avatarUrl ?? null
    if (!dialogProject) {
      return
    }

    if (!dialogProject.projectId) {
      toast.error('Advisor assignment is unavailable for this card yet.', {
        description: 'This is a legacy approved proposal with no linked project record yet.',
      })
      return
    }

    try {
      await assignProjectAdvisorMutation.mutateAsync({
        projectId: dialogProject.projectId,
        dto: { advisorId },
      })
    } catch (error) {
      toast.error('Failed to save advisor assignment', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
      return
    }

    setAssignmentOverrides((prev) => ({
      ...prev,
      [dialogProject.id]: {
        advisorId,
        advisorName,
        advisorAvatarUrl,
        evaluatorIds,
      },
    }))
    toast.success('Advisor assignment saved', {
      description: evaluatorIds.length > 0
        ? `${advisorName} was assigned. Evaluator selections remain local on this page.`
        : `${advisorName} was assigned to "${dialogProject.title}".`,
    })
    setDialogOpen(false)
    setDialogProject(null)
  }, [advisors, assignProjectAdvisorMutation, dialogProject])

  const openAssign = (p: AssignmentProject) => {
    setDialogProject({ ...p })
    setDialogOpen(true)
  }

  // Filtered projects
  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.groupName || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.memberNames || []).some((member) => member.toLowerCase().includes(search.toLowerCase())) ||
        (p.advisorName || '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      const matchAdvisor = advisorFilter === 'all' || p.advisorId === advisorFilter
      return matchSearch && matchStatus && matchAdvisor
    })
  }, [projects, search, statusFilter, advisorFilter])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setProjectPage(1)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setProjectPage(1)
  }

  const handleAdvisorFilterChange = (value: string) => {
    setAdvisorFilter(value)
    setProjectPage(1)
  }

  const handleClearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setAdvisorFilter("all")
    setProjectPage(1)
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAdvisorWorkloadPage(1)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [departmentId])

  // Stats
  const stats = useMemo(() => ({
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'active' || p.status === 'approved').length,
    completed: projects.filter(p => p.status === 'completed').length,
    unassigned: projects.filter(p => !p.advisorName).length,
    needsEvaluator: projects.filter(p => p.evaluatorIds.length === 0).length,
  }), [projects])

  const activeProjectsValue = overviewQuery.data?.activeProjects ?? 0
  const completedProjectsValue = overviewQuery.data?.completedProjects ?? 0
  const approvedProposalsValue = useMemo(() => {
    return (proposalsQuery.data?.items ?? []).filter((proposal) => {
      return String(proposal.status ?? '').trim().toUpperCase() === 'APPROVED'
    }).length
  }, [proposalsQuery.data?.items])

  const needsAdvisorProposalsValue = useMemo(() => {
    return (proposalsQuery.data?.items ?? []).filter((proposal) => {
      const status = String(proposal.status ?? '').trim().toUpperCase()
      const advisorId = proposal.advisorId?.trim()
      return status === 'APPROVED' && !advisorId
    }).length
  }, [proposalsQuery.data?.items])

  const renderMetricValue = (value: number, loading: boolean) => {
    if (loading) {
      return '...'
    }

    return value
  }

  // Advisor workload
  const advisorWorkload = useMemo(() => {
    const analyticsAdvisors = advisorOverviewQuery.data?.advisors ?? []

    if (analyticsAdvisors.length > 0) {
      return analyticsAdvisors.map((advisor) => ({
        id: advisor.advisorId,
        name: formatAnalyticsAdvisorName(advisor),
        email: advisor.email,
        avatarUrl: advisor.avatarUrl,
        loadLimit: advisor.loadLimit,
        currentLoad: advisor.currentLoad,
        assigned: advisor.metrics.totalProjectsAdvising,
        inProgress: advisor.metrics.activeProjectsCount,
        completed: advisor.metrics.completedProjectsCount,
        avgProg: advisor.metrics.overallProjectProgress,
      }))
    }

    return advisors.map((advisor) => ({
      ...advisor,
      assigned: advisor.currentLoad,
      inProgress: advisor.currentLoad,
      completed: 0,
      avgProg: 0,
    }))
  }, [advisorOverviewQuery.data?.advisors, advisors])

  const totalProjectPages = Math.max(1, Math.ceil(filtered.length / PROJECT_ASSIGNMENTS_PAGE_SIZE))
  const safeProjectPage = Math.min(projectPage, totalProjectPages)
  const visibleProjectPageNumbers = buildVisiblePageNumbers(safeProjectPage, totalProjectPages)
  const paginatedProjects = useMemo(() => {
    const startIndex = (safeProjectPage - 1) * PROJECT_ASSIGNMENTS_PAGE_SIZE
    return filtered.slice(startIndex, startIndex + PROJECT_ASSIGNMENTS_PAGE_SIZE)
  }, [filtered, safeProjectPage])
  const projectRangeStart = filtered.length === 0 ? 0 : (safeProjectPage - 1) * PROJECT_ASSIGNMENTS_PAGE_SIZE + 1
  const projectRangeEnd = filtered.length === 0
    ? 0
    : Math.min((safeProjectPage - 1) * PROJECT_ASSIGNMENTS_PAGE_SIZE + paginatedProjects.length, filtered.length)

  const advisorWorkloadPagination = advisorOverviewQuery.data?.pagination
  const fallbackAdvisorWorkloadTotalPages = Math.max(1, Math.ceil(advisorWorkload.length / ADVISOR_WORKLOAD_PAGE_SIZE))
  const safeAdvisorWorkloadPage = Math.min(advisorWorkloadPage, fallbackAdvisorWorkloadTotalPages)
  const displayedAdvisorWorkload = advisorWorkloadPagination
    ? advisorWorkload
    : advisorWorkload.slice(
        (safeAdvisorWorkloadPage - 1) * ADVISOR_WORKLOAD_PAGE_SIZE,
        safeAdvisorWorkloadPage * ADVISOR_WORKLOAD_PAGE_SIZE
      )
  const advisorWorkloadCurrentPage = advisorWorkloadPagination?.page ?? safeAdvisorWorkloadPage
  const advisorWorkloadTotalPages = advisorWorkloadPagination?.totalPages ?? fallbackAdvisorWorkloadTotalPages
  const visibleAdvisorWorkloadPageNumbers = buildVisiblePageNumbers(advisorWorkloadCurrentPage, advisorWorkloadTotalPages)
  const advisorWorkloadTotalItems = advisorWorkloadPagination?.totalItems ?? advisorWorkload.length
  const advisorWorkloadRangeStart = advisorWorkloadTotalItems === 0
    ? 0
    : (advisorWorkloadCurrentPage - 1) * ADVISOR_WORKLOAD_PAGE_SIZE + 1
  const advisorWorkloadRangeEnd = advisorWorkloadTotalItems === 0
    ? 0
    : Math.min(
        (advisorWorkloadCurrentPage - 1) * ADVISOR_WORKLOAD_PAGE_SIZE + displayedAdvisorWorkload.length,
        advisorWorkloadTotalItems
      )

  // Evaluator workload
  const evaluatorWorkload = useMemo(() => evaluators.map(e => {
    const assigned = projects.filter(p => p.evaluatorIds.includes(e.id))
    return { ...e, assigned: assigned.length }
  }), [evaluators, projects])

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Project Assignments
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Assign advisors and evaluators to all student projects
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
          <Badge variant="secondary" className="gap-1.5">
            <FolderKanban className="h-3.5 w-3.5" /> {stats.total} Projects
          </Badge>
          {stats.unassigned > 0 && (
            <Badge variant="destructive" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> {stats.unassigned} Unassigned
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Active Projects',   value: renderMetricValue(activeProjectsValue, overviewQuery.isLoading), icon: FolderKanban, bg: 'bg-primary/10',     color: 'text-primary' },
          { label: 'Completed Projects', value: renderMetricValue(completedProjectsValue, overviewQuery.isLoading), icon: CheckCircle2, bg: 'bg-muted',          color: 'text-foreground' },
          { label: 'Approved Proposal Titles', value: renderMetricValue(approvedProposalsValue, proposalsQuery.isLoading), icon: Archive,       bg: 'bg-primary/[0.06]', color: 'text-primary/80' },
          { label: 'Needs Advisor',     value: renderMetricValue(needsAdvisorProposalsValue, proposalsQuery.isLoading), icon: AlertTriangle,  bg: 'bg-destructive/10',  color: 'text-destructive' },
          { label: 'Needs Evaluator',   value: stats.needsEvaluator,icon: Star,           bg: 'bg-destructive/10',  color: 'text-destructive' },
        ].map(s => (
          <Card key={s.label} className="group border-none shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`h-10 w-10 rounded-full ${s.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">

        {/* Left: Project List */}
        <div className="space-y-4">

          {/* Search & Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, group, or advisor…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="h-10 w-40">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={advisorFilter} onValueChange={handleAdvisorFilterChange}>
                <SelectTrigger className="h-10 w-44">
                  <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Advisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Advisors</SelectItem>
                  {advisors.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5 shrink-0">
                          {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.name} /> : null}
                          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                            {a.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{a.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results label */}
          {(search || statusFilter !== 'all' || advisorFilter !== 'all') && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{filtered.length} result{filtered.length !== 1 ? 's' : ''} found</span>
              <Button
                variant="ghost" size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleClearFilters}
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* Cards grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed">
              <FolderKanban className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No projects match your filters</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting the search or filter criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {projectRangeStart}-{projectRangeEnd} of {filtered.length} project{filtered.length !== 1 ? 's' : ''}
                </span>
                <span>
                  Page {safeProjectPage} of {totalProjectPages}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {paginatedProjects.map(p => (
                  <ProjectCard key={p.id} project={p} onAssign={openAssign} />
                ))}
              </div>

              <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Project assignment pages
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeProjectPage <= 1}
                    onClick={() => setProjectPage((value) => Math.max(value - 1, 1))}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {visibleProjectPageNumbers.map((pageNumber, index) => {
                      const previousPage = visibleProjectPageNumbers[index - 1]
                      const showGap = index > 0 && previousPage !== undefined && pageNumber - previousPage > 1

                      return (
                        <React.Fragment key={pageNumber}>
                          {showGap && <span className="px-1 text-xs text-muted-foreground">...</span>}
                          <Button
                            variant={pageNumber === safeProjectPage ? 'default' : 'outline'}
                            size="sm"
                            className="min-w-9 px-0"
                            onClick={() => setProjectPage(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        </React.Fragment>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeProjectPage >= totalProjectPages}
                    onClick={() => setProjectPage((value) => Math.min(value + 1, totalProjectPages))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">

          <Tabs defaultValue="advisors">
            <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="advisors" className="text-xs gap-1.5 shrink-0">
                <Users className="h-3.5 w-3.5" /> Advisors
              </TabsTrigger>
              <TabsTrigger value="evaluators" className="text-xs gap-1.5 shrink-0">
                <Star className="h-3.5 w-3.5" /> Evaluators
              </TabsTrigger>
            </TabsList>

            {/* Advisor workload */}
            <TabsContent value="advisors">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Advisor Workload
                  </CardTitle>
                  <CardDescription>Projects per advisor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {advisorOverviewQuery.isLoading && advisorWorkload.length === 0 ? (
                    Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className="space-y-2.5">
                        {index > 0 && <Separator className="mb-4" />}
                        <div className="h-8 w-full rounded bg-muted animate-pulse" />
                        <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
                        <div className="h-2 w-full rounded bg-muted animate-pulse" />
                      </div>
                    ))
                  ) : advisorWorkload.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No advisor workload data available.</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Showing {advisorWorkloadRangeStart}-{advisorWorkloadRangeEnd} of {advisorWorkloadTotalItems} advisor{advisorWorkloadTotalItems !== 1 ? 's' : ''}
                        </span>
                        <span>
                          Page {advisorWorkloadCurrentPage} of {advisorWorkloadTotalPages}
                        </span>
                      </div>

                      {displayedAdvisorWorkload.map((a, i) => (
                        <div key={a.id}>
                          {i > 0 && <Separator className="mb-4" />}
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 shrink-0">
                                {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.name} /> : null}
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                  {a.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{a.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              <div className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                                {a.assigned} total
                              </div>
                              <div className="rounded-full bg-muted text-foreground px-2.5 py-0.5 text-xs font-medium">
                                {a.inProgress} active
                              </div>
                              <div className="rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-xs">
                                {a.completed} done
                              </div>
                            </div>

                            {a.assigned > 0 ? (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Avg progress</span>
                                  <span className="font-medium">{a.avgProg}%</span>
                                </div>
                                <Progress value={a.avgProg} className="h-1.5" />
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No projects assigned</p>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="flex flex-col gap-3 rounded-xl border bg-card px-3 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={advisorWorkloadCurrentPage <= 1 || advisorOverviewQuery.isLoading}
                            onClick={() => setAdvisorWorkloadPage((value) => Math.max(value - 1, 1))}
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {visibleAdvisorWorkloadPageNumbers.map((pageNumber, index) => {
                              const previousPage = visibleAdvisorWorkloadPageNumbers[index - 1]
                              const showGap = index > 0 && previousPage !== undefined && pageNumber - previousPage > 1

                              return (
                                <React.Fragment key={pageNumber}>
                                  {showGap && <span className="px-1 text-xs text-muted-foreground">...</span>}
                                  <Button
                                    variant={pageNumber === advisorWorkloadCurrentPage ? 'default' : 'outline'}
                                    size="sm"
                                    className="min-w-9 px-0"
                                    disabled={advisorOverviewQuery.isLoading}
                                    onClick={() => setAdvisorWorkloadPage(pageNumber)}
                                  >
                                    {pageNumber}
                                  </Button>
                                </React.Fragment>
                              )
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={advisorWorkloadCurrentPage >= advisorWorkloadTotalPages || advisorOverviewQuery.isLoading}
                            onClick={() => setAdvisorWorkloadPage((value) => Math.min(value + 1, advisorWorkloadTotalPages))}
                          >
                            Next
                          </Button>
                        </div>
                      </div>

                      {advisorOverviewQuery.error && (
                        <p className="text-xs text-muted-foreground">
                          Live advisor workload could not be refreshed. Showing fallback values.
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Evaluator workload */}
            <TabsContent value="evaluators">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Evaluator Workload
                  </CardTitle>
                  <CardDescription>Projects per evaluator</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {evaluatorWorkload.map((e, i) => (
                    <div key={e.id}>
                      {i > 0 && <Separator />}
                      <div className="flex items-center gap-2.5 pt-3">
                        <div className="relative shrink-0">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {e.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-background border flex items-center justify-center">
                            <Star className="h-2 w-2 text-primary fill-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{e.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{e.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-primary">{e.assigned}</p>
                          <p className="text-xs text-muted-foreground">project{e.assigned !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick links */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0">
              {[
                { href: '/dashboard/coordinator/advisor-progress', icon: TrendingUp, label: 'Advisor Analytics' },
                { href: '/dashboard/coordinator/evaluator-progress', icon: ClipboardCheck, label: 'Evaluator Progress' },
                { href: '/dashboard/coordinator/notify-advisors', icon: Users, label: 'Notify Advisors' },
                { href: '/dashboard/coordinator/notify-evaluators', icon: Star, label: 'Notify Evaluators' },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer">
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </div>
                </Link>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setDialogProject(null)
        }}>
          {dialogProject && (
            <AssignmentDialog
              project={dialogProject}
              advisors={advisors}
            onClose={() => { setDialogOpen(false); setDialogProject(null) }}
              onAssign={handleAssign}
              open={dialogOpen}
            />
          )}
        </Dialog>
    </div>
  )
}
