"use client"

import React, { useMemo, useState } from "react"
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
  Calendar,
  Eye,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  UserCheck,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  useSubmittedProjectGroupsForReview,
  useApproveSubmittedProjectGroupReview,
  useRejectSubmittedProjectGroupReview,
  useProjectGroupDetails,
} from "@/lib/hooks/use-project-groups"
import type {
  ProjectGroupReviewItem,
  ProjectGroupReviewStatus,
  ProjectGroupDetailsMember,
} from "@/types/project-groups"

type AppStatus = "pending" | "approved" | "rejected"
type ApprovalTab = "pending" | "approved" | "rejected" | "all"

const TAB_TO_STATUS: Record<ApprovalTab, ProjectGroupReviewStatus> = {
  all: "ALL",
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
}

const STATUS_CFG: Record<AppStatus, { label: string; cls: string; dot: string; icon: React.ElementType }> = {
  pending: {
    label: "Pending",
    cls: "bg-amber-500/10 text-amber-600 border-amber-400/30",
    dot: "bg-amber-500",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    cls: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
    icon: XCircle,
  },
}

function toAppStatus(status: string | null | undefined): AppStatus {
  const normalized = (status ?? "").toUpperCase()
  if (normalized === "APPROVED") return "approved"
  if (normalized === "REJECTED") return "rejected"
  return "pending"
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "-"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function fullName(firstName: string | null | undefined, lastName: string | null | undefined, fallback = "Unknown") {
  const value = [firstName, lastName].filter(Boolean).join(" ").trim()
  return value || fallback
}

function memberFromDetail(member: ProjectGroupDetailsMember) {
  return {
    id: member.id,
    name: fullName(member.firstName, member.lastName, "Unknown member"),
    email: member.email,
    avatarUrl: member.avatarUrl,
    joinedAt: member.joinedAt,
  }
}

function memberFromReview(item: ProjectGroupReviewItem) {
  return item.members.map((member) => ({
    id: member.id,
    name: member.user.fullName || fullName(member.user.firstName, member.user.lastName, "Unknown member"),
    email: member.user.email,
    avatarUrl: member.user.avatarUrl,
    joinedAt: member.joinedAt,
  }))
}

function MemberRow({
  name,
  email,
  avatarUrl,
  joinedAt,
  leader = false,
}: {
  name: string
  email: string
  avatarUrl?: string | null
  joinedAt?: string
  leader?: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-2 bg-card rounded-lg border">
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl ?? undefined} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold flex items-center gap-2">
          <span className="truncate">{name}</span>
          {leader ? (
            <Badge
              variant="outline"
              className="text-[9px] h-4 px-1 bg-primary/5 text-primary border-primary/20"
            >
              Leader
            </Badge>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground truncate">{email}</p>
      </div>
      {joinedAt ? <p className="text-[11px] text-muted-foreground shrink-0">{fmtDate(joinedAt)}</p> : null}
    </div>
  )
}

function GroupReviewSheet({
  app,
  open,
  onClose,
  onDecide,
  deciding,
}: {
  app: ProjectGroupReviewItem | null
  open: boolean
  onClose: () => void
  onDecide: (id: string, decision: "approved" | "rejected", reason?: string) => Promise<void>
  deciding: boolean
}) {
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null)
  const [reason, setReason] = useState("")

  const {
    data: details,
    isLoading: detailLoading,
  } = useProjectGroupDetails({
    enabled: open && Boolean(app?.id),
    groupId: app?.id ?? null,
  })

  React.useEffect(() => {
    if (open) {
      setDecision(null)
      setReason("")
    }
  }, [open, app?.id])

  if (!app) return null

  const status = toAppStatus(app.reviewStatus ?? app.status)
  const sc = STATUS_CFG[status]
  const alreadyDecided = status !== "pending"

  const leaderName = details
    ? fullName(details.leader.firstName, details.leader.lastName, app.leader.fullName)
    : app.leader.fullName || fullName(app.leader.firstName, app.leader.lastName, "Unknown leader")
  const leaderEmail = details?.leader.email ?? app.leader.email
  const leaderAvatarUrl = details?.leader.avatarUrl ?? app.leader.avatarUrl

  const members = details ? details.members.map(memberFromDetail) : memberFromReview(app)
  const memberCount = details?.memberCount ?? app.memberCount
  const maxGroupSize = details?.maxGroupSize ?? app.maxGroupSize
  const capacityPct = maxGroupSize > 0 ? Math.min(100, Math.round((memberCount / maxGroupSize) * 100)) : 0

  const technologies = details?.technologies ?? []
  const objectives = details?.objectives ?? null

  const handleSubmit = async () => {
    if (!decision) {
      toast.error("Select a decision first")
      return
    }

    if (decision === "rejected" && !reason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }

    await onDecide(app.id, decision, decision === "rejected" ? reason : undefined)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-primary bg-primary/10">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-base">{app.name}</SheetTitle>
                <Badge variant="outline" className={cn("text-xs", sc.cls)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full mr-1", sc.dot)} />
                  {sc.label}
                </Badge>
              </div>
              <SheetDescription className="text-xs">
                Group Review � Submitted {fmtDate(app.submittedAt)}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5">
          {detailLoading && !details ? (
            <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Loading project group detail...
            </div>
          ) : null}

          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Group Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Status</p>
                <p className="text-sm font-medium">{app.reviewStatus || app.status}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Submitted At</p>
                <p className="text-sm font-medium">{fmtDate(app.submittedAt)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Reviewed At</p>
                <p className="text-sm font-medium">{fmtDate(app.reviewedAt)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Group Size</p>
                <p className="text-sm font-medium">
                  {memberCount} / {maxGroupSize}
                  {app.minGroupSize ? ` (min ${app.minGroupSize})` : ""}
                </p>
              </div>
            </div>

            {maxGroupSize > 0 ? (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Capacity usage</span>
                  <span className="font-medium">{capacityPct}%</span>
                </div>
                <Progress value={capacityPct} className="h-2" />
              </div>
            ) : null}

            {app.rejectionReason ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
                <p className="text-[10px] text-destructive uppercase tracking-wide mb-1">Rejection reason</p>
                <p className="text-xs text-destructive/90 whitespace-pre-wrap">{app.rejectionReason}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border bg-muted/10 p-4 space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Objectives</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {objectives?.trim() ? objectives : "No objective available from detail endpoint."}
            </p>
          </div>

          <div className="rounded-xl border bg-muted/10 p-4 space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Technologies</p>
            {technologies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {technologies.map((technology) => (
                  <Badge key={technology} variant="outline" className="text-xs">
                    {technology}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No technologies listed.</p>
            )}
          </div>

          <div className="rounded-xl border bg-muted/10 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Group Leader</p>
            <MemberRow name={leaderName} email={leaderEmail} avatarUrl={leaderAvatarUrl} leader />
          </div>

          <div className="rounded-xl border bg-muted/10 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Members ({members.length})</p>
            <div className="space-y-2">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  name={member.name}
                  email={member.email}
                  avatarUrl={member.avatarUrl}
                  joinedAt={member.joinedAt}
                />
              ))}
            </div>
          </div>

          {alreadyDecided ? (
            <div className={cn("rounded-xl border p-4 flex items-center gap-3", sc.cls)}>
              <sc.icon className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">
                This group request has already been <span className="font-bold">{app.reviewStatus || app.status}</span>.
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
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                      decision === "approved" ? "bg-white/20" : "bg-primary/10"
                    )}
                  >
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
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                      decision === "rejected" ? "bg-white/20" : "bg-destructive/10"
                    )}
                  >
                    <XCircle className={cn("h-4 w-4", decision === "rejected" ? "text-white" : "text-destructive")} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Reject Group</p>
                    <p
                      className={cn(
                        "text-xs",
                        decision === "rejected" ? "text-destructive-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      Decline formation with feedback
                    </p>
                  </div>
                </button>
              </div>

              {decision === "rejected" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Rejection Reason <span className="text-destructive">*</span>
                    </label>
                    <span className="text-xs text-muted-foreground">{reason.length}/500</span>
                  </div>
                  <Textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value.slice(0, 500))}
                    rows={4}
                    placeholder="Provide a clear reason for rejection. This will be shared with the members..."
                    className="resize-none text-sm"
                  />
                </div>
              ) : null}

              <div className="pt-2">
                <Button
                  className="w-full h-11 gap-2"
                  disabled={deciding || !decision || (decision === "rejected" && !reason.trim())}
                  onClick={handleSubmit}
                >
                  {deciding ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4" /> Submit Decision
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function GroupApprovalPage() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<ApprovalTab>("pending")
  const [selected, setSelected] = useState<ProjectGroupReviewItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [page, setPage] = useState(1)

  const limit = 20
  const apiStatus = TAB_TO_STATUS[tab]
  const searchParam = search.trim() || undefined

  const {
    data: apiData,
    isLoading: apiLoading,
    isError: apiError,
    error: apiErrorObj,
    refetch,
    isFetching,
  } = useSubmittedProjectGroupsForReview({
    enabled: true,
    status: apiStatus,
    page,
    limit,
    search: searchParam,
  })

  const approveMutation = useApproveSubmittedProjectGroupReview()
  const rejectMutation = useRejectSubmittedProjectGroupReview()

  const deciding = approveMutation.isPending || rejectMutation.isPending

  const items = apiData?.items ?? []
  const counts = useMemo(() => {
    if (apiData?.summary) return apiData.summary

    const pending = items.filter((item) => toAppStatus(item.reviewStatus ?? item.status) === "pending").length
    const approved = items.filter((item) => toAppStatus(item.reviewStatus ?? item.status) === "approved").length
    const rejected = items.filter((item) => toAppStatus(item.reviewStatus ?? item.status) === "rejected").length

    return {
      pending,
      approved,
      rejected,
      all: items.length,
    }
  }, [apiData?.summary, items])

  const handleDecide = async (id: string, decision: "approved" | "rejected", reason?: string) => {
    try {
      if (decision === "approved") {
        await approveMutation.mutateAsync({ groupId: id })
        toast.success("Group approved", { description: "The group has been approved successfully." })
      } else {
        await rejectMutation.mutateAsync({
          groupId: id,
          dto: { reason: reason?.trim() || "Rejected by coordinator" },
        })
        toast.success("Group rejected", { description: "The group has been rejected successfully." })
      }

      await refetch()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again."
      toast.error("Action failed", { description: message })
    }
  }

  const openReview = (group: ProjectGroupReviewItem) => {
    setSelected(group)
    setSheetOpen(true)
  }

  const pagination = apiData?.pagination

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
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
          {counts.pending > 0 ? (
            <Badge variant="outline" className="bg-amber-500/10 border-amber-400/30 text-amber-600 text-xs animate-pulse">
              <Clock className="h-3 w-3 mr-1" /> {counts.pending} pending
            </Badge>
          ) : null}
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Requests", value: counts.all, icon: Users, bg: "bg-primary/10", color: "text-primary" },
          { label: "Pending Review", value: counts.pending, icon: Clock, bg: "bg-amber-500/10", color: "text-amber-600" },
          { label: "Approved", value: counts.approved, icon: CheckCircle, bg: "bg-primary/10", color: "text-primary" },
          { label: "Rejected", value: counts.rejected, icon: XCircle, bg: "bg-destructive/10", color: "text-destructive" },
        ].map((stat) => (
          <Card key={stat.label} className="group border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {counts.all > 0 ? (
        <div className="rounded-xl border bg-muted/20 px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Review progress</span>
            <span className="font-medium">
              {counts.approved + counts.rejected} / {counts.all} processed
            </span>
          </div>
          <Progress value={((counts.approved + counts.rejected) / counts.all) * 100} className="h-2" />
        </div>
      ) : null}

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as ApprovalTab)
          setPage(1)
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
          <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="pending" className="text-xs gap-1.5 shrink-0">
              <Clock className="h-3.5 w-3.5" /> Pending
              {counts.pending > 0 ? (
                <Badge className="h-4 px-1.5 text-[10px] bg-amber-500/20 text-amber-600 ml-0.5">{counts.pending}</Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs gap-1.5 shrink-0">
              <CheckCircle className="h-3.5 w-3.5" /> Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs gap-1.5 shrink-0">
              <XCircle className="h-3.5 w-3.5" /> Rejected
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs gap-1.5 shrink-0">
              <Filter className="h-3.5 w-3.5" /> All
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64 sm:mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search group name..."
              value={search}
              onChange={(event) => {
                const nextValue = event.target.value
                const prevNormalized = search.trim() || undefined
                const nextNormalized = nextValue.trim() || undefined
                setSearch(nextValue)
                if (prevNormalized !== nextNormalized) setPage(1)
              }}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {["pending", "approved", "rejected", "all"].map((panel) => (
          <TabsContent key={panel} value={panel} className="mt-4">
            {apiLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Loading live group approvals...
              </div>
            ) : null}

            {apiError ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 mb-3">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>{apiErrorObj?.message || "Unable to load group approvals right now. Please refresh and try again."}</span>
              </div>
            ) : null}

            {!apiLoading && items.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{items.length}</span> group{items.length !== 1 ? "s" : ""}
                </p>

                {items.map((group) => {
                  const status = toAppStatus(group.reviewStatus ?? group.status)
                  const sc = STATUS_CFG[status]
                  return (
                    <div
                      key={group.id}
                      className={cn(
                        "group rounded-xl border bg-card p-4 flex items-center gap-4 hover:border-primary/30 transition-all",
                        status === "pending" ? "border-border/70 shadow-sm" : "border-border/40 opacity-80"
                      )}
                    >
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-semibold text-sm">{group.name}</span>
                          <Badge variant="outline" className={cn("text-[10px] h-5", sc.cls)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full mr-1", sc.dot)} />
                            {sc.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            {group.leader.fullName || fullName(group.leader.firstName, group.leader.lastName, "Unknown leader")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {group.memberCount} / {group.maxGroupSize} members
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {fmtDate(group.submittedAt || group.createdAt)}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={status === "pending" ? "default" : "outline"}
                        className="shrink-0 h-8 gap-1.5 text-xs"
                        onClick={() => openReview(group)}
                      >
                        <Eye className="h-3.5 w-3.5" /> {status === "pending" ? "Review" : "View"}
                      </Button>
                    </div>
                  )
                })}

                {pagination && pagination.pages > 1 ? (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-muted-foreground">
                      Page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page <= 1 || isFetching}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={page >= pagination.pages || isFetching}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!apiLoading && !apiError && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-center">
                <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="font-medium text-muted-foreground">
                  {search
                    ? "No matching groups"
                    : `No ${panel === "all" ? "" : panel} groups`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search
                    ? "Try adjusting your search"
                    : "Submitted group requests will appear here"}
                </p>
              </div>
            ) : null}
          </TabsContent>
        ))}
      </Tabs>

      <GroupReviewSheet
        app={selected}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onDecide={handleDecide}
        deciding={deciding}
      />
    </div>
  )
}

