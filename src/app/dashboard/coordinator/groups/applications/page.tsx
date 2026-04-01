"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  UserPlus,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  AlertCircle,
  ChevronRight,
  Eye,
  Star,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  usePendingGroupLeaderRequests,
  useApproveGroupLeaderRequest,
  useRejectGroupLeaderRequest,
} from "@/lib/hooks/use-group-leader-requests"
import { mockGroupManagerApplications, type GroupManagerApplication } from "@/data/mockData"

/* ─── Types ─────────────────────────────────────────────────────────── */
type AppStatus = "pending" | "approved" | "rejected"

/** Normalised shape used in the UI */
interface AppItem {
  id: string
  name: string
  email: string
  department?: string
  requestedAt: string
  status: AppStatus
  /** Only present on mock items */
  motivation?: string
  proposedGroupName?: string
  currentRole?: string
  isMock: boolean
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

const STATUS_CFG: Record<AppStatus, { label: string; cls: string; dot: string; icon: React.ElementType }> = {
  pending:  { label: "Pending",  cls: "bg-amber-500/10 text-amber-600 border-amber-400/30",    dot: "bg-amber-500",   icon: Clock },
  approved: { label: "Approved", cls: "bg-primary/10 text-primary border-primary/20",           dot: "bg-primary",     icon: CheckCircle },
  rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive", icon: XCircle },
}

/* ─── Application Card ───────────────────────────────────────────────── */
function AppCard({
  app,
  onReview,
}: {
  app: AppItem
  onReview: () => void
}) {
  const sc = STATUS_CFG[app.status]
  const StatusIcon = sc.icon
  return (
    <div className={cn(
      "group rounded-xl border bg-card p-4 flex items-center gap-4 hover:border-primary/30 hover:shadow-sm transition-all",
      app.status === "pending" ? "border-border/70" : "border-border/40 opacity-80 hover:opacity-100"
    )}>
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={`https://avatar.vercel.sh/${app.name}`} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{initials(app.name)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-semibold text-sm">{app.name}</span>
          <Badge variant="outline" className={cn("text-xs h-5", sc.cls)}>
            <span className={cn("h-1.5 w-1.5 rounded-full mr-1", sc.dot)} />
            {sc.label}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{app.email}</span>
          {app.department && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{app.department}</span>}
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(app.requestedAt)}</span>
        </div>
        {app.proposedGroupName && (
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Star className="h-3 w-3 text-primary" />
            Proposed group: <span className="font-medium text-foreground">{app.proposedGroupName}</span>
          </p>
        )}
      </div>

      <Button
        size="sm"
        variant={app.status === "pending" ? "default" : "outline"}
        className="shrink-0 gap-1.5 text-xs h-8"
        onClick={onReview}
      >
        <Eye className="h-3.5 w-3.5" />
        {app.status === "pending" ? "Review" : "View"}
      </Button>
    </div>
  )
}

/* ─── Review Sheet ─────────────────────────────────────────────────── */
function ReviewSheet({
  app,
  open,
  onClose,
  onDecide,
}: {
  app: AppItem | null
  open: boolean
  onClose: () => void
  onDecide: (id: string, decision: "approved" | "rejected", reason: string) => Promise<void>
}) {
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null)
  const [reason, setReason]     = useState("")
  const [loading, setLoading]   = useState(false)

  // Reset on open
  React.useEffect(() => {
    if (open) { setDecision(null); setReason("") }
  }, [open, app?.id])

  if (!app) return null

  const sc = STATUS_CFG[app.status]
  const alreadyDecided = app.status !== "pending"

