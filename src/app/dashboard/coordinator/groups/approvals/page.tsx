"use client"

import React, { useState, useMemo, useEffect } from "react"
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
  domain: string
  requestedAt: string
  status: AppStatus
  members: GroupMember[]
  projectIdea: string
  motivation: string
  advisorPreference: string
}

/* ─── Mock Data ─────────────────────────────────────────────────────── */
const MOCK_GROUPS: GroupAppItem[] = [
  {
    id: "ga-1",
    groupName: "DeepMind Innovators",
    domain: "AI / Machine Learning",
    requestedAt: "2024-05-12",
    status: "pending",
    members: [
      { id: "m1", name: "Alex Johnson", email: "alex.j@uni.edu", role: "leader" },
      { id: "m2", name: "Maria Garcia", email: "maria.g@uni.edu", role: "member" },
      { id: "m3", name: "David Kim", email: "david.k@uni.edu", role: "member" },
    ],
    projectIdea: "An AI-powered campus navigation system utilizing computer vision for indoor positioning.",
    motivation: "We want to solve the problem of freshmen getting lost in the science complex.",
    advisorPreference: "Dr. Sarah Williams",
  },
  {
    id: "ga-2",
    groupName: "Cyber Defenders",
    domain: "Cybersecurity",
    requestedAt: "2024-05-13",
    status: "pending",
    members: [
      { id: "m4", name: "Noah Williams", email: "noah.w@uni.edu", role: "leader" },
      { id: "m5", name: "Olivia Martinez", email: "olivia.m@uni.edu", role: "member" },
    ],
    projectIdea: "A decentralized credential verification system using blockchain.",
    motivation: "To prevent degree forgery and simplify the verification process for employers.",
    advisorPreference: "Prof. Robert Chen",
  },
  {
    id: "ga-3",
    groupName: "NextGen Web",
    domain: "Web Development",
    requestedAt: "2024-05-10",
    status: "approved",
    members: [
      { id: "m6", name: "Emma Wilson", email: "emma.w@uni.edu", role: "leader" },
      { id: "m7", name: "James Lee", email: "james.l@uni.edu", role: "member" },
    ],
    projectIdea: "Real-time collaboration platform for study groups using WebRTC.",
    motivation: "Current tools are either too complex or lack academic focus.",
    advisorPreference: "Dr. Michael Brown",
  },
]

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
    await onDecide(app.id, decision, decision === "rejected" ? reason : undefined)
    setLoading(false)
    onClose()
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
            <div className={cn("rounded-xl border p-4 flex items-center gap-3", sc.cls)}>
              <sc.icon className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">
                This group request has already been <span className="font-bold">{app.status}</span>.
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
  const [selected, setSelected] = useState<GroupAppItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  const [data, setData] = useState(MOCK_GROUPS)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return data.filter(g => {
      const matchTab = tab === "all" || g.status === tab
      const matchSearch = !search || g.groupName.toLowerCase().includes(q) || g.domain.toLowerCase().includes(q)
      return matchTab && matchSearch
    })
  }, [data, tab, search])

  const counts = {
    all: data.length,
    pending: data.filter(g => g.status === "pending").length,
    approved: data.filter(g => g.status === "approved").length,
    rejected: data.filter(g => g.status === "rejected").length,
  }

  const handleDecide = async (id: string, decision: "approved" | "rejected", reason?: string) => {
    await new Promise(r => setTimeout(r, 800))
    setData(prev => prev.map(g => g.id === id ? { ...g, status: decision } : g))
    toast.success(`Group ${decision === "approved" ? "Approved" : "Rejected"} successfully`)
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
                          <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />{app.domain}</span>
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
            ) : (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-center">
                <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="font-medium text-muted-foreground">No groups found</p>
                <p className="text-xs text-muted-foreground mt-1">Pending group formations will appear here</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <GroupReviewSheet app={selected} open={sheetOpen} onClose={() => setSheetOpen(false)} onDecide={handleDecide} />
    </div>
  )
}
