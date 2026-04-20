"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  GraduationCap,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ProposalPhase = "capstone_i" | "capstone_ii"
type ProposalStatus = "pending_advisor" | "advisor_revised" | "pending_coordinator" | "approved" | "changes_requested"
type ProposalPriority = "high" | "medium" | "low"

interface ProposalRecord {
  id: string
  projectId: string
  projectTitle: string
  groupName: string
  coordinator: string
  advisorName: string
  submittedBy: string
  phase: ProposalPhase
  status: ProposalStatus
  priority: ProposalPriority
  submittedAt: string
  coordinatorDeadline: string
  tags: string[]
  abstract: string
  objectives: string[]
  attachments: { name: string; kind: "proposal" | "slides" | "budget" | "architecture" }[]
  advisorFeedback: string[]
  readinessScore: number
}

const PROPOSALS: ProposalRecord[] = [
  {
    id: "pr1",
    projectId: "p1",
    projectTitle: "AI-Driven Academic Assistant",
    groupName: "AI Research Group",
    coordinator: "Dr. Michael Brown",
    advisorName: "Prof. Lisa Anderson",
    submittedBy: "Maria Garcia",
    phase: "capstone_i",
    status: "pending_coordinator",
    priority: "high",
    submittedAt: "2026-03-25",
    coordinatorDeadline: "2026-04-03",
    tags: ["NLP", "Education", "AI"],
    abstract: "A senior project proposal for an AI-powered academic support assistant that helps students discover resources, track milestones, and receive adaptive guidance.",
    objectives: [
      "Improve student access to academic resources.",
      "Recommend milestones and learning materials using simple personalization.",
      "Provide coordinator-friendly reporting for proposal and progress visibility.",
    ],
    attachments: [
      { name: "proposal-v2.pdf", kind: "proposal" },
      { name: "system-architecture.pdf", kind: "architecture" },
      { name: "demo-slides.pptx", kind: "slides" },
    ],
    advisorFeedback: [
      "Problem statement is clear and relevant to CCI workflows.",
      "Please sharpen the evaluation metrics for recommendation quality.",
    ],
    readinessScore: 88,
  },
  {
    id: "pr2",
    projectId: "p2",
    projectTitle: "Campus Energy Monitoring Dashboard",
    groupName: "Data Analytics Team",
    coordinator: "Dr. Michael Brown",
    advisorName: "Dr. Robert Taylor",
    submittedBy: "Alice Brown",
    phase: "capstone_i",
    status: "changes_requested",
    priority: "medium",
    submittedAt: "2026-03-20",
    coordinatorDeadline: "2026-03-30",
    tags: ["IoT", "Dashboard", "Sustainability"],
    abstract: "A dashboard-based proposal for collecting and presenting campus energy metrics from smart sensors to support monitoring and decision making.",
    objectives: [
      "Build a faculty-friendly dashboard for energy usage.",
      "Surface energy anomalies and weekly trends.",
      "Prepare a realistic pilot deployment on one campus block.",
    ],
    attachments: [
      { name: "proposal-draft.pdf", kind: "proposal" },
      { name: "budget-estimate.xlsx", kind: "budget" },
    ],
    advisorFeedback: [
      "Good scope, but the deployment section needs more detail.",
      "Clarify data ownership and maintenance responsibilities.",
    ],
    readinessScore: 64,
  },
  {
    id: "pr3",
    projectId: "p3",
    projectTitle: "Secure Research Discussion Portal",
    groupName: "Security Systems",
    coordinator: "Dr. Michael Brown",
    advisorName: "Prof. Emily Davis",
    submittedBy: "Charlie Davis",
    phase: "capstone_ii",
    status: "pending_advisor",
    priority: "low",
    submittedAt: "2026-03-27",
    coordinatorDeadline: "2026-04-06",
    tags: ["Security", "Access Control", "Collaboration"],
    abstract: "A continuation proposal for implementation and controlled rollout of a secure collaboration portal with document and access workflows for research groups.",
    objectives: [
      "Finalize role-based access controls.",
      "Prepare Capstone II implementation milestones.",
      "Define demonstration-ready security scenarios.",
    ],
    attachments: [
      { name: "capstone-ii-plan.pdf", kind: "proposal" },
    ],
    advisorFeedback: [
      "Awaiting advisor scoring checklist before coordinator review.",
    ],
    readinessScore: 52,
  },
  {
    id: "pr4",
    projectId: "p4",
    projectTitle: "Smart Campus Navigation System",
    groupName: "Mobile Dev Team",
    coordinator: "Dr. Michael Brown",
    advisorName: "Dr. Robert Taylor",
    submittedBy: "Samuel Lee",
    phase: "capstone_ii",
    status: "approved",
    priority: "medium",
    submittedAt: "2026-03-18",
    coordinatorDeadline: "2026-03-28",
    tags: ["Mobile", "BLE", "Indoor Navigation"],
    abstract: "An implementation and demonstration plan for the campus navigation product, covering beacon deployment, UX flow, and test scenarios.",
    objectives: [
      "Deliver an end-to-end navigation flow.",
      "Validate room-level positioning accuracy.",
      "Prepare a live defense demonstration.",
    ],
    attachments: [
      { name: "implementation-plan.pdf", kind: "proposal" },
      { name: "demo-script.docx", kind: "slides" },
    ],
    advisorFeedback: [
      "Implementation milestones are realistic.",
      "Demo flow is polished and defense-ready.",
    ],
    readinessScore: 93,
  },
]

