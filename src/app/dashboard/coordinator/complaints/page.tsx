"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  AlertTriangle,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowLeft,
  Filter,
  MessageSquare,
  GraduationCap,
  ClipboardCheck,
  Calendar,
  BookOpen,
  RefreshCw,
  Hash,
  TrendingUp,
  ChevronRight,
  X,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { mockComplaints, type Complaint, formatDate } from '@/data/mockData'

/* ─── helpers ─────────────────────────────────────────────────────────── */
const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

type ComplaintStatus = Complaint['status']

const TYPE_ICON: Record<Complaint['targetType'], React.ElementType> = {
  grade:      GraduationCap,
  evaluation: ClipboardCheck,
  assignment: BookOpen,
  defense:    Calendar,
}

const STATUS_CONFIG: Record<ComplaintStatus, {
  label: string
  icon: React.ElementType
  bg: string
  text: string
  border: string
  stripe: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
}> = {
  open:         { label: 'Open',         icon: AlertTriangle, bg: 'bg-destructive/10',  text: 'text-destructive',      border: 'border-destructive/30', stripe: 'bg-destructive',  variant: 'destructive' },
  under_review: { label: 'Under Review', icon: Eye,           bg: 'bg-primary/10',      text: 'text-primary',          border: 'border-primary/30',    stripe: 'bg-primary',      variant: 'secondary'   },
  resolved:     { label: 'Resolved',     icon: CheckCircle2,  bg: 'bg-muted',           text: 'text-foreground',       border: 'border-border',        stripe: 'bg-primary/40',   variant: 'outline'     },
  rejected:     { label: 'Rejected',     icon: XCircle,       bg: 'bg-muted',           text: 'text-muted-foreground', border: 'border-border',        stripe: 'bg-muted-foreground/30', variant: 'outline' },
}

const TYPE_CONFIG: Record<Complaint['targetType'], { label: string; bg: string; text: string }> = {
  grade:      { label: 'Grade Dispute',      bg: 'bg-primary/10',     text: 'text-primary'         },
  evaluation: { label: 'Evaluation Dispute', bg: 'bg-primary/[0.06]', text: 'text-primary/80'      },
  assignment: { label: 'Assignment Dispute', bg: 'bg-muted',          text: 'text-foreground'      },
  defense:    { label: 'Defense Dispute',    bg: 'bg-muted',          text: 'text-muted-foreground'},
}

/* ─── Timeline ─────────────────────────────────────────────────────────── */
function buildTimeline(complaint: Complaint, currentStatus: ComplaintStatus) {
  const events: { id: string; icon: React.ElementType; title: string; desc: string; time: string; active: boolean }[] = [
    { id: 'submitted', icon: MessageSquare, title: 'Complaint Submitted', desc: `${complaint.studentName} filed a ${complaint.targetType} dispute.`, time: complaint.submittedAt, active: true },
  ]
  if (currentStatus !== 'open') {
    events.push({ id: 'review', icon: Eye, title: 'Moved to Review', desc: 'Coordinator opened for review.', time: complaint.updatedAt, active: true })
  }
  if (currentStatus === 'resolved') {
    events.push({ id: 'resolved', icon: CheckCircle2, title: 'Resolved', desc: 'Complaint resolved by coordinator.', time: complaint.updatedAt, active: true })
  }
  if (currentStatus === 'rejected') {
    events.push({ id: 'rejected', icon: XCircle, title: 'Rejected', desc: 'Complaint rejected by coordinator.', time: complaint.updatedAt, active: true })
  }
  if (currentStatus === 'open' || currentStatus === 'under_review') {
    events.push({ id: 'pending', icon: Clock, title: 'Awaiting Decision', desc: 'Pending coordinator resolution.', time: '', active: false })
  }
  return events
}

