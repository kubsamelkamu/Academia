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
  AlertCircle,
  MessageSquare,
  History,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { CAPSTONE_GROUPS } from "./capstone-evaluation-data"

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
  lastActivity?: string
  students?: {
    capstone1Status?: string
    capstone2Status?: string
  }[]
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
    lastActivity: "2 days ago",
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
    lastActivity: "5 hours ago",
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
    lastActivity: "1 week ago",
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
    lastActivity: "3 days ago",
  },
]

function stageConfig(stage: CapstoneStage) {
  return {
    accent: "text-primary",
    chip: "bg-primary/10 text-primary border-primary/20",
    subtitle: stage === "Capstone I" 
      ? "Proposal, scope, and SDD-oriented evaluation" 
      : "Implementation, testing, and final defense evaluation",
    cta: stage === "Capstone I" ? "Open Capstone I" : "Open Capstone II",
    gradient: "from-primary/10 to-transparent",
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
    )).map(group => {
      // Find the group in the real data to get students
      // NOTE: We look for the group by ID regardless of stage in CAPSTONE_GROUPS 
      // because some groups might be defined as Capstone I in CAPSTONE_GROUPS 
      // but we are viewing them in a Capstone II context or vice versa.
      const realGroup = CAPSTONE_GROUPS.find(cg => cg.id === group.id);
      return {
        ...group,
        students: realGroup?.students || []
      };
    })
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/advisor/evaluations">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {stage}
              </h1>
              <Badge className={cfg.chip}>{stage}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{cfg.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(stage === "Capstone I" ? "/dashboard/advisor/evaluations/capstone-ii" : "/dashboard/advisor/evaluations/capstone-i") } className="rounded-full">
            Switch to {stage === "Capstone I" ? "Capstone II" : "Capstone I"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={`overflow-hidden border-none shadow-md bg-gradient-to-br ${cfg.gradient}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Groups</p>
              <Users className={`h-5 w-5 ${cfg.accent}`} />
            </div>
            <p className={`text-4xl font-bold ${cfg.accent}`}>{groups.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Assigned for evaluation</p>
          </CardContent>
        </Card>
        <Card className={`overflow-hidden border-none shadow-md bg-gradient-to-br ${cfg.gradient}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Students</p>
              <Clock className={`h-5 w-5 ${cfg.accent}`} />
            </div>
            <p className={`text-4xl font-bold ${cfg.accent}`}>{totalPending}</p>
            <p className="text-xs text-muted-foreground mt-2">Need immediate review</p>
          </CardContent>
        </Card>
        <Card className={`overflow-hidden border-none shadow-md bg-gradient-to-br ${cfg.gradient}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Avg. Progress</p>
              <BarChart3 className={`h-5 w-5 ${cfg.accent}`} />
            </div>
            <p className={`text-4xl font-bold ${cfg.accent}`}>{avgProgress}%</p>
            <Progress value={avgProgress} className="h-1.5 mt-4" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className={`h-5 w-5 ${cfg.accent}`} />
            Evaluation Rubric: {stage}
          </CardTitle>
          <CardDescription>Key criteria to verify during this phase</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(stage === "Capstone I"
            ? ["Proposal clarity", "SDD readiness", "Problem definition", "Advisor approval", "Literature review", "Feasibility study"]
            : ["Implementation completeness", "Testing evidence", "Final results", "Defense readiness", "User manual", "Source code quality"]
          ).map((item) => (
            <Badge key={item} variant="secondary" className="px-3 py-1 text-xs font-medium bg-white shadow-sm border-none">
              <CheckCircle2 className="h-3 w-3 mr-1.5 text-primary" />
              {item}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TabsList className="bg-muted/50 p-1 rounded-full">
            <TabsTrigger value="all" className="rounded-full px-6">All Groups</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-full px-6">Pending</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-full px-6">Completed</TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search groups..." 
              className="pl-9 rounded-full bg-muted/50 border-none focus-visible:ring-primary/20" 
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {groups.map((group) => (
              <Card key={group.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-card">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/30" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                        {group.groupName}
                      </CardTitle>
                      <CardDescription className="line-clamp-1 font-medium text-muted-foreground">
                        {group.projectTitle}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Group Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/advisor/evaluations/${stage === "Capstone I" ? "capstone-i" : "capstone-ii"}/${group.id}/detail`}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/advisor/evaluations/${stage === "Capstone I" ? "capstone-i" : "capstone-ii"}/${group.id}/open`}>
                            <PlayCircle className="h-4 w-4 mr-2" /> Start Evaluation
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => openQuickFeedback(group.id)}>
                          <MessageSquare className="h-4 w-4 mr-2" /> Quick Feedback
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openRequestRevision(group.id)} className="text-rose-600 focus:text-rose-600">
                          <AlertCircle className="h-4 w-4 mr-2" /> Request Revision
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Completion Progress</span>
                      <span className="font-bold">{group.progress}%</span>
                    </div>
                    <Progress value={group.progress} className="h-2 rounded-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/40 p-3 rounded-xl">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Students</p>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">{group.pending + group.evaluated} Total</span>
                      </div>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-xl">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-600">{group.pending} Pending</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {group.criteria.slice(0, 3).map((criterion) => (
                      <Badge key={criterion} variant="outline" className="text-[10px] py-0 px-2 font-normal border-muted-foreground/20">
                        {criterion}
                      </Badge>
                    ))}
                    {group.criteria.length > 3 && (
                      <Badge variant="outline" className="text-[10px] py-0 px-2 font-normal border-muted-foreground/20">
                        +{group.criteria.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-muted">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <History className="h-3.5 w-3.5" />
                      Updated {group.lastActivity || "recently"}
                    </div>
                    <Button asChild size="sm" className="rounded-full px-4 shadow-md group-hover:shadow-lg transition-all">
                      <Link href={`/dashboard/advisor/evaluations/${stage === "Capstone I" ? "capstone-i" : "capstone-ii"}/${group.id}/open`}>
                        Evaluate <PlayCircle className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {groups.length === 0 && (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="py-20 text-center">
                <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-semibold text-muted-foreground">No groups found</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                  We couldn&apos;t find any groups matching your search criteria for this stage.
                </p>
                <Button variant="outline" className="mt-6 rounded-full" onClick={() => setSearch("")}>
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          <div className="grid gap-6 lg:grid-cols-2">
            {groups.filter(g => g.students.some(s => (stage === "Capstone I" ? s.capstone1Status : s.capstone2Status) === "Pending Review")).map((group) => (
              <Card key={group.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-card">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/30" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                        {group.groupName}
                      </CardTitle>
                      <CardDescription className="line-clamp-1 font-medium text-muted-foreground">
                        {group.projectTitle}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Completion Progress</span>
                      <span className="font-bold">{group.progress}%</span>
                    </div>
                    <Progress value={group.progress} className="h-2 rounded-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/40 p-3 rounded-xl">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Students</p>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">{group.students.length} Total</span>
                      </div>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-xl">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Unevaluated</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-600">
                          {group.students.filter(s => (stage === "Capstone I" ? s.capstone1Status : s.capstone2Status) === "Pending Review").length} Students
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-muted">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <History className="h-3.5 w-3.5" />
                      Updated {group.lastActivity || "recently"}
                    </div>
                    <Button asChild size="sm" className="rounded-full px-4 shadow-md group-hover:shadow-lg transition-all">
                      <Link href={`/dashboard/advisor/evaluations/${stage === "Capstone I" ? "capstone-i" : "capstone-ii"}/${group.id}/open`}>
                        Evaluate <PlayCircle className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {groups.filter(g => g.students.some(s => (stage === "Capstone I" ? s.capstone1Status : s.capstone2Status) === "Pending Review")).length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No pending evaluations for this stage.
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          <div className="grid gap-6 lg:grid-cols-2">
            {groups.filter(g => g.students.every(s => (stage === "Capstone I" ? s.capstone1Status : s.capstone2Status) === "Evaluated")).map((group) => (
              <Card key={group.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-card opacity-90">
                <div className="h-1.5 w-full bg-emerald-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold">
                        {group.groupName}
                      </CardTitle>
                      <CardDescription className="line-clamp-1 font-medium text-muted-foreground">
                        {group.projectTitle}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Completed</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">All Students Evaluated</p>
                      <p className="text-xs text-emerald-700">Evaluation phase complete for this group.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-muted">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <History className="h-3.5 w-3.5" />
                      Finished {group.lastActivity || "recently"}
                    </div>
                    <Button asChild variant="outline" size="sm" className="rounded-full px-4">
                      <Link href={`/dashboard/advisor/evaluations/${stage === "Capstone I" ? "capstone-i" : "capstone-ii"}/${group.id}/detail`}>
                        View Results <Eye className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {groups.filter(g => g.students.every(s => (stage === "Capstone I" ? s.capstone1Status : s.capstone2Status) === "Evaluated")).length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No completed evaluations yet.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={quickFeedbackOpen} onOpenChange={setQuickFeedbackOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className={`h-2 w-full bg-gradient-to-r from-primary to-primary/30`} />
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold">Quick Feedback</DialogTitle>
              <DialogDescription className="text-base">
                {selectedGroup ? (
                  <span className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="rounded-full">{selectedGroup.groupName}</Badge>
                    <span className="text-muted-foreground truncate">{selectedGroup.projectTitle}</span>
                  </span>
                ) : "Provide short feedback for this group."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Message</Label>
                <Textarea
                  value={feedbackMessage}
                  onChange={(event) => setFeedbackMessage(event.target.value)}
                  placeholder="e.g., Great progress on the SDD. Please refine the architecture diagram."
                  className="min-h-[150px] rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 p-4 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setQuickFeedbackOpen(false)} className="rounded-full px-6">Cancel</Button>
                <Button onClick={submitQuickFeedback} disabled={!feedbackMessage.trim()} className="rounded-full px-8 shadow-lg shadow-primary/20">
                  Send Feedback
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="h-2 w-full bg-rose-500" />
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-rose-500" />
                Request Revision
              </DialogTitle>
              <DialogDescription className="text-base">
                {selectedGroup ? (
                  <span className="flex items-center gap-2 mt-1">
                    <Badge variant="destructive" className="rounded-full bg-rose-500/10 text-rose-600 border-none">{selectedGroup.groupName}</Badge>
                    <span className="text-muted-foreground truncate">{selectedGroup.projectTitle}</span>
                  </span>
                ) : "Request a revision for this group submission."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Revision Requirements</Label>
                <Textarea
                  value={revisionReason}
                  onChange={(event) => setRevisionReason(event.target.value)}
                  placeholder="Clearly state what needs to be changed or improved..."
                  className="min-h-[150px] rounded-2xl bg-muted/30 border-none focus-visible:ring-rose-500/20 p-4 resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">New Deadline</Label>
                <Input 
                  type="date" 
                  value={revisionDeadline} 
                  onChange={(event) => setRevisionDeadline(event.target.value)} 
                  className="rounded-xl bg-muted/30 border-none focus-visible:ring-rose-500/20 h-12 px-4"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setRevisionOpen(false)} className="rounded-full px-6">Cancel</Button>
                <Button onClick={submitRevision} disabled={!revisionReason.trim() || !revisionDeadline.trim()} className="rounded-full px-8 bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20">
                  Submit Request
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
