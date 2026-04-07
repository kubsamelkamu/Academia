"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Calendar,
  FileText,
  ChevronRight,
  Eye,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  useApproveSubmittedProjectGroupReview,
  useRejectSubmittedProjectGroupReview,
  useSubmittedProjectGroupsForReview,
} from "@/lib/hooks/use-project-groups"
import type {
  ProjectGroupReviewSubmittedItem,
  ProjectGroupReviewSubmittedStatus,
} from "@/types/project-groups"

/* ─── Types ─────────────────────────────────────────────────────────── */
type AppStatus = "pending" | "approved" | "rejected"

interface GroupMember {
  id: string
  name: string
  email: string
  role: "leader" | "member"
}

interface GroupAppItem {
  id: string
  groupName: string
  requestedAt: string
  status: AppStatus
  members: GroupMember[]
  leaderName: string
  rejectionReason?: string | null
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

function toAppStatus(status: string | undefined): AppStatus {
  switch ((status ?? "").toUpperCase()) {
    case "APPROVED":
      return "approved"
    case "REJECTED":
      return "rejected"
    case "PENDING":
    default:
      return "pending"
  }
}

function tabToReviewStatus(tab: string): ProjectGroupReviewSubmittedStatus {
  switch (tab) {
    case "approved":
      return "APPROVED"
    case "rejected":
      return "REJECTED"
    case "pending":
      return "PENDING"
    case "all":
    default:
      return "ALL"
  }
}

function mapSubmittedGroupToAppItem(item: ProjectGroupReviewSubmittedItem): GroupAppItem {
  const leaderName = item.leader.fullName || [item.leader.firstName, item.leader.lastName].filter(Boolean).join(" ") || item.leader.email

  return {
    id: item.id,
    groupName: item.name,
    requestedAt: item.submittedAt,
    status: toAppStatus(item.reviewStatus),
    leaderName,
    rejectionReason: item.rejectionReason,
    members: [
      {
        id: item.leader.id,
        name: leaderName,
        email: item.leader.email,
        role: "leader",
      },
      ...item.members.map((member) => ({
        id: member.id,
        name:
          member.user.fullName ||
          [member.user.firstName, member.user.lastName].filter(Boolean).join(" ") ||
          member.user.email,
        email: member.user.email,
        role: "member" as const,
      })),
    ],
  }
}

/* ─── Review Sheet ─────────────────────────────────────────────────── */
function GroupReviewSheet({
  app,
  open,
  onClose,
  onDecide,
}: {
  app: GroupAppItem | null
  open: boolean
  onClose: () => void
  onDecide: (id: string, decision: "approved" | "rejected", reason?: string) => Promise<void>
}) {
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null)
  const [reason, setReason]     = useState("")
  const [loading, setLoading]   = useState(false)

  React.useEffect(() => {
    if (open) { setDecision(null); setReason("") }
  }, [open, app?.id])

  if (!app) return null

  const sc = STATUS_CFG[app.status]
  const alreadyDecided = app.status !== "pending"