const STATUS_CONFIG: Record<ProposalStatus, { label: string; className: string }> = {
  pending_advisor: { label: "Pending Advisor", className: "bg-muted text-muted-foreground border-border" },
  advisor_revised: { label: "Advisor Revised", className: "bg-amber-500/10 text-amber-700 border-amber-200" },
  pending_coordinator: { label: "Pending Coordinator", className: "bg-primary/10 text-primary border-primary/20" },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  changes_requested: { label: "Changes Requested", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

const PHASE_LABELS: Record<ProposalPhase, string> = {
  capstone_i: "Capstone I",
  capstone_ii: "Capstone II",
}

const PRIORITY_CLASS: Record<ProposalPriority, string> = {
  high: "text-destructive",
  medium: "text-amber-700",
  low: "text-muted-foreground",
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function daysRemaining(value: string) {
  const today = new Date()
  const target = new Date(value)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

export default function CoordinatorProposalManagementPage() {
  const [proposals, setProposals] = useState<ProposalRecord[]>(PROPOSALS)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">("all")
  const [phaseFilter, setPhaseFilter] = useState<ProposalPhase | "all">("all")
  const [selectedProposal, setSelectedProposal] = useState<ProposalRecord | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [coordinatorNote, setCoordinatorNote] = useState("")

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return proposals.filter((proposal) => {
      const matchesQuery =
        !needle ||
        proposal.projectTitle.toLowerCase().includes(needle) ||
        proposal.groupName.toLowerCase().includes(needle) ||
        proposal.advisorName.toLowerCase().includes(needle) ||
        proposal.tags.some((tag) => tag.toLowerCase().includes(needle))

      const matchesStatus = statusFilter === "all" || proposal.status === statusFilter
      const matchesPhase = phaseFilter === "all" || proposal.phase === phaseFilter
      return matchesQuery && matchesStatus && matchesPhase
    })
  }, [phaseFilter, proposals, query, statusFilter])

  const stats = useMemo(() => {
    const pendingCoordinator = proposals.filter((item) => item.status === "pending_coordinator").length
    const approved = proposals.filter((item) => item.status === "approved").length
    const needsChanges = proposals.filter((item) => item.status === "changes_requested").length
    const avgReadiness = Math.round(proposals.reduce((sum, item) => sum + item.readinessScore, 0) / proposals.length)
    return { pendingCoordinator, approved, needsChanges, avgReadiness }
  }, [proposals])

  const openProposal = (proposal: ProposalRecord) => {
    setSelectedProposal(proposal)
    setCoordinatorNote("")
    setSheetOpen(true)
  }

  const updateProposalStatus = (status: ProposalStatus, successTitle: string, description: string) => {
    if (!selectedProposal) return

    setProposals((current) =>
      current.map((proposal) =>
        proposal.id === selectedProposal.id
          ? { ...proposal, status, advisorFeedback: coordinatorNote.trim() ? [...proposal.advisorFeedback, coordinatorNote.trim()] : proposal.advisorFeedback }
          : proposal
      )
    )

    toast.success(successTitle, { description })
    setSheetOpen(false)
    setSelectedProposal(null)
    setCoordinatorNote("")
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Proposal Review
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review proposal packets, coordinator decisions, and readiness for Capstone I and II
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-11 sm:pl-0">
          <Badge variant="outline" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> {proposals.length} submissions
          </Badge>
          <Badge className="gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            <Clock className="h-3.5 w-3.5" /> {stats.pendingCoordinator} awaiting coordinator
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pending Review", value: stats.pendingCoordinator, icon: Clock, tone: "text-primary", bg: "bg-primary/10" },
          { label: "Approved", value: stats.approved, icon: CheckCircle2, tone: "text-emerald-700", bg: "bg-emerald-500/10" },
          { label: "Need Changes", value: stats.needsChanges, icon: XCircle, tone: "text-destructive", bg: "bg-destructive/10" },
          { label: "Avg Readiness", value: `${stats.avgReadiness}%`, icon: Sparkles, tone: "text-amber-700", bg: "bg-amber-500/10" },
        ].map((item) => (
          <Card key={item.label} className="group border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4">
              <div className={cn("h-8 w-8 sm:h-11 sm:w-11 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", item.bg)}>
                <item.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", item.tone)} />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tracking-tight">{item.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, group, advisor, or tag..."
                className="h-10 pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProposalStatus | "all")}>
              <SelectTrigger className="h-10 w-full lg:w-52">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_advisor">Pending Advisor</SelectItem>
                <SelectItem value="advisor_revised">Advisor Revised</SelectItem>
                <SelectItem value="pending_coordinator">Pending Coordinator</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="changes_requested">Changes Requested</SelectItem>
              </SelectContent>
            </Select>
            <Select value={phaseFilter} onValueChange={(value) => setPhaseFilter(value as ProposalPhase | "all")}>
              <SelectTrigger className="h-10 w-full lg:w-44">
                <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                <SelectItem value="capstone_i">Capstone I</SelectItem>
                <SelectItem value="capstone_ii">Capstone II</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">No proposal packets match the current filters</p>
              <p className="mt-1 text-xs text-muted-foreground">Try clearing a filter or broadening your search.</p>
            </div>
          ) : (
            filtered.map((proposal) => {
              const days = daysRemaining(proposal.coordinatorDeadline)
              return (
                <Card key={proposal.id} className="border-none shadow-sm transition-all hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold leading-tight">{proposal.projectTitle}</h3>
                            <Badge variant="outline" className={STATUS_CONFIG[proposal.status].className}>
                              {STATUS_CONFIG[proposal.status].label}
                            </Badge>
                            <Badge variant="outline">{PHASE_LABELS[proposal.phase]}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{proposal.groupName} · Advisor: {proposal.advisorName}</p>
                          <p className="line-clamp-2 text-sm text-foreground/80">{proposal.abstract}</p>
                          <div className="flex flex-wrap gap-2">
                            {proposal.tags.map((tag) => (
                              <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="min-w-[220px] space-y-3 rounded-xl border bg-muted/20 p-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Coordinator deadline</span>
                          <span className={cn("font-semibold", days < 0 ? "text-destructive" : days <= 3 ? "text-amber-700" : "text-primary")}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Readiness</span>
                            <span className="font-semibold">{proposal.readinessScore}%</span>
                          </div>
                          <Progress value={proposal.readinessScore} className="h-1.5" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-background px-3 py-2">
                            <p className="text-muted-foreground">Submitted</p>
                            <p className="font-medium">{formatDate(proposal.submittedAt)}</p>
                          </div>
                          <div className="rounded-lg bg-background px-3 py-2">
                            <p className="text-muted-foreground">Priority</p>
                            <p className={cn("font-medium capitalize", PRIORITY_CLASS[proposal.priority])}>{proposal.priority}</p>
                          </div>
                        </div>
                        <Button className="w-full gap-2" onClick={() => openProposal(proposal)}>
                          <ShieldCheck className="h-4 w-4" /> Open review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        <Card className="border-none shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-base">Coordinator Checklist</CardTitle>
            <CardDescription>UI guidance for proposal decisions before backend actions are wired.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              "Confirm advisor feedback is present before final coordinator approval.",
              "Check abstract, objectives, and scope against the selected phase.",
              "Use change-request notes that are specific and actionable for the team.",
              "Prioritize overdue packets and proposals with low readiness scores.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          {selectedProposal && (
            <>
              <SheetHeader className="border-b bg-background px-6 py-4">
                <SheetTitle className="text-left">{selectedProposal.projectTitle}</SheetTitle>
                <SheetDescription className="text-left">
                  {selectedProposal.groupName} · {PHASE_LABELS[selectedProposal.phase]} · submitted by {selectedProposal.submittedBy}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Advisor", value: selectedProposal.advisorName, icon: Users },
                    { label: "Coordinator deadline", value: formatDate(selectedProposal.coordinatorDeadline), icon: Calendar },
                    { label: "Current status", value: STATUS_CONFIG[selectedProposal.status].label, icon: Clock },
                    { label: "Readiness score", value: `${selectedProposal.readinessScore}%`, icon: Sparkles },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border bg-muted/20 px-4 py-3">
                      <p className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                        <item.icon className="h-3.5 w-3.5" /> {item.label}
                      </p>
                      <p className="text-sm font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Abstract
                  </p>
                  <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm leading-relaxed">
                    {selectedProposal.abstract}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Objectives
                  </p>
                  <div className="grid gap-2">
                    {selectedProposal.objectives.map((objective) => (
                      <div key={objective} className="rounded-lg border bg-background px-3 py-2 text-sm">
                        {objective}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Attachments
                    </p>
                    <div className="space-y-2">
                      {selectedProposal.attachments.map((attachment) => (
                        <div key={attachment.name} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
                          <div>
                            <p className="font-medium">{attachment.name}</p>
                            <p className="text-xs capitalize text-muted-foreground">{attachment.kind}</p>
                          </div>
                          <Button variant="ghost" size="sm">Preview</Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Feedback Timeline
                    </p>
                    <div className="space-y-2">
                      {selectedProposal.advisorFeedback.map((feedback, index) => (
                        <div key={`${selectedProposal.id}-${index}`} className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                          {feedback}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="coordinator-note">Coordinator note</Label>
                  <Textarea
                    id="coordinator-note"
                    value={coordinatorNote}
                    onChange={(event) => setCoordinatorNote(event.target.value)}
                    placeholder="Add approval notes or requested changes for the group..."
                    className="min-h-[110px] resize-none"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <Button
                    className="gap-2"
                    onClick={() =>
                      updateProposalStatus(
                        "approved",
                        "Proposal approved",
                        "The coordinator review is complete and the project team can proceed."
                      )
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 hover:border-destructive hover:text-destructive"
                    onClick={() =>
                      updateProposalStatus(
                        "changes_requested",
                        "Changes requested",
                        "Coordinator revision notes were added for the team."
                      )
                    }
                  >
                    <XCircle className="h-4 w-4" /> Request changes
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 hover:border-primary hover:text-primary"
                    onClick={() =>
                      updateProposalStatus(
                        "pending_coordinator",
                        "Proposal escalated",
                        "The packet has been flagged for final coordinator follow-up."
                      )
                    }
                  >
                    <Send className="h-4 w-4" /> Follow up
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
