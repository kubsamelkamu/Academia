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
  AlertTriangle,
  BarChart3,
  ArrowLeft,
  Filter,
  ChevronRight,
  TrendingUp,
  ClipboardCheck,
  RefreshCw,
  Bell,
  LayoutGrid,
  List,
  Mail,
  ExternalLink,
  MoreVertical,
  History,
  Info,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { type ProjectSummary } from '@/data/mockData'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { getProjectEvaluators } from '@/lib/api/projects'
import {
  useAssignProjectAdvisor,
  useDepartmentProjectAdvisors,
  useDepartmentProjectsOverview,
  useProjectAssignmentSummary,
  useProjectEligibleEvaluators,
  useProjectEvaluators,
  useRemoveProjectEvaluator,
  useUpdateProjectEvaluators,
} from '@/lib/hooks/use-projects'
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
  evaluatorProfiles?: EvaluatorOption[]
}

type AssignmentOverride = {
  advisorId?: string
  advisorName?: string
  advisorAvatarUrl?: string | null
  evaluatorIds: string[]
  evaluatorProfiles?: EvaluatorOption[]
}

type EvaluatorOption = {
  id: string
  userId: string
  name: string
  email: string
  avatarUrl?: string | null
  status?: string | null
  loadLimit: number
  currentLoad: number
  departmentId: string
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

function formatEligibleEvaluatorName(firstName?: string | null, lastName?: string | null, email?: string | null) {
  const first = firstName?.trim() ?? ''
  const last = lastName?.trim() ?? ''
  const fullName = [first, last].filter(Boolean).join(' ').trim()
  return fullName || email?.trim() || 'Evaluator'
}

function formatAssignedEvaluatorName(evaluator: { userId: string; user?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null }) {
  return formatEligibleEvaluatorName(evaluator.user?.firstName, evaluator.user?.lastName, evaluator.user?.email) || evaluator.userId
}

function resolveAssignedEvaluatorDisplay(
  evaluator: {
    userId: string
    user?: {
      firstName?: string | null
      lastName?: string | null
      email?: string | null
      avatarUrl?: string | null
      status?: string | null
    } | null
  },
  eligibleFallback?: EvaluatorOption | null
) {
  const fallbackName = eligibleFallback?.name?.trim() || ''
  const fallbackEmail = eligibleFallback?.email?.trim() || ''
  const fallbackAvatarUrl = eligibleFallback?.avatarUrl ?? null

  const name =
    formatEligibleEvaluatorName(evaluator.user?.firstName, evaluator.user?.lastName, evaluator.user?.email) ||
    fallbackName ||
    evaluator.user?.email?.trim() ||
    fallbackEmail ||
    evaluator.userId

  const email = evaluator.user?.email?.trim() || fallbackEmail || ''
  const avatarUrl = evaluator.user?.avatarUrl ?? fallbackAvatarUrl

  return { name, email, avatarUrl }
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
    evaluatorProfiles: override?.evaluatorProfiles ?? [],
    progress: undefined,
  }
}

/* ─── Assignment Dialog ─────────────────────────────────────────────────── */
interface AssignmentDialogProps {
  project: AssignmentProject
  advisors: AdvisorOption[]
  onClose: () => void
  onAssign: (advisorId: string, evaluatorIds: string[], evaluatorProfiles: EvaluatorOption[]) => void
  open: boolean
}

