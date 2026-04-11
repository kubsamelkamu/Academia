"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FolderKanban,
  MoreHorizontal,
  PlayCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
  Eye,
  Target,
  FileText,
  BarChart3,
} from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

type CapstoneStage = "Capstone I" | "Capstone II"

type GroupRow = {
  id: string
  groupName: string
  projectTitle: string
  stage: CapstoneStage
  progress: number
  pending: number
  evaluated: number
  dueLabel: string
  criteria: string[]
}

const GROUPS: GroupRow[] = [
  {
    id: "grp-1",
    groupName: "AI Research Group",
    projectTitle: "Machine Learning applied to Smart Grids",
    stage: "Capstone I",
    progress: 74,
    pending: 2,
    evaluated: 1,
    dueLabel: "Due May 17",
    criteria: ["Problem statement", "Proposal quality", "Methodology", "SDD readiness"],
  },
  {
    id: "grp-2",
    groupName: "Blockchain Team",
    projectTitle: "Blockchain for Supply Chain Transparency",
    stage: "Capstone II",
    progress: 96,
    pending: 0,
    evaluated: 3,
    dueLabel: "Published",
    criteria: ["Implementation completeness", "Testing evidence", "Final results", "Defense readiness"],
  },
  {
    id: "grp-3",
    groupName: "IoT Builders",
    projectTitle: "IoT Home Automation Prototype",
    stage: "Capstone I",
    progress: 61,
    pending: 2,
    evaluated: 1,
    dueLabel: "Due May 19",
    criteria: ["Scope definition", "Architecture design", "Feasibility", "Advisor readiness"],
  },
  {
    id: "grp-4",
    groupName: "Cloud Scale Team",
    projectTitle: "Cloud-native Microservices Architecture",
    stage: "Capstone II",
    progress: 67,
    pending: 2,
    evaluated: 0,
    dueLabel: "Due May 22",
    criteria: ["Deployment quality", "System tests", "Performance results", "Final documentation"],
  },
]

function stageConfig(stage: CapstoneStage) {
  if (stage === "Capstone I") {
    return {
      accent: "text-primary",
      chip: "bg-primary/10 text-primary border-primary/20",
      subtitle: "Proposal, scope, and SDD-oriented evaluation",
      cta: "Open Capstone I",
    }
  }

  return {
    accent: "text-emerald-600",
    chip: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
    subtitle: "Implementation, testing, and final defense evaluation",
    cta: "Open Capstone II",
  }
}