  const handleSubmit = async () => {
    if (!decision) { toast.error("Select a decision first"); return }
    if (decision === "rejected" && !reason.trim()) { toast.error("Please provide a rejection reason"); return }

    setLoading(true)
    try {
      await onDecide(app.id, decision, decision === "rejected" ? reason : undefined)
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit review decision"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-primary bg-primary/10")}>
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-base">{app.groupName}</SheetTitle>
                <Badge variant="outline" className={cn("text-xs", sc.cls)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full mr-1", sc.dot)} />
                  {sc.label}
                </Badge>
              </div>
              <SheetDescription className="text-xs">Group Formation Request · {fmtDate(app.requestedAt)}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5">
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Project Details</p>
            <div className="grid gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Group Name</p>
                <p className="text-sm font-medium">{app.groupName}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/10 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Group Members ({app.members.length})</p>
            <div className="space-y-2">
              {app.members.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2 bg-card rounded-lg border">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      {m.name}
                      {m.role === "leader" && <Badge variant="outline" className="text-[9px] h-4 px-1 bg-primary/5 text-primary border-primary/20">Leader</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {alreadyDecided ? (
            <div className="space-y-3">
              <div className={cn("rounded-xl border p-4 flex items-center gap-3", sc.cls)}>
                <sc.icon className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  This group request has already been <span className="font-bold">{app.status}</span>.
                </p>
              </div>
              {app.rejectionReason ? (
                <div className="rounded-xl border bg-destructive/5 p-4 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rejection Reason</p>
                  <p className="text-sm text-foreground">{app.rejectionReason}</p>
                </div>
              ) : null}
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
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", decision === "approved" ? "bg-white/20" : "bg-primary/10")}>
                    <CheckCircle className={cn("h-4 w-4", decision === "approved" ? "text-white" : "text-primary")} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Approve Group</p>
                    <p className={cn("text-xs", decision === "approved" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      Officially form this project group
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
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", decision === "rejected" ? "bg-white/20" : "bg-destructive/10")}>
                    <XCircle className={cn("h-4 w-4", decision === "rejected" ? "text-white" : "text-destructive")} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Reject Group</p>
                    <p className={cn("text-xs", decision === "rejected" ? "text-destructive-foreground/70" : "text-muted-foreground")}>
                      Decline formation with feedback
                    </p>
                  </div>
                </button>
              </div>

              {decision === "rejected" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Rejection Reason <span className="text-destructive">*</span></label>
                    <span className="text-xs text-muted-foreground">{reason.length}/500</span>
                  </div>
                  <Textarea
                    value={reason}
                    onChange={e => setReason(e.target.value.slice(0, 500))}
                    rows={4}
                    placeholder="Provide a clear reason for rejection. This will be shared with the members…"
                    className="resize-none text-sm"
                  />
                </div>
              )}

              <div className="pt-2">
                <Button className="w-full h-11 gap-2" disabled={loading || !decision || (decision === "rejected" && !reason.trim())} onClick={handleSubmit}>
                  {loading ? <><div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Processing…</> : <><ChevronRight className="h-4 w-4" /> Submit Decision</>}
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
export default function GroupApprovalPage() {
  const [search, setSearch]     = useState("")
  const [tab, setTab]           = useState("pending")
  const [page, setPage]         = useState(1)
  const [selected, setSelected] = useState<GroupAppItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const pageSize = 10

  const reviewStatus = tabToReviewStatus(tab)
  const reviewQuery = useSubmittedProjectGroupsForReview({
    enabled: true,
    page,
    limit: pageSize,
    status: reviewStatus,
  })
  const approveReviewMutation = useApproveSubmittedProjectGroupReview()
  const rejectReviewMutation = useRejectSubmittedProjectGroupReview()

  useEffect(() => {
    setPage(1)
  }, [tab])

  useEffect(() => {
    const totalPages = reviewQuery.data?.pagination.pages ?? 1
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, reviewQuery.data?.pagination.pages])

  useEffect(() => {
    if (reviewQuery.error) {
      toast.error(reviewQuery.error.message || "Failed to load submitted project groups")
    }
  }, [reviewQuery.error])

  const data = useMemo(() => (reviewQuery.data?.items ?? []).map(mapSubmittedGroupToAppItem), [reviewQuery.data])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return data.filter(g => {
      const matchTab = tab === "all" || g.status === tab
      const matchSearch =
        !search ||
        g.groupName.toLowerCase().includes(q) ||
        g.leaderName.toLowerCase().includes(q) ||
        g.members.some(member => member.name.toLowerCase().includes(q) || member.email.toLowerCase().includes(q))
      return matchTab && matchSearch
    })
  }, [data, tab, search])

  const counts = {
    all: reviewQuery.data?.summary.all ?? 0,
    pending: reviewQuery.data?.summary.pending ?? 0,
    approved: reviewQuery.data?.summary.approved ?? 0,
    rejected: reviewQuery.data?.summary.rejected ?? 0,
  }

  const pagination = reviewQuery.data?.pagination
  const currentPage = pagination?.page ?? page
  const totalPages = pagination?.pages ?? 1
  const totalItems = pagination?.total ?? filtered.length
  const showingFrom = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const showingTo = totalItems === 0 ? 0 : Math.min((currentPage - 1) * pageSize + filtered.length, totalItems)

  const handleDecide = async (id: string, decision: "approved" | "rejected", reason?: string) => {
    if (decision === "approved") {
      await approveReviewMutation.mutateAsync({ groupId: id })
      toast.success("Group approved successfully")
      return
    }

    const trimmedReason = reason?.trim()
    if (!trimmedReason) {
      toast.error("Please provide a rejection reason")
      return
    }

    await rejectReviewMutation.mutateAsync({
      groupId: id,
      dto: { reason: trimmedReason },
    })
    toast.success("Group rejected successfully")
  }

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
              Group Approvals
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review and approve student-formed project groups
            </p>
          </div>
        </div>
        <div className="pl-11 sm:pl-0 flex flex-wrap items-center gap-2">
          {counts.pending > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 border-amber-400/30 text-amber-600 text-xs animate-pulse">
              <Clock className="h-3 w-3 mr-1" /> {counts.pending} pending
            </Badge>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Requests", value: counts.all,      icon: Users,       bg: "bg-primary/10",        color: "text-primary" },
          { label: "Pending Review", value: counts.pending,  icon: Clock,       bg: "bg-amber-500/10",      color: "text-amber-600" },
          { label: "Approved",       value: counts.approved, icon: CheckCircle, bg: "bg-primary/10",        color: "text-primary" },
          { label: "Rejected",       value: counts.rejected, icon: XCircle,     bg: "bg-destructive/10",    color: "text-destructive" },
        ].map(s => (
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
          <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="pending" className="text-xs gap-1.5 shrink-0">
              <Clock className="h-3.5 w-3.5" /> Pending
              {counts.pending > 0 && <Badge className="h-4 px-1.5 text-[10px] bg-amber-500/20 text-amber-600 ml-0.5">{counts.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs gap-1.5 shrink-0"><CheckCircle className="h-3.5 w-3.5" /> Approved</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs gap-1.5 shrink-0"><XCircle className="h-3.5 w-3.5" /> Rejected</TabsTrigger>
            <TabsTrigger value="all" className="text-xs gap-1.5 shrink-0"><Filter className="h-3.5 w-3.5" /> All</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64 sm:mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search group name or domain…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {['pending', 'approved', 'rejected', 'all'].map(t => (
          <TabsContent key={t} value={t} className="mt-4">
            {filtered.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  {filtered.map(app => {
                    const sc = STATUS_CFG[app.status]
                    return (
                      <div key={app.id} className={cn("group rounded-xl border bg-card p-4 flex items-center gap-4 hover:border-primary/30 transition-all", app.status === "pending" ? "border-border/70 shadow-sm" : "border-border/40 opacity-80")}>
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-semibold text-sm">{app.groupName}</span>
                            <Badge variant="outline" className={cn("text-[10px] h-5", sc.cls)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full mr-1", sc.dot)} />{sc.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Leader: {app.leaderName}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{app.members.length} members</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(app.requestedAt)}</span>
                          </div>
                        </div>
                        <Button size="sm" variant={app.status === "pending" ? "default" : "outline"} className="shrink-0 h-8 gap-1.5 text-xs" onClick={() => { setSelected(app); setSheetOpen(true); }}>
                          <Eye className="h-3.5 w-3.5" /> {app.status === "pending" ? "Review" : "View"}
                        </Button>
                      </div>
                    )
                  })}
                </div>

                {totalPages > 1 ? (
                  <div className="flex flex-col gap-3 rounded-xl border bg-muted/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{showingFrom}</span>-<span className="font-medium text-foreground">{showingTo}</span> of <span className="font-medium text-foreground">{totalItems}</span> requests
                    </p>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((value) => Math.max(value - 1, 1))}
                        disabled={currentPage <= 1 || reviewQuery.isFetching}
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Page <span className="font-medium text-foreground">{currentPage}</span> of <span className="font-medium text-foreground">{totalPages}</span>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
                        disabled={currentPage >= totalPages || reviewQuery.isFetching}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-center">
                {reviewQuery.error ? <AlertCircle className="h-10 w-10 text-destructive/40 mb-3" /> : <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />}
                <p className="font-medium text-muted-foreground">{reviewQuery.error ? "Unable to load groups" : "No groups found"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {reviewQuery.error ? "Please retry after checking the backend connection" : "Pending group formations will appear here"}
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <GroupReviewSheet app={selected} open={sheetOpen} onClose={() => setSheetOpen(false)} onDecide={handleDecide} />
    </div>
  )
}