function AssignmentDialog({ project, advisors, onClose, onAssign, open }: AssignmentDialogProps) {
  const [selectedAdvisor, setSelectedAdvisor] = useState(project.advisorId || '')
  const [selectedEvaluatorsOverride, setSelectedEvaluatorsOverride] = useState<string[] | null>(null)
  const [activeEvaluatorId, setActiveEvaluatorId] = useState('')
  const initializedAssignedEvaluatorsRef = React.useRef<string | null>(null)
  const removeEvaluatorMutation = useRemoveProjectEvaluator()

  const eligibleEvaluatorsQuery = useProjectEligibleEvaluators({
    projectId: project.projectId,
    enabled: open && Boolean(project.projectId),
  })

  const assignedEvaluatorsQuery = useProjectEvaluators({
    projectId: project.projectId,
    enabled: open && Boolean(project.projectId),
  })

  const evaluatorOptions = useMemo<EvaluatorOption[]>(() => {
    return (eligibleEvaluatorsQuery.data?.eligible ?? []).map((item) => ({
      id: item.id,
      userId: item.userId,
      departmentId: item.departmentId,
      name: formatEligibleEvaluatorName(item.user?.firstName, item.user?.lastName, item.user?.email),
      email: item.user?.email?.trim() || 'No email available',
      avatarUrl: item.user?.avatarUrl ?? null,
      status: item.user?.status ?? null,
      loadLimit: item.loadLimit ?? 0,
      currentLoad: item.currentLoad ?? 0,
    }))
  }, [eligibleEvaluatorsQuery.data?.eligible])

  const evaluatorByUserId = useMemo(() => {
    return new Map(evaluatorOptions.map((evaluator) => [evaluator.userId, evaluator]))
  }, [evaluatorOptions])

  const assignedEvaluatorIds = useMemo(
    () => (assignedEvaluatorsQuery.data?.evaluators ?? []).map((evaluator) => evaluator.userId).filter(Boolean),
    [assignedEvaluatorsQuery.data?.evaluators],
  )

  const selectedEvaluators = useMemo(() => {
    if (selectedEvaluatorsOverride !== null) {
      return selectedEvaluatorsOverride
    }

    if (!open) {
      return project.evaluatorIds || []
    }

    if (project.projectId && !assignedEvaluatorsQuery.isLoading && !assignedEvaluatorsQuery.error) {
      return assignedEvaluatorIds
    }

    return project.evaluatorIds || []
  }, [assignedEvaluatorsQuery.error, assignedEvaluatorsQuery.isLoading, assignedEvaluatorIds, open, project.evaluatorIds, project.projectId, selectedEvaluatorsOverride])

  const resolvedActiveEvaluatorId = useMemo(() => {
    if (activeEvaluatorId && evaluatorByUserId.has(activeEvaluatorId)) {
      return activeEvaluatorId
    }

    const firstSelected = selectedEvaluators.find((evaluatorId) => evaluatorByUserId.has(evaluatorId))
    return firstSelected ?? evaluatorOptions[0]?.userId ?? ''
  }, [activeEvaluatorId, evaluatorByUserId, evaluatorOptions, selectedEvaluators])

  const activeEvaluator = resolvedActiveEvaluatorId ? evaluatorByUserId.get(resolvedActiveEvaluatorId) : null

  useEffect(() => {
    if (!open) return
    if (!project.projectId) return
    if (assignedEvaluatorsQuery.isLoading) return
    if (assignedEvaluatorsQuery.error) return

    const signature = `${project.projectId}::${(assignedEvaluatorsQuery.data?.evaluators ?? []).map((e) => e.userId).sort().join(',')}`
    if (initializedAssignedEvaluatorsRef.current === signature) {
      return
    }
    initializedAssignedEvaluatorsRef.current = signature
  }, [assignedEvaluatorsQuery.data?.evaluators, assignedEvaluatorsQuery.error, assignedEvaluatorsQuery.isLoading, open, project.projectId])

  const toggleEvaluator = (id: string) => {
    setSelectedEvaluatorsOverride(prev => {
      const base = prev ?? selectedEvaluators
      return base.includes(id) ? base.filter(e => e !== id) : [...base, id]
    })

    setActiveEvaluatorId(id)
  }

  const handleSave = () => {
    const normalizedSelectedIds = selectedEvaluators.filter((evaluatorId) => evaluatorByUserId.has(evaluatorId))
    const selectedProfiles = normalizedSelectedIds
      .map((evaluatorId) => evaluatorByUserId.get(evaluatorId) ?? null)
      .filter((evaluator): evaluator is EvaluatorOption => evaluator !== null)

    onAssign(selectedAdvisor, normalizedSelectedIds, selectedProfiles)
  }

  return (
    <DialogContent
      onInteractOutside={onClose}
      onEscapeKeyDown={onClose}
      className="max-h-[90vh] w-[95vw] max-w-2xl overflow-hidden p-0 sm:w-full rounded-2xl border-none shadow-2xl"
    >
      <DialogHeader className="bg-muted/30 px-6 py-5 border-b border-border/40">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-xl font-bold tracking-tight">Assign Project Team</DialogTitle>
            <DialogDescription className="mt-1 line-clamp-1 break-words font-medium text-muted-foreground">{project.title}</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 pb-6 pt-5">
        <div className="space-y-6">
        {/* Assigned Evaluators (Server) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Currently Assigned</Label>
            {assignedEvaluatorIds.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-2 font-bold">{assignedEvaluatorIds.length} Evaluators</Badge>
            )}
          </div>

          {!project.projectId ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-4 text-center">
              <p className="text-xs text-muted-foreground font-medium">Legacy Item</p>
              <p className="text-[10px] text-muted-foreground mt-1">Assignments cannot be loaded for legacy records.</p>
            </div>
          ) : assignedEvaluatorsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-xl border bg-muted/40" />
              ))}
            </div>
          ) : assignedEvaluatorsQuery.error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-medium">Unable to load assigned evaluators.</p>
            </div>
          ) : (assignedEvaluatorsQuery.data?.evaluators?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/5 px-4 py-6 text-center">
              <Users className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-medium">No evaluators assigned yet.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {(assignedEvaluatorsQuery.data?.evaluators ?? []).map((evaluator) => {
                const eligibleFallback = evaluatorByUserId.get(evaluator.userId) ?? null
                const display = resolveAssignedEvaluatorDisplay(evaluator, eligibleFallback)

                return (
                  <div
                    key={evaluator.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 sm:flex-row sm:items-center sm:justify-between transition-all hover:border-primary/20 hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-background shadow-sm">
                        <AvatarImage src={display.avatarUrl ?? undefined} alt={display.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{display.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{display.name}</p>
                        {display.email ? (
                          <p className="truncate text-[11px] text-muted-foreground font-medium">{display.email}</p>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full text-xs sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10 font-bold"
                      disabled={removeEvaluatorMutation.isPending}
                      onClick={async () => {
                        if (!project.projectId) return
                        try {
                          await removeEvaluatorMutation.mutateAsync({
                            projectId: project.projectId,
                            evaluatorUserId: evaluator.userId,
                          })
                          const refreshed = await assignedEvaluatorsQuery.refetch()
                          const refreshedIds = (refreshed.data?.evaluators ?? []).map((e) => e.userId).filter(Boolean)
                          setSelectedEvaluatorsOverride(refreshedIds)
                          setActiveEvaluatorId(refreshedIds[0] ?? '')
                          toast.success('Evaluator removed')
                        } catch (error) {
                          toast.error('Failed to remove evaluator', {
                            description: error instanceof Error ? error.message : 'Please try again.',
                          })
                        }
                      }}
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Remove
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Separator className="bg-border/40" />

        {/* Advisor */}
        <div className="space-y-3">
          <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Primary Advisor</Label>
          <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
            <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background focus:ring-primary/20">
              <SelectValue placeholder="Select primary advisor" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl">
              {advisors.map((advisor) => (
                <SelectItem key={advisor.id} value={advisor.id} className="rounded-lg py-2.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-6 w-6 shrink-0 ring-1 ring-border/40">
                      {advisor.avatarUrl ? <AvatarImage src={advisor.avatarUrl} alt={advisor.name} /> : null}
                      <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                        {initialsFromName(advisor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-sm">{advisor.name}</p>
                      <p className="text-[10px] text-muted-foreground">Load: {advisor.currentLoad}/{advisor.loadLimit}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Evaluators */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Select Evaluators
            </Label>
            <Badge variant="outline" className="text-[10px] font-bold px-2 h-5 bg-primary/5 text-primary border-primary/20">
              {selectedEvaluators.length} Selected
            </Badge>
          </div>

          {!project.projectId ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/5 px-4 py-4 text-center">
              <p className="text-xs text-muted-foreground font-medium">Legacy Item</p>
            </div>
          ) : eligibleEvaluatorsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl border bg-muted/40" />
              ))}
            </div>
          ) : eligibleEvaluatorsQuery.error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-medium">Unable to load eligible evaluators.</p>
            </div>
          ) : evaluatorOptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/5 px-4 py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-medium">No eligible evaluators found.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-hide">
                {evaluatorOptions.map((evaluator) => {
                  const selected = selectedEvaluators.includes(evaluator.userId)
                  const isActive = activeEvaluatorId === evaluator.userId

                  return (
                    <button
                      key={evaluator.id}
                      type="button"
                      onClick={() => toggleEvaluator(evaluator.userId)}
                      onMouseEnter={() => setActiveEvaluatorId(evaluator.userId)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                        selected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : isActive
                            ? 'border-primary/30 bg-muted/50'
                            : 'border-border/60 bg-card hover:border-primary/20 hover:bg-muted/30',
                        !selectedAdvisor ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                      )}
                    >
                      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-background shadow-sm">
                        {evaluator.avatarUrl ? <AvatarImage src={evaluator.avatarUrl} alt={evaluator.name} /> : null}
                        <AvatarFallback className={cn("text-xs font-bold", selected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>
                          {initialsFromName(evaluator.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{evaluator.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground font-medium">{evaluator.email}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(evaluator.currentLoad / evaluator.loadLimit) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                            Load {evaluator.currentLoad}/{evaluator.loadLimit}
                          </span>
                        </div>
                      </div>
                      <div className={cn(
                        "h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all",
                        selected ? 'border-primary bg-primary shadow-sm' : 'border-muted-foreground/20'
                      )}>
                        {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 lg:sticky lg:top-0 h-fit">
                {activeEvaluator ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-background shadow-md">
                        {activeEvaluator.avatarUrl ? <AvatarImage src={activeEvaluator.avatarUrl} alt={activeEvaluator.name} /> : null}
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                          {initialsFromName(activeEvaluator.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-foreground leading-tight">{activeEvaluator.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground font-medium mt-0.5">{activeEvaluator.email}</p>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
                        <Badge variant="outline" className="h-5 px-2 text-[10px] font-bold bg-primary/5 text-primary border-primary/20">
                          {(activeEvaluator.status ?? 'ACTIVE').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Load</span>
                        <span className="text-sm font-bold text-foreground">{activeEvaluator.currentLoad} Projects</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Capacity</span>
                        <span className="text-sm font-bold text-foreground">{activeEvaluator.loadLimit} Max</span>
                      </div>
                    </div>
                    
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                      <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Info className="h-3 w-3" /> Note
                      </p>
                      <p className="text-[11px] leading-relaxed text-primary/80 font-medium">
                        Selecting this evaluator will increase their current workload. Ensure they have enough capacity for this project.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium max-w-[140px]">
                      Hover or select an evaluator to view details.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-sm pb-2">
          <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold border-border/60" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 h-11 rounded-xl gap-2 font-bold shadow-lg shadow-primary/20" onClick={handleSave} disabled={!selectedAdvisor && selectedEvaluators.length === 0}>
            <CheckCircle2 className="h-4 w-4" /> Save Assignment
          </Button>
        </div>
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
  const liveEvaluatorsQuery = useProjectEvaluators({
    projectId: project.projectId,
    enabled: Boolean(project.projectId),
  })

  const liveAssignments = liveEvaluatorsQuery.data?.evaluators ?? []
  const liveEvaluatorIds = liveAssignments.map((evaluator) => evaluator.userId).filter(Boolean)
  const liveEvaluatorProfiles: EvaluatorOption[] = liveAssignments
    .map((assignment) => {
      const name = formatEligibleEvaluatorName(
        assignment.user?.firstName,
        assignment.user?.lastName,
        assignment.user?.email
      )
      return {
        id: assignment.id,
        userId: assignment.userId,
        departmentId: assignment.departmentId ?? project.projectId ?? "",
        name,
        email: assignment.user?.email?.trim() || "No email available",
        avatarUrl: assignment.user?.avatarUrl ?? null,
        status: assignment.user?.status ?? null,
        loadLimit: 0,
        currentLoad: 0,
      }
    })
    .filter((evaluator) => Boolean(evaluator.userId))

  const evaluatorIdsForDisplay = liveEvaluatorIds.length > 0 ? liveEvaluatorIds : project.evaluatorIds
  const evaluatorProfilesForDisplay =
    liveEvaluatorProfiles.length > 0 ? liveEvaluatorProfiles : (project.evaluatorProfiles ?? [])

  const evaluators = evaluatorProfilesForDisplay.filter((evaluator) =>
    evaluatorIdsForDisplay.includes(evaluator.userId)
  )
  const evaluatorCount = evaluatorIdsForDisplay.length
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
            <p className="font-bold truncate text-[0.95rem] leading-snug group-hover:text-primary transition-colors">{project.title}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project.groupName || 'Student Group'}
            </p>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.memberNames && project.memberNames.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/[0.35] px-3 py-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Group Members</p>
            <span className="rounded-full bg-background border border-border/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {project.memberNames.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleMembers.map((member) => (
              <div
                key={`${project.id}-${member}`}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-background px-2 py-1 text-[11px] text-foreground shadow-sm transition-colors group-hover:border-primary/15"
              >
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary">
                    {initialsFromName(member)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-medium">{member}</span>
              </div>
            ))}
            {remainingMembers > 0 && (
              <div className="inline-flex items-center rounded-full border border-dashed border-border/60 bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                +{remainingMembers}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress */}
      {project.progress !== undefined && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>Progress</span>
            <span className="text-primary">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5 rounded-full" />
        </div>
      )}

      {/* Advisor & Evaluators */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 flex flex-col justify-between min-h-[72px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Advisor</p>
          {isAssigned ? (
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background shadow-sm">
                {project.advisorAvatarUrl ? <AvatarImage src={project.advisorAvatarUrl} alt={project.advisorName} /> : null}
                <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                  {initialsFromName(project.advisorName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">{project.advisorName}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 opacity-60">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-dashed border-border/60 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs text-muted-foreground italic font-medium">Unassigned</p>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 flex flex-col justify-between min-h-[72px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Evaluators</p>
          {evaluatorCount > 0 ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex -space-x-2 shrink-0">
                {evaluators.slice(0, 3).map(evaluator => (
                  <Avatar key={evaluator.id} className="h-7 w-7 border-2 border-card shadow-sm">
                    {evaluator.avatarUrl ? <AvatarImage src={evaluator.avatarUrl} alt={evaluator.name} /> : null}
                    <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">{initialsFromName(evaluator.name)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  {evaluatorCount} Assigned
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 opacity-60">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-dashed border-border/60 text-muted-foreground">
                <Star className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs text-muted-foreground italic font-medium">None</p>
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
          className="text-[10px] font-bold uppercase tracking-wider px-2"
        >
          {isLegacyApprovedWithoutProject
            ? 'Legacy'
            : isComplete
              ? 'Done'
              : isAssigned
                ? 'Assigned'
                : 'Needs Team'}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold hover:border-primary hover:text-primary shadow-sm"
          disabled={isLegacyApprovedWithoutProject}
          onClick={() => onAssign(project)}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {isAssigned ? 'Manage Team' : 'Assign Team'}
        </Button>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function ProjectsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [assignmentOverrides, setAssignmentOverrides] = useState<Record<string, AssignmentOverride>>({})
  const [dialogProject, setDialogProject] = useState<AssignmentProject | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [advisorFilter, setAdvisorFilter] = useState('all')
  const [projectPage, setProjectPage] = useState(1)
  const [advisorWorkloadPage, setAdvisorWorkloadPage] = useState(1)
  const [activeEvaluatorId, setActiveEvaluatorId] = useState('')
  const initializedAssignedEvaluatorsRef = React.useRef<string | null>(null)
  const overviewQuery = useDepartmentProjectsOverview({
    departmentId,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })
  const assignmentSummaryQuery = useProjectAssignmentSummary({
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
  const updateProjectEvaluatorsMutation = useUpdateProjectEvaluators()

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

  const handleAssign = useCallback(async (
    advisorId: string,
    evaluatorIds: string[],
    evaluatorProfiles: EvaluatorOption[]
  ) => {
    if (!dialogProject) {
      return
    }

    if (!dialogProject.projectId) {
      toast.error('Advisor assignment is unavailable for this card yet.', {
        description: 'This is a legacy approved proposal with no linked project record yet.',
      })
      return
    }

    const normalizedAdvisorId = advisorId.trim()
    const currentAdvisorId = String(dialogProject.advisorId ?? '').trim()
    const shouldUpdateAdvisor = Boolean(normalizedAdvisorId) && normalizedAdvisorId !== currentAdvisorId

    const advisor = advisors.find((u) => u.id === normalizedAdvisorId)
    const advisorName = advisor?.name || dialogProject.advisorName || 'Unknown'
    const advisorAvatarUrl = advisor?.avatarUrl ?? dialogProject.advisorAvatarUrl ?? null

    const normalizedEvaluatorIds = Array.from(
      new Set(
        evaluatorIds
          .map((id) => id.trim())
          .filter(Boolean)
          .filter((id) => id !== normalizedAdvisorId)
      )
    )
    const normalizedEvaluatorProfiles = evaluatorProfiles.filter(
      (evaluator) => normalizedEvaluatorIds.includes(evaluator.userId)
    )

    if (shouldUpdateAdvisor) {
      try {
        await assignProjectAdvisorMutation.mutateAsync({
          projectId: dialogProject.projectId,
          dto: { advisorId: normalizedAdvisorId },
        })
      } catch (error) {
        toast.error('Failed to save advisor assignment', {
          description: error instanceof Error ? error.message : 'Please try again.',
        })
        return
      }
    }

    try {
      await updateProjectEvaluatorsMutation.mutateAsync({
        projectId: dialogProject.projectId,
        dto: {
          evaluatorIds: normalizedEvaluatorIds,
        },
      })
    } catch (error) {
      toast.error('Failed to update evaluators', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })

      setAssignmentOverrides((prev) => ({
        ...prev,
        [dialogProject.id]: {
          advisorId: normalizedAdvisorId || currentAdvisorId,
          advisorName,
          advisorAvatarUrl,
          evaluatorIds: normalizedEvaluatorIds,
          evaluatorProfiles: normalizedEvaluatorProfiles,
        },
      }))
      return
    }

    let refreshedEvaluatorIds = normalizedEvaluatorIds
    let refreshedEvaluatorProfiles = normalizedEvaluatorProfiles
    try {
      const refreshed = await getProjectEvaluators(dialogProject.projectId)
      const refreshedAssignments = refreshed.evaluators ?? []
      refreshedEvaluatorIds = refreshedAssignments.map((evaluator) => evaluator.userId).filter(Boolean)
      refreshedEvaluatorProfiles = refreshedAssignments
        .map((assignment) => {
          const name = formatEligibleEvaluatorName(
            assignment.user?.firstName,
            assignment.user?.lastName,
            assignment.user?.email
          )
          return {
            id: assignment.id,
            userId: assignment.userId,
            departmentId: assignment.departmentId ?? dialogProject.projectId ?? '',
            name,
            email: assignment.user?.email?.trim() || 'No email available',
            avatarUrl: assignment.user?.avatarUrl ?? null,
            status: assignment.user?.status ?? null,
            loadLimit: 0,
            currentLoad: 0,
          } satisfies EvaluatorOption
        })
        .filter((evaluator) => Boolean(evaluator.userId))
    } catch {
      // If refresh fails, fall back to submitted values.
    }

    setAssignmentOverrides((prev) => ({
      ...prev,
      [dialogProject.id]: {
        advisorId: normalizedAdvisorId || currentAdvisorId,
        advisorName,
        advisorAvatarUrl,
        evaluatorIds: refreshedEvaluatorIds,
        evaluatorProfiles: refreshedEvaluatorProfiles,
      },
    }))

    toast.success('Evaluators updated successfully', {
      description:
        refreshedEvaluatorIds.length > 0
          ? `${advisorName} assigned and ${refreshedEvaluatorIds.length} evaluator${refreshedEvaluatorIds.length === 1 ? '' : 's'} updated.`
          : `${advisorName} assigned and evaluators cleared.`,
    })
    setDialogOpen(false)
    setDialogProject(null)
  }, [
    advisors,
    assignProjectAdvisorMutation,
    dialogProject,
    updateProjectEvaluatorsMutation,
  ])

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
  const totalProjectsValue = assignmentSummaryQuery.data?.totalProjects ?? stats.total
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

  const needsAdvisorValue =
    assignmentSummaryQuery.data?.withoutAdvisor ?? needsAdvisorProposalsValue
  const needsEvaluatorValue =
    assignmentSummaryQuery.data?.withoutEvaluators ?? stats.needsEvaluator

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
  const evaluatorWorkload = useMemo(() => {
    const workload = new Map<string, EvaluatorOption & { assigned: number }>()

    for (const project of projects) {
      for (const evaluatorProfile of project.evaluatorProfiles ?? []) {
        const existing = workload.get(evaluatorProfile.userId)

        if (!existing) {
          workload.set(evaluatorProfile.userId, {
            ...evaluatorProfile,
            assigned: 0,
          })
        }

        if (project.evaluatorIds.includes(evaluatorProfile.userId)) {
          const entry = workload.get(evaluatorProfile.userId)
          if (entry) {
            entry.assigned += 1
          }
        }
      }
    }

    return Array.from(workload.values()).sort((a, b) => {
      if (b.assigned !== a.assigned) {
        return b.assigned - a.assigned
      }

      return a.name.localeCompare(b.name)
    })
  }, [projects])

  const totalUnassigned = projects.filter(p => !p.advisorName).length
  const totalNeedsEvaluator = projects.filter(p => p.evaluatorIds.length === 0).length

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Project Assignments
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Assign advisors and evaluators to student projects
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-0">
          <Badge variant="secondary" className="gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs">
            <FolderKanban className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {totalProjectsValue} Projects
          </Badge>
          {totalUnassigned > 0 && (
            <Badge variant="destructive" className="gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs animate-pulse">
              <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {totalUnassigned} Unassigned
            </Badge>
          )}
          <Button variant="outline" size="sm" className="h-7 sm:h-8 gap-1.5 ml-auto sm:ml-0 text-[10px] sm:text-xs" onClick={() => overviewQuery.refetch()}>
            <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Active Projects',   value: renderMetricValue(activeProjectsValue, overviewQuery.isLoading), icon: FolderKanban, bg: 'bg-primary/10',     color: 'text-primary' },
          { label: 'Completed', value: renderMetricValue(completedProjectsValue, overviewQuery.isLoading), icon: CheckCircle2, bg: 'bg-muted',          color: 'text-foreground' },
          { label: 'Approved Titles', value: renderMetricValue(approvedProposalsValue, proposalsQuery.isLoading), icon: Archive,       bg: 'bg-primary/[0.06]', color: 'text-primary/80' },
          { label: 'Needs Advisor',     value: renderMetricValue(needsAdvisorValue, assignmentSummaryQuery.isLoading), icon: AlertTriangle,  bg: 'bg-destructive/10',  color: 'text-destructive' },
          { label: 'Needs Evaluator',   value: renderMetricValue(needsEvaluatorValue, assignmentSummaryQuery.isLoading), icon: Star,           bg: 'bg-destructive/10',  color: 'text-destructive' },
        ].map(s => (
          <Card key={s.label} className="group border border-border/60 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4">
              <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl ${s.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                <s.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-col xl:grid gap-6 xl:grid-cols-[1fr_320px]">

        {/* Right: Sidebar (Moved up on mobile for better visibility of status) */}
        <div className="space-y-4 order-first xl:order-last">
          
          {/* Assignment Progress Card */}
          <Card className="border-border/60 shadow-sm bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
            <CardHeader className="pb-2 p-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Assignment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-muted-foreground font-medium">Advisor Coverage</span>
                    <span className="font-bold text-primary">{Math.round(((projects.length - totalUnassigned) / Math.max(projects.length, 1)) * 100)}%</span>
                  </div>
                  <Progress value={((projects.length - totalUnassigned) / Math.max(projects.length, 1)) * 100} className="h-1.5" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-muted-foreground font-medium">Evaluator Coverage</span>
                    <span className="font-bold text-primary">{Math.round(((projects.length - totalNeedsEvaluator) / Math.max(projects.length, 1)) * 100)}%</span>
                  </div>
                  <Progress value={((projects.length - totalNeedsEvaluator) / Math.max(projects.length, 1)) * 100} className="h-1.5" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="rounded-xl bg-background/60 border border-border/40 p-2.5 text-center shadow-sm">
                  <p className="text-xl font-bold text-destructive leading-none">{totalUnassigned}</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1 tracking-tight">No Advisor</p>
                </div>
                <div className="rounded-xl bg-background/60 border border-border/40 p-2.5 text-center shadow-sm">
                  <p className="text-xl font-bold text-amber-600 leading-none">{totalNeedsEvaluator}</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1 tracking-tight">No Evaluator</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="advisors">
            <TabsList className="h-10 w-full bg-muted/30 p-1 rounded-xl">
              <TabsTrigger value="advisors" className="flex-1 text-[11px] font-bold gap-1.5 rounded-lg data-[state=active]:shadow-sm">
                <Users className="h-3.5 w-3.5" /> Advisors
              </TabsTrigger>
              <TabsTrigger value="evaluators" className="flex-1 text-[11px] font-bold gap-1.5 rounded-lg data-[state=active]:shadow-sm">
                <Star className="h-3.5 w-3.5" /> Evaluators
              </TabsTrigger>
            </TabsList>

            {/* Advisor workload */}
            <TabsContent value="advisors" className="mt-3">
              <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/10 p-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Advisor Workload
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {advisorOverviewQuery.isLoading && advisorWorkload.length === 0 ? (
                    <div className="p-4 space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="space-y-2.5">
                          <div className="h-8 w-full rounded bg-muted animate-pulse" />
                          <div className="h-2 w-full rounded bg-muted animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : advisorWorkload.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No advisor workload data available.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {displayedAdvisorWorkload.map((a) => (
                        <div key={a.id} className="p-4 hover:bg-muted/5 transition-colors">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-background shadow-sm">
                              {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.name} /> : null}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {a.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate text-foreground">{a.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate font-medium">{a.email}</p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] font-bold h-5 px-2 rounded-full">
                              {a.assigned}
                            </Badge>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-muted-foreground uppercase tracking-tighter">Progress</span>
                              <span className="text-primary">{a.avgProg}%</span>
                            </div>
                            <Progress value={a.avgProg} className="h-1 rounded-full" />
                          </div>
                        </div>
                      ))}
                      
                      <div className="p-3 bg-muted/10">
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-background shadow-sm"
                            disabled={advisorWorkloadCurrentPage <= 1 || advisorOverviewQuery.isLoading}
                            onClick={() => setAdvisorWorkloadPage((value) => Math.max(value - 1, 1))}
                          >
                            <ChevronRight className="h-4 w-4 rotate-180" />
                          </Button>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {advisorWorkloadCurrentPage} / {advisorWorkloadTotalPages}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-background shadow-sm"
                            disabled={advisorWorkloadCurrentPage >= advisorWorkloadTotalPages || advisorOverviewQuery.isLoading}
                            onClick={() => setAdvisorWorkloadPage((value) => Math.min(value + 1, advisorWorkloadTotalPages))}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Evaluator workload */}
            <TabsContent value="evaluators" className="mt-3">
              <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/10 p-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    Evaluator Workload
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {evaluatorWorkload.length === 0 ? (
                    <div className="p-8 text-center">
                      <Star className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Select evaluators in project assignments to see workload distribution.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {evaluatorWorkload.slice(0, 6).map((e) => (
                        <div key={e.id} className="p-4 flex items-center gap-3 hover:bg-muted/5 transition-colors">
                          <div className="relative shrink-0">
                            <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm">
                              {e.avatarUrl ? <AvatarImage src={e.avatarUrl} alt={e.name} /> : null}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {e.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-background border border-border flex items-center justify-center">
                              <Star className="h-2 w-2 text-primary fill-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-foreground">{e.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate font-medium">{e.email}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-primary leading-none">{e.assigned}</p>
                            <p className="text-[9px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">projects</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick links */}
          <Card className="border-border/60 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/10 p-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {[
                { href: '/dashboard/coordinator/advisor-progress', icon: TrendingUp, label: 'Advisor Analytics' },
                { href: '/dashboard/coordinator/evaluator-progress', icon: ClipboardCheck, label: 'Evaluator Progress' },
                { href: '/dashboard/coordinator/notify-advisors', icon: Mail, label: 'Notify Advisors' },
                { href: '/dashboard/coordinator/notify-evaluators', icon: Bell, label: 'Notify Evaluators' },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all cursor-pointer group">
                    <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span className="font-bold text-xs">{item.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

          {/* Search & Filters */}
          <Card className="border-none shadow-sm bg-muted/20">
            <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects…"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9 h-10 bg-background border-border/60 focus-visible:ring-primary/20 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 shrink-0">
                  <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="h-10 w-full sm:w-[130px] bg-background border-border/60 text-xs">
                      <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
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
                    <SelectTrigger className="h-10 w-full sm:w-[150px] bg-background border-border/60 text-xs">
                      <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="Advisor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Advisors</SelectItem>
                      {advisors.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-4 w-4 shrink-0">
                              {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.name} /> : null}
                              <AvatarFallback className="bg-primary/10 text-[8px] font-bold text-primary">
                                {a.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{a.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background p-1 col-span-2 sm:col-span-1 ml-auto sm:ml-0">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8 flex-1 sm:w-8 rounded-md"
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8 flex-1 sm:w-8 rounded-md"
                      onClick={() => setViewMode('table')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {(search || statusFilter !== 'all' || advisorFilter !== 'all') && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border/40">
                  <span className="text-muted-foreground font-medium">
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
                  </span>
                  <Button
                    variant="ghost" size="sm"
                    className="h-7 text-xs gap-1.5 text-primary hover:bg-primary/10"
                    onClick={handleClearFilters}
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results label */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span className="font-medium">
                Showing {projectRangeStart}-{projectRangeEnd} of {filtered.length} project{filtered.length !== 1 ? 's' : ''}
              </span>
              <span>
                Page {safeProjectPage} of {totalProjectPages}
              </span>
            </div>
          )}

          {/* Cards grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed bg-muted/5">
              <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <FolderKanban className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="font-semibold text-muted-foreground">No projects match your filters</p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-[240px]">Try adjusting the search or filter criteria to find what you&apos;re looking for</p>
              <Button variant="outline" size="sm" className="mt-6" onClick={handleClearFilters}>
                Reset all filters
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {paginatedProjects.map(p => (
                <ProjectCard key={p.id} project={p} onAssign={openAssign} />
              ))}
            </div>
          ) : (
            <Card className="border-border/60 shadow-sm overflow-hidden rounded-2xl">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-widest whitespace-nowrap">Project</th>
                      <th className="text-left px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-widest whitespace-nowrap">Advisor</th>
                      <th className="text-left px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-widest whitespace-nowrap">Evaluators</th>
                      <th className="text-left px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-widest whitespace-nowrap">Status</th>
                      <th className="text-right px-4 py-3 font-bold text-[10px] text-muted-foreground uppercase tracking-widest whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {paginatedProjects.map(p => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="min-w-[180px]">
                            <p className="font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{p.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-1 font-medium">{p.groupName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {p.advisorName ? (
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Avatar className="h-7 w-7 ring-2 ring-background shadow-sm">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{p.advisorName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-semibold text-foreground truncate">{p.advisorName}</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter border-dashed">Unassigned</Badge>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 min-w-[100px]">
                            <Badge variant="secondary" className="text-[10px] font-bold h-5 px-2 rounded-full">
                              {p.evaluatorIds.length}
                            </Badge>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Assigned</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all" 
                            onClick={() => openAssign(p)}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {totalProjectPages > 1 && (
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between shadow-sm">
              <div className="text-xs text-muted-foreground font-medium">
                Page {safeProjectPage} of {totalProjectPages}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
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
                          className={cn("h-8 w-8 p-0", pageNumber === safeProjectPage ? "shadow-md" : "")}
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
                  className="h-8 px-3"
                  disabled={safeProjectPage >= totalProjectPages}
                  onClick={() => setProjectPage((value) => Math.min(value + 1, totalProjectPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