export function AdvisorCapstoneEvaluationsPage({ stage }: { stage: CapstoneStage }) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [quickFeedbackOpen, setQuickFeedbackOpen] = React.useState(false)
  const [revisionOpen, setRevisionOpen] = React.useState(false)
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = React.useState("")
  const [revisionReason, setRevisionReason] = React.useState("")
  const [revisionDeadline, setRevisionDeadline] = React.useState("")

  const cfg = stageConfig(stage)
  const groups = React.useMemo(() => {
    return GROUPS.filter((group) => group.stage === stage && (
      !search
      || group.groupName.toLowerCase().includes(search.toLowerCase())
      || group.projectTitle.toLowerCase().includes(search.toLowerCase())
    ))
  }, [search, stage])

  const totalPending = groups.reduce((sum, group) => sum + group.pending, 0)
  const avgProgress = groups.length > 0 ? Math.round(groups.reduce((sum, group) => sum + group.progress, 0) / groups.length) : 0
  const totalEvaluated = groups.reduce((sum, group) => sum + group.evaluated, 0)
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null

  const openQuickFeedback = (groupId: string) => {
    setSelectedGroupId(groupId)
    setFeedbackMessage("")
    setQuickFeedbackOpen(true)
  }

  const openRequestRevision = (groupId: string) => {
    setSelectedGroupId(groupId)
    setRevisionReason("")
    setRevisionDeadline("")
    setRevisionOpen(true)
  }

  const submitQuickFeedback = () => {
    if (!selectedGroup) return
    if (!feedbackMessage.trim()) return

    setQuickFeedbackOpen(false)
    toast.success("Quick feedback sent", {
      description: `Feedback submitted for ${selectedGroup.groupName}.`,
    })
  }

  const submitRevision = () => {
    if (!selectedGroup) return
    if (!revisionReason.trim() || !revisionDeadline.trim()) return

    setRevisionOpen(false)
    toast.success("Revision request sent", {
      description: `Revision requested for ${selectedGroup.groupName}.`,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/advisor/evaluations">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {stage}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{cfg.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(stage === "Capstone I" ? "/dashboard/advisor/evaluations/capstone-ii" : "/dashboard/advisor/evaluations/capstone-i") }>
            Switch to {stage === "Capstone I" ? "Capstone II" : "Capstone I"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <DashboardPageHeader
        title={`${stage} Evaluation Dashboard`}
        description="Use the stage-specific rubric to review groups and evaluate students in sequence."
        badge={`${groups.length} groups`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Groups</p>
            <p className={`text-2xl font-semibold ${cfg.accent}`}>{groups.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Students</p>
            <p className={`text-2xl font-semibold ${cfg.accent}`}>{totalPending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg. Progress</p>
            <p className={`text-2xl font-semibold ${cfg.accent}`}>{avgProgress}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className={`h-5 w-5 ${cfg.accent}`} />
            {stage} Criteria
          </CardTitle>
          <CardDescription>What to verify before marking a group complete</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(stage === "Capstone I"
            ? ["Proposal clarity", "SDD readiness", "Problem definition", "Advisor approval"]
            : ["Implementation completeness", "Testing evidence", "Final results", "Defense readiness"]
          ).map((item) => (
            <Badge key={item} variant="outline" className={`${cfg.chip} px-3 py-1`}>
              {item}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups or projects..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderKanban className={`h-5 w-5 ${cfg.accent}`} />
                    {group.groupName}
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">{group.projectTitle}</CardDescription>
                </div>
                <Badge variant="outline" className={cfg.chip}>{group.stage}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{group.progress}%</span>
                </div>
                <Progress value={group.progress} className="h-2" />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending / Evaluated</span>
                <span className="font-medium">{group.pending} / {group.evaluated}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {group.criteria.map((criterion) => (
                  <Badge key={criterion} variant="secondary" className="text-xs">
                    {criterion}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-muted-foreground">{group.dueLabel}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/advisor/evaluations/${stage === "Capstone I" ? "capstone-i" : "capstone-ii"}/${group.id}/detail`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Detail
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/advisor/evaluations/${stage === "Capstone I" ? "capstone-i" : "capstone-ii"}/${group.id}/open`}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {cfg.cta}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => openQuickFeedback(group.id)}>
                      Quick Feedback
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => openRequestRevision(group.id)}>
                      Request Revision
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">No groups found for this stage</p>
            <p className="mt-1 text-xs text-muted-foreground">Try changing the search term.</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" /> Stage Summary
          </CardTitle>
          <CardDescription>Overview of groups currently in {stage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Students needing evaluation</span>
            <span className="font-semibold">{totalPending}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Students already evaluated</span>
            <span className="font-semibold">{totalEvaluated}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Stage coverage</span>
            <span className="font-semibold">{avgProgress}%</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={quickFeedbackOpen} onOpenChange={setQuickFeedbackOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Quick Feedback</DialogTitle>
            <DialogDescription>
              {selectedGroup ? `${selectedGroup.groupName} • ${selectedGroup.projectTitle}` : "Provide short feedback for this group."}
            </DialogDescription>
          </DialogHeader>
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label>Feedback</Label>
                <Textarea
                  value={feedbackMessage}
                  onChange={(event) => setFeedbackMessage(event.target.value)}
                  placeholder="Write concise advisor feedback..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setQuickFeedbackOpen(false)}>Cancel</Button>
                <Button onClick={submitQuickFeedback} disabled={!feedbackMessage.trim()}>Send Feedback</Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              {selectedGroup ? `${selectedGroup.groupName} • ${selectedGroup.projectTitle}` : "Request a revision for this group submission."}
            </DialogDescription>
          </DialogHeader>
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label>Revision Notes</Label>
                <Textarea
                  value={revisionReason}
                  onChange={(event) => setRevisionReason(event.target.value)}
                  placeholder="List what needs to be revised..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Revision Deadline</Label>
                <Input type="date" value={revisionDeadline} onChange={(event) => setRevisionDeadline(event.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRevisionOpen(false)}>Cancel</Button>
                <Button onClick={submitRevision} disabled={!revisionReason.trim() || !revisionDeadline.trim()}>Send Request</Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  )
}
