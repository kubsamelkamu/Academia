"use client"

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { mockUsers, mockProjects, type ProjectSummary } from '@/data/mockData'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useDepartmentProjectsOverview } from '@/lib/hooks/use-projects'

type AssignmentProject = ProjectSummary & {
  advisorId?: string
  advisorName?: string
  evaluatorIds: string[]
}

/* ─── Assignment Dialog ─────────────────────────────────────────────────── */
interface AssignmentDialogProps {
  project: AssignmentProject
  onClose: () => void
  onAssign: (advisorId: string, evaluatorIds: string[]) => void
  open: boolean
}

function AssignmentDialog({ project, onClose, onAssign, open }: AssignmentDialogProps) {
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

  const advisors = mockUsers.filter(u => u.role === 'advisor')
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
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {a.name.charAt(0)}
                    </div>
                  {a.name}
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

  return (
    <div className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20 space-y-4">
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
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {isAssigned ? (
            <span className="truncate font-medium">{project.advisorName}</span>
          ) : (
            <span className="text-muted-foreground italic">No advisor yet</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-2">
          <Star className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {evaluators.length > 0 ? (
            <div className="flex items-center gap-1 min-w-0">
              <div className="flex -space-x-1.5 shrink-0">
                {evaluators.slice(0, 3).map(e => (
                  <Avatar key={e.id} className="h-5 w-5 border-2 border-card">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{e.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {evaluators.length} evaluator{evaluators.length !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground italic text-xs">No evaluators</span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Badge
          variant={isComplete ? 'secondary' : isAssigned ? 'outline' : 'destructive'}
          className="text-xs"
        >
          {isComplete ? 'Completed' : isAssigned ? 'Assigned' : 'Needs Assignment'}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs hover:border-primary hover:text-primary"
          onClick={() => onAssign(project)}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {isAssigned ? 'Reassign' : 'Assign Team'}
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
  const overviewQuery = useDepartmentProjectsOverview({
    departmentId,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })
  const [projects, setProjects] = useState<AssignmentProject[]>(() =>
    mockProjects.map(p => ({
      ...p,
      advisorId: p.advisorId || '',
      advisorName: p.advisorName || '',
      evaluatorIds: p.evaluatorIds || [],
    }))
  )
  const [dialogProject, setDialogProject] = useState<AssignmentProject | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [advisorFilter, setAdvisorFilter] = useState('all')

  const advisors = mockUsers.filter(u => u.role === 'advisor')
  const evaluators = mockUsers.filter(u => u.role === 'evaluator')

  const handleAssign = useCallback((advisorId: string, evaluatorIds: string[]) => {
    const advisor = mockUsers.find(u => u.id === advisorId)
    const advisorName = advisor?.name || 'Unknown'
    setProjects(prev =>
      prev.map(p =>
        p.id === dialogProject?.id ? { ...p, advisorId, advisorName, evaluatorIds } : p
      )
    )
    toast.success('Team Assigned', {
      description: `${advisorName} + ${evaluatorIds.length} evaluator(s) → "${dialogProject?.title}"`,
    })
    setDialogOpen(false)
    setDialogProject(null)
  }, [dialogProject])

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
        (p.advisorName || '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      const matchAdvisor = advisorFilter === 'all' || p.advisorId === advisorFilter
      return matchSearch && matchStatus && matchAdvisor
    })
  }, [projects, search, statusFilter, advisorFilter])

  // Stats
  const stats = useMemo(() => ({
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    unassigned: projects.filter(p => !p.advisorName).length,
    needsEvaluator: projects.filter(p => p.evaluatorIds.length === 0).length,
  }), [projects])

  const activeProjectsValue = overviewQuery.data?.activeProjects ?? 0
  const completedProjectsValue = overviewQuery.data?.completedProjects ?? 0
  const cancelledProjectsValue = overviewQuery.data?.cancelledProjects ?? 0

  const renderOverviewValue = (value: number) => {
    if (overviewQuery.isLoading) {
      return '...'
    }

    return value
  }

  // Advisor workload
  const advisorWorkload = useMemo(() => advisors.map(a => {
    const assigned = projects.filter(p => p.advisorId === a.id)
    const inProgress = assigned.filter(p => p.status === 'in_progress').length
    const completed = assigned.filter(p => p.status === 'completed').length
    const avgProg = assigned.length > 0
      ? Math.round(assigned.reduce((s, p) => s + (p.progress ?? 0), 0) / assigned.length)
      : 0
    return { ...a, assigned: assigned.length, inProgress, completed, avgProg }
  }), [advisors, projects])

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
          { label: 'Active Projects',   value: renderOverviewValue(activeProjectsValue),    icon: FolderKanban, bg: 'bg-primary/10',     color: 'text-primary' },
          { label: 'Completed',         value: renderOverviewValue(completedProjectsValue), icon: CheckCircle2, bg: 'bg-muted',          color: 'text-foreground' },
          { label: 'Cancelled',         value: renderOverviewValue(cancelledProjectsValue), icon: Archive,       bg: 'bg-primary/[0.06]', color: 'text-primary/80' },
          { label: 'Needs Advisor',     value: stats.unassigned,    icon: AlertTriangle,  bg: 'bg-destructive/10',  color: 'text-destructive' },
          { label: 'Needs Evaluator',   value: stats.needsEvaluator,icon: Star,           bg: 'bg-destructive/10',  color: 'text-destructive' },
        ].map(s => (
          <Card key={s.label} className="group border-none shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`h-10 w-10 rounded-full ${s.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
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
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-40">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={advisorFilter} onValueChange={setAdvisorFilter}>
                <SelectTrigger className="h-10 w-44">
                  <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Advisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Advisors</SelectItem>
                  {advisors.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
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
                onClick={() => { setSearch(''); setStatusFilter('all'); setAdvisorFilter('all') }}
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
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map(p => (
                <ProjectCard key={p.id} project={p} onAssign={openAssign} />
              ))}
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
                  {advisorWorkload.map((a, i) => (
                    <div key={a.id}>
                      {i > 0 && <Separator className="mb-4" />}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {a.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{a.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                          </div>
                        </div>

                        {/* Stats pills */}
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

                        {/* Progress bar */}
                        {a.assigned > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Avg progress</span>
                              <span className="font-medium">{a.avgProg}%</span>
                            </div>
                            <Progress value={a.avgProg} className="h-1.5" />
                          </div>
                        )}

                        {a.assigned === 0 && (
                          <p className="text-xs text-muted-foreground italic">No projects assigned</p>
                        )}
                      </div>
                    </div>
                  ))}
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
            onClose={() => { setDialogOpen(false); setDialogProject(null) }}
              onAssign={handleAssign}
              open={dialogOpen}
            />
          )}
        </Dialog>
    </div>
  )
}