  const handleSubmit = async () => {
    if (!decision) { toast.error("Select a decision first"); return }
    if (!reason.trim()) { toast.error("Please provide a reason for your decision"); return }
    setLoading(true)
    await onDecide(app.id, decision, reason)
    setLoading(false)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        {/* Sticky header */}
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={`https://avatar.vercel.sh/${app.name}`} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials(app.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-base">{app.name}</SheetTitle>
                <Badge variant="outline" className={cn("text-xs", sc.cls)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full mr-1", sc.dot)} />
                  {sc.label}
                </Badge>
              </div>
              <SheetDescription className="text-xs">Group Leader Application · {fmtDate(app.requestedAt)}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5">
          {/* Profile block */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Applicant Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Email</p>
                <p className="text-sm font-medium break-all">{app.email}</p>
              </div>
              {app.department && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Department</p>
                  <p className="text-sm font-medium">{app.department}</p>
                </div>
              )}
              {app.currentRole && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Current Role</p>
                  <p className="text-sm font-medium capitalize">{app.currentRole.replace("_", " ")}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Requested Role</p>
                <p className="text-sm font-medium text-primary">Group Leader</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Submitted</p>
                <p className="text-sm font-medium">{fmtDate(app.requestedAt)}</p>
              </div>
              {app.proposedGroupName && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Proposed Group</p>
                  <p className="text-sm font-medium">{app.proposedGroupName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Motivation */}
          {app.motivation ? (
            <div className="rounded-xl border bg-muted/10 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Motivation Statement
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{app.motivation}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/10 p-4 flex items-center gap-3 text-muted-foreground">
              <FileText className="h-5 w-5 shrink-0" />
              <p className="text-sm">No motivation statement available for this application.</p>
            </div>
          )}

          {/* Decision panel */}
          {alreadyDecided ? (
            <div className={cn("rounded-xl border p-4 flex items-center gap-3", sc.cls)}>
              <sc.icon className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">
                This application has already been <span className="font-bold">{app.status}</span>.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Decision</p>
                <button
                  type="button"
                  onClick={() => setDecision("approved")}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                    decision === "approved"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    decision === "approved" ? "bg-white/20" : "bg-primary/10")}>
                    <CheckCircle className={cn("h-4 w-4", decision === "approved" ? "text-white" : "text-primary")} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Approve Application</p>
                    <p className={cn("text-xs", decision === "approved" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      Grant group leader role to this student
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision("rejected")}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                    decision === "rejected"
                      ? "border-destructive bg-destructive text-destructive-foreground shadow-md"
                      : "border-border/60 bg-card hover:border-destructive/40 hover:bg-destructive/5"
                  )}
                >
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    decision === "rejected" ? "bg-white/20" : "bg-destructive/10")}>
                    <XCircle className={cn("h-4 w-4", decision === "rejected" ? "text-white" : "text-destructive")} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Reject Application</p>
                    <p className={cn("text-xs", decision === "rejected" ? "text-destructive-foreground/70" : "text-muted-foreground")}>
                      Decline this request with a reason
                    </p>
                  </div>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Decision Reason <span className="text-destructive">*</span>
                  </label>
                  <span className="text-xs text-muted-foreground">{reason.length}/500</span>
                </div>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value.slice(0, 500))}
                  rows={5}
                  placeholder="Provide a clear reason for your decision. This will be shared with the student…"
                  className="resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Your reason helps maintain transparency and provides useful feedback to the student.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full h-11 gap-2"
                  disabled={loading || !decision || !reason.trim()}
                  onClick={handleSubmit}
                >
                  {loading
                    ? <><div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Processing…</>
                    : <><ChevronRight className="h-4 w-4" /> Submit Decision</>
                  }
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function CoordinatorApplicationsPage() {
  const [search, setSearch]     = useState("")
  const [tab, setTab]           = useState("pending")
  const [selected, setSelected] = useState<AppItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  /* Local state for mock items (status changes stay in memory) */
  const [mockStatuses, setMockStatuses] = useState<Record<string, AppStatus>>(
    Object.fromEntries(mockGroupManagerApplications.map(a => [a.id, a.status as AppStatus]))
  )

  /* API hooks */
  const { data: apiData, isLoading: apiLoading, isError: apiError, refetch } = usePendingGroupLeaderRequests({ page: 1, search: "" })
  const approveM = useApproveGroupLeaderRequest()
  const rejectM  = useRejectGroupLeaderRequest()

  /* Build unified list */
  const allItems: AppItem[] = useMemo(() => {
    const mockItems: AppItem[] = mockGroupManagerApplications.map(a => ({
      id: a.id,
      name: a.studentName,
      email: a.email,
      requestedAt: a.requestedAt,
      status: mockStatuses[a.id] ?? (a.status as AppStatus),
      motivation: a.motivation,
      proposedGroupName: a.proposedGroupName,
      currentRole: a.currentRole,
      isMock: true,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = (apiData as any)?.data?.items ?? []
    const apiItems: AppItem[] = raw.map((r: { id: string; firstName?: string; lastName?: string; email: string; departmentName?: string; createdAt: string }) => ({
      id: r.id,
      name: [r.firstName, r.lastName].filter(Boolean).join(" ") || r.email,
      email: r.email,
      department: r.departmentName,
      requestedAt: r.createdAt,
      status: "pending" as AppStatus,
      isMock: false,
    }))

    /* Deduplicate (API items might overlap with mock by email) */
    const seen = new Set(mockItems.map(m => m.email))
    const uniqueApi = apiItems.filter(a => !seen.has(a.email))
    return [...mockItems, ...uniqueApi]
  }, [apiData, mockStatuses])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allItems.filter(a => {
      const matchTab    = tab === "all" || a.status === tab
      const matchSearch = !search || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.proposedGroupName ?? "").toLowerCase().includes(q)
      return matchTab && matchSearch
    })
  }, [allItems, tab, search])

  const counts = useMemo(() => ({
    all:      allItems.length,
    pending:  allItems.filter(a => a.status === "pending").length,
    approved: allItems.filter(a => a.status === "approved").length,
    rejected: allItems.filter(a => a.status === "rejected").length,
  }), [allItems])

  /* Decision handler */
  const handleDecide = async (id: string, decision: "approved" | "rejected", reason: string) => {
    const item = allItems.find(a => a.id === id)
    if (!item) return

    if (item.isMock) {
      await new Promise(r => setTimeout(r, 800))
      setMockStatuses(prev => ({ ...prev, [id]: decision }))
      toast.success(decision === "approved" ? "Application Approved" : "Application Rejected", {
        description: `${item.name}'s request has been ${decision}.`,
      })
    } else {
      try {
        if (decision === "approved") {
          await approveM.mutateAsync({ id })
          toast.success("Application Approved", { description: `${item.name} granted group leader role.` })
        } else {
          await rejectM.mutateAsync({ id, reason })
          toast.success("Application Rejected", { description: `${item.name}'s request declined.` })
        }
        refetch()
      } catch {
        toast.error("Action failed", { description: "Please try again." })
      }
    }
  }

  const openReview = (app: AppItem) => { setSelected(app); setSheetOpen(true) }

  const kpi = [
    { label: "Total Applications", value: counts.all,      icon: UserPlus,    bg: "bg-primary/10",        color: "text-primary" },
    { label: "Pending Review",      value: counts.pending,  icon: Clock,       bg: "bg-amber-500/10",      color: "text-amber-600" },
    { label: "Approved",            value: counts.approved, icon: CheckCircle, bg: "bg-primary/10",        color: "text-primary" },
    { label: "Rejected",            value: counts.rejected, icon: XCircle,     bg: "bg-destructive/10",    color: "text-destructive" },
  ]

  return (
    <div className="space-y-6 pb-10 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator/groups">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Group Leader Applications
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review and process student applications to become group leaders
            </p>
          </div>
        </div>
        <div className="pl-11 sm:pl-0 flex flex-wrap items-center gap-2">
          {counts.pending > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 border-amber-400/30 text-amber-600 text-xs animate-pulse">
              <Clock className="h-3 w-3 mr-1" /> {counts.pending} pending
            </Badge>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map(s => (
          <Card key={s.label} className="group border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", s.bg)}>
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending progress bar */}
      {counts.all > 0 && (
        <div className="rounded-xl border bg-muted/20 px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Review progress</span>
            <span className="font-medium">
              {counts.approved + counts.rejected} / {counts.all} processed
            </span>
          </div>
          <Progress value={((counts.approved + counts.rejected) / counts.all) * 100} className="h-2" />
        </div>
      )}

      {/* Tabs + Search */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="pending"  className="text-xs gap-1.5 shrink-0">
              <Clock className="h-3.5 w-3.5" /> Pending
              {counts.pending > 0 && (
                <Badge className="h-4 px-1.5 text-[10px] bg-amber-500/20 text-amber-600 border-amber-400/30 ml-0.5">{counts.pending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs gap-1.5 shrink-0">
              <CheckCircle className="h-3.5 w-3.5" /> Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs gap-1.5 shrink-0">
              <XCircle className="h-3.5 w-3.5" /> Rejected
            </TabsTrigger>
            <TabsTrigger value="all"      className="text-xs gap-1.5 shrink-0">
              <Filter className="h-3.5 w-3.5" /> All
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, group…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {["pending", "approved", "rejected", "all"].map(t => (
          <TabsContent key={t} value={t} className="mt-4">
            {apiLoading && t === "pending" && (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Loading live applications…
              </div>
            )}
            {apiError && t === "pending" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 mb-3">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                Live data unavailable — showing mock applications only.
              </div>
            )}
            {filtered.length > 0 ? (
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{filtered.length}</span> application{filtered.length !== 1 ? "s" : ""}
                </p>
                {filtered.map(app => (
                  <AppCard key={app.id} app={app} onReview={() => openReview(app)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-center">
                <UserPlus className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="font-medium text-muted-foreground">
                  {search ? "No matching applications" : `No ${t === "all" ? "" : t} applications`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search ? "Try adjusting your search" : "Applications will appear here when students submit them"}
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Review Sheet */}
      <ReviewSheet
        app={selected}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onDecide={handleDecide}
      />
    </div>
  )
}