/* ─── Review Sheet ─────────────────────────────────────────────────────── */
function ReviewSheet({
  complaint,
  open,
  onClose,
  onStatusChange,
}: {
  complaint: Complaint | null
  open: boolean
  onClose: () => void
  onStatusChange: (id: string, status: ComplaintStatus) => void
}) {
  const [notes, setNotes] = useState('')
  const [localStatus, setLocalStatus] = useState<ComplaintStatus>(complaint?.status ?? 'open')
  const [submitting, setSubmitting] = useState(false)

  React.useEffect(() => {
    if (complaint) setLocalStatus(complaint.status)
    setNotes('')
  }, [complaint?.id])

  if (!complaint) return null

  const sc = STATUS_CONFIG[localStatus]
  const tc = TYPE_CONFIG[complaint.targetType]
  const TypeIcon = TYPE_ICON[complaint.targetType]
  const StatusIcon = sc.icon
  const isActionable = localStatus === 'open' || localStatus === 'under_review'
  const timeline = buildTimeline(complaint, localStatus)

  const handleAction = async (action: 'resolve' | 'reject' | 'review') => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 700))
    setSubmitting(false)

    const next: ComplaintStatus = action === 'resolve' ? 'resolved' : action === 'reject' ? 'rejected' : 'under_review'
    setLocalStatus(next)
    onStatusChange(complaint.id, next)

    if (action === 'resolve') toast.success('Resolved', { description: `"${complaint.targetName}" complaint resolved.` })
    else if (action === 'reject') toast.error('Rejected', { description: 'Complaint rejected.' })
    else toast.success('Under Review', { description: 'Complaint moved to review.' })
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0 gap-0">

        {/* Coloured status stripe */}
        <div className={`h-1 w-full ${sc.stripe}`} />

        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-base">Complaint Review</SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 mt-1">
                <Hash className="h-3 w-3" />
                <span className="font-mono text-xs">{complaint.id}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs">{timeAgo(complaint.submittedAt)}</span>
              </SheetDescription>
            </div>
            <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${sc.bg} ${sc.text} ${sc.border}`}>
              <StatusIcon className="h-3 w-3" />
              {sc.label}
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6">

          {/* Student & target tiles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-muted/30 p-3.5 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Student</p>
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {complaint.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{complaint.studentName}</p>
                  <p className="text-[11px] text-muted-foreground">ID: {complaint.studentId}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-3.5 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Target</p>
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-lg ${tc.bg} flex items-center justify-center shrink-0`}>
                  <TypeIcon className={`h-3.5 w-3.5 ${tc.text}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{complaint.targetName}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0 text-[10px] font-medium ${tc.bg} ${tc.text}`}>
                    {tc.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Submitted</p>
              <p className="text-sm font-semibold">{fmt(complaint.submittedAt)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(complaint.submittedAt)}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Last Updated</p>
              <p className="text-sm font-semibold">{fmt(complaint.updatedAt)}</p>
            </div>
          </div>

          <Separator />

          {/* Complaint text */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Complaint Details</p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{complaint.reason}</p>
            </div>
          </div>

          <Separator />

          {/* Activity timeline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Activity Timeline</p>
            </div>
            <div className="pl-1 space-y-0">
              {timeline.map((event, i) => {
                const EventIcon = event.icon
                const isLast = i === timeline.length - 1
                return (
                  <div key={event.id} className="relative flex gap-3.5 pb-5">
                    {!isLast && (
                      <div className={`absolute left-[13px] top-8 w-0.5 h-full ${event.active ? 'bg-primary/25' : 'bg-border'}`} />
                    )}
                    <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 shrink-0 ${
                      event.active ? 'bg-primary/10 border-primary/40' : 'bg-muted border-border'
                    }`}>
                      <EventIcon className={`h-3 w-3 ${event.active ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-sm font-semibold ${event.active ? 'text-foreground' : 'text-muted-foreground'}`}>{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{event.desc}</p>
                      {event.time && (
                        <p className="text-[11px] text-muted-foreground/50 mt-1">{formatDate(event.time)}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Resolution */}
          {isActionable ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Decision & Resolution</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sheet-notes" className="text-xs text-muted-foreground font-medium">
                  Resolution Notes <span className="text-muted-foreground/50 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="sheet-notes"
                  placeholder="Document your findings and actions taken…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="resize-none text-sm min-h-[90px] bg-muted/20"
                />
              </div>

              <div className="space-y-2">
                {localStatus === 'open' && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
                    disabled={submitting}
                    onClick={() => handleAction('review')}
                  >
                    <RefreshCw className="h-4 w-4" /> Mark as Under Review
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="gap-2"
                    disabled={submitting}
                    onClick={() => handleAction('resolve')}
                  >
                    {submitting
                      ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      : <CheckCircle2 className="h-4 w-4" />
                    }
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    disabled={submitting}
                    onClick={() => handleAction('reject')}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex items-center gap-4 rounded-xl border p-4 ${sc.bg} ${sc.border}`}>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${sc.bg}`}>
                <StatusIcon className={`h-5 w-5 ${sc.text}`} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${sc.text}`}>
                  Complaint {localStatus === 'resolved' ? 'Resolved' : 'Rejected'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">No further action required.</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ─── Complaint Card ───────────────────────────────────────────────────── */
function ComplaintCard({
  complaint,
  onReview,
}: {
  complaint: Complaint & { currentStatus: ComplaintStatus }
  onReview: (c: Complaint) => void
}) {
  const TypeIcon = TYPE_ICON[complaint.targetType]
  const sc = STATUS_CONFIG[complaint.currentStatus]
  const tc = TYPE_CONFIG[complaint.targetType]
  const isUrgent = complaint.currentStatus === 'open'

  return (
    <div className={`group relative rounded-xl border bg-card overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${isUrgent ? 'border-destructive/25' : 'border-border/60 hover:border-primary/25'}`}>
      {/* Status stripe along left edge */}
      <div className={`absolute left-0 top-0 h-full w-1 ${sc.stripe}`} />

      <div className="pl-5 pr-4 py-4 space-y-3.5">

        {/* Top row: avatar + name + time + status badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className={`text-sm font-bold ${isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                {complaint.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate leading-tight">{complaint.studentName}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-2.5 w-2.5" /> {timeAgo(complaint.submittedAt)}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shrink-0 ${sc.bg} ${sc.text} ${sc.border}`}>
            <sc.icon className="h-2.5 w-2.5" />
            {sc.label}
          </div>
        </div>

        {/* Type tag + target */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${tc.bg} ${tc.text}`}>
            <TypeIcon className="h-3 w-3" />
            {tc.label}
          </div>
          <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
          <p className="text-xs font-semibold text-foreground truncate">{complaint.targetName}</p>
        </div>

        {/* Reason excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed border-l-2 border-border pl-3 italic">
          {complaint.reason}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-0.5">
          <p className="text-[11px] text-muted-foreground">{fmt(complaint.submittedAt)}</p>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => onReview(complaint)}
          >
            <Eye className="h-3.5 w-3.5" /> Review
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─── FilterBar ─────────────────────────────────────────────────────────── */
function FilterBar({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
}: {
  search: string
  setSearch: (v: string) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search student, issue, or target…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10 bg-muted/30"
        />
      </div>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="h-10 w-48 shrink-0 bg-muted/30">
          <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="grade">Grade Dispute</SelectItem>
          <SelectItem value="evaluation">Evaluation Dispute</SelectItem>
          <SelectItem value="assignment">Assignment Dispute</SelectItem>
          <SelectItem value="defense">Defense Dispute</SelectItem>
        </SelectContent>
      </Select>
      {(search || typeFilter !== 'all') && (
        <Button
          variant="ghost"
          size="sm"
          className="h-10 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => { setSearch(''); setTypeFilter('all') }}
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </Button>
      )}
    </div>
  )
}

/* ─── Grid ─────────────────────────────────────────────────────────────── */
type EnrichedComplaint = Complaint & { currentStatus: ComplaintStatus }

function Grid({
  list,
  search,
  typeFilter,
  onReview,
}: {
  list: EnrichedComplaint[]
  search: string
  typeFilter: string
  onReview: (c: Complaint) => void
}) {
  const filtered = list.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      c.studentName.toLowerCase().includes(q) ||
      c.reason.toLowerCase().includes(q) ||
      c.targetName.toLowerCase().includes(q)
    const matchType = typeFilter === 'all' || c.targetType === typeFilter
    return matchSearch && matchType
  })
  if (filtered.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed bg-muted/10">
        <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <p className="font-semibold text-muted-foreground">No complaints found</p>
        <p className="text-xs text-muted-foreground/70 mt-1.5">Try adjusting your search or filter</p>
      </div>
    )
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map(c => <ComplaintCard key={c.id} complaint={c} onReview={onReview} />)}
    </div>
  )
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
export default function ComplaintsPage() {
  const [statuses, setStatuses] = useState<Record<string, ComplaintStatus>>(
    () => Object.fromEntries(mockComplaints.map(c => [c.id, c.status]))
  )
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const enriched = useMemo(
    () => mockComplaints.map(c => ({ ...c, currentStatus: statuses[c.id] ?? c.status })),
    [statuses]
  )

  const openC       = enriched.filter(c => c.currentStatus === 'open')
  const underReview = enriched.filter(c => c.currentStatus === 'under_review')
  const resolved    = enriched.filter(c => c.currentStatus === 'resolved' || c.currentStatus === 'rejected')

  const resolutionRate = enriched.length > 0
    ? Math.round(enriched.filter(c => c.currentStatus === 'resolved').length / enriched.length * 100)
    : 0

  const handleReview = (c: Complaint) => { setSelected(c); setSheetOpen(true) }
  const handleStatusChange = (id: string, status: ComplaintStatus) =>
    setStatuses(prev => ({ ...prev, [id]: status }))

  const kpi = [
    { label: 'Total',        value: enriched.length,    icon: MessageSquare, bg: 'bg-muted/60',       color: 'text-foreground',  ring: 'ring-border'            },
    { label: 'Open',         value: openC.length,        icon: AlertTriangle, bg: 'bg-destructive/10', color: 'text-destructive',  ring: 'ring-destructive/20'    },
    { label: 'Under Review', value: underReview.length,  icon: Eye,           bg: 'bg-primary/10',     color: 'text-primary',      ring: 'ring-primary/20'        },
    { label: 'Resolved',     value: resolved.length,     icon: CheckCircle2,  bg: 'bg-primary/[0.06]', color: 'text-primary/70',   ring: 'ring-primary/10'        },
  ]

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator/grade-management">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Complaint Management
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review and resolve student grade disputes and evaluation complaints
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-12 sm:pl-0">
          {openC.length > 0 && (
            <Badge variant="destructive" className="gap-1.5 shrink-0 pl-2 pr-3 py-1.5 text-xs font-semibold animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5" />
              {openC.length} require{openC.length === 1 ? 's' : ''} action
            </Badge>
          )}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map(s => (
          <Card key={s.label} className="group border border-border/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`h-12 w-12 rounded-2xl ring-1 ${s.bg} ${s.ring} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Resolution progress banner ── */}
      <div className="rounded-xl border bg-primary/5 border-primary/10 px-5 py-3.5 flex items-center gap-4">
        <BarChart3 className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-semibold">Resolution Progress</p>
            <span className="text-sm font-bold text-primary">{resolutionRate}%</span>
          </div>
          <Progress value={resolutionRate} className="h-1.5" />
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          {resolved.length} of {enriched.length} resolved
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-10 bg-muted/40 p-1">
            <TabsTrigger value="all" className="gap-1.5 text-xs sm:text-sm rounded-md">
              All
              <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-0.5">{enriched.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="open" className="gap-1.5 text-xs sm:text-sm rounded-md">
              Open
              {openC.length > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0 ml-0.5">{openC.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-1.5 text-xs sm:text-sm rounded-md">
              Review
              {underReview.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-0.5">{underReview.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved" className="gap-1.5 text-xs sm:text-sm rounded-md">
              Resolved
            </TabsTrigger>
          </TabsList>
        </div>

        <FilterBar search={search} setSearch={setSearch} typeFilter={typeFilter} setTypeFilter={setTypeFilter} />

        <TabsContent value="all"      className="mt-0"><Grid list={enriched} search={search} typeFilter={typeFilter} onReview={handleReview} /></TabsContent>
        <TabsContent value="open"     className="mt-0"><Grid list={openC} search={search} typeFilter={typeFilter} onReview={handleReview} /></TabsContent>
        <TabsContent value="review"   className="mt-0"><Grid list={underReview} search={search} typeFilter={typeFilter} onReview={handleReview} /></TabsContent>
        <TabsContent value="resolved" className="mt-0"><Grid list={resolved} search={search} typeFilter={typeFilter} onReview={handleReview} /></TabsContent>
      </Tabs>

      <ReviewSheet
        complaint={selected}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
