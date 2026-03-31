"use client"

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Clock,
  AlertTriangle,
  GraduationCap,
  ClipboardCheck,
  Calendar,
  BookOpen,
  MessageSquare,
  Eye,
  RefreshCw,
  User,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { mockComplaints, type Complaint, formatDate } from '@/data/mockData'

/* ─── helpers ─────────────────────────────────────────────────────────── */
const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

type ComplaintStatus = Complaint['status']

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; icon: React.ElementType; bg: string; text: string; border: string }> = {
  open:         { label: 'Open',         icon: AlertTriangle, bg: 'bg-destructive/10',    text: 'text-destructive',        border: 'border-destructive/30' },
  under_review: { label: 'Under Review', icon: Eye,           bg: 'bg-primary/10',        text: 'text-primary',            border: 'border-primary/30'     },
  resolved:     { label: 'Resolved',     icon: CheckCircle2,  bg: 'bg-muted',             text: 'text-foreground',         border: 'border-border'         },
  rejected:     { label: 'Rejected',     icon: XCircle,       bg: 'bg-muted',             text: 'text-muted-foreground',   border: 'border-border'         },
}

const TYPE_CONFIG: Record<Complaint['targetType'], { label: string; icon: React.ElementType; bg: string; text: string }> = {
  grade:      { label: 'Grade Dispute',       icon: GraduationCap, bg: 'bg-primary/10',       text: 'text-primary'          },
  evaluation: { label: 'Evaluation Dispute',  icon: ClipboardCheck,bg: 'bg-primary/[0.06]',   text: 'text-primary/80'       },
  assignment: { label: 'Assignment Dispute',  icon: BookOpen,      bg: 'bg-muted',            text: 'text-foreground'       },
  defense:    { label: 'Defense Dispute',     icon: Calendar,      bg: 'bg-muted',            text: 'text-muted-foreground' },
}

/* ─── Mock timeline events ─────────────────────────────────────────────── */
function buildTimeline(complaint: Complaint) {
  const events = [
    {
      id: 'submitted',
      icon: MessageSquare,
      title: 'Complaint Submitted',
      description: `${complaint.studentName} submitted a ${complaint.targetType} dispute.`,
      time: complaint.submittedAt,
      active: true,
    },
  ]

  if (complaint.status !== 'open') {
    events.push({
      id: 'review',
      icon: Eye,
      title: 'Moved to Review',
      description: 'Coordinator opened the complaint for review.',
      time: complaint.updatedAt,
      active: true,
    })
  }
  if (complaint.status === 'resolved') {
    events.push({
      id: 'resolved',
      icon: CheckCircle2,
      title: 'Resolved',
      description: 'Complaint resolved by coordinator.',
      time: complaint.updatedAt,
      active: true,
    })
  }
  if (complaint.status === 'rejected') {
    events.push({
      id: 'rejected',
      icon: XCircle,
      title: 'Rejected',
      description: 'Complaint was rejected by coordinator.',
      time: complaint.updatedAt,
      active: true,
    })
  }
  if (complaint.status === 'open' || complaint.status === 'under_review') {
    events.push({
      id: 'pending',
      icon: Clock,
      title: 'Awaiting Decision',
      description: 'Pending coordinator review and resolution.',
      time: '',
      active: false,
    })
  }
  return events
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function ComplaintDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const complaint = mockComplaints.find(c => c.id === id)

  const [status, setStatus] = useState<ComplaintStatus>(complaint?.status ?? 'open')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!complaint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive/50" />
        <div>
          <p className="text-lg font-semibold">Complaint Not Found</p>
          <p className="text-sm text-muted-foreground mt-1">The complaint ID &quot;{id}&quot; does not exist.</p>
        </div>
        <Link href="/dashboard/coordinator/complaints">
          <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Complaints</Button>
        </Link>
      </div>
    )
  }

  const sc = STATUS_CONFIG[status]
  const tc = TYPE_CONFIG[complaint.targetType]
  const TypeIcon = tc.icon
  const StatusIcon = sc.icon
  const timeline = buildTimeline({ ...complaint, status })
  const isActionable = status === 'open' || status === 'under_review'

  const handleAction = async (action: 'resolve' | 'reject' | 'review') => {
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 800))
    setIsSubmitting(false)

    if (action === 'resolve') {
      setStatus('resolved')
      toast.success('Complaint Resolved', { description: 'The complaint has been marked as resolved.' })
      setTimeout(() => router.push('/dashboard/coordinator/complaints'), 1200)
    } else if (action === 'reject') {
      setStatus('rejected')
      toast.error('Complaint Rejected', { description: 'The complaint has been rejected.' })
      setTimeout(() => router.push('/dashboard/coordinator/complaints'), 1200)
    } else {
      setStatus('under_review')
      toast.success('Moved to Review', { description: 'Complaint is now under review.' })
    }
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard/coordinator/complaints">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg mt-1 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Complaint Detail</h1>
            <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text} ${sc.border}`}>
              <StatusIcon className="h-3 w-3" />
              {sc.label}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            ID: <span className="font-mono font-medium">{complaint.id}</span>
            <span className="mx-2 text-muted-foreground/40">·</span>
            Submitted {timeAgo(complaint.submittedAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* ── Main column ── */}
        <div className="space-y-5">

          {/* Student + target info */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Complainant & Target
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Student */}
                <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {complaint.studentName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-0.5">Student</p>
                    <p className="font-semibold truncate">{complaint.studentName}</p>
                    <p className="text-xs text-muted-foreground">ID: {complaint.studentId}</p>
                  </div>
                </div>

                {/* Target */}
                <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                  <div className={`h-10 w-10 rounded-xl ${tc.bg} flex items-center justify-center shrink-0`}>
                    <TypeIcon className={`h-5 w-5 ${tc.text}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-0.5">Target</p>
                    <p className="font-semibold truncate">{complaint.targetName}</p>
                    <Badge variant="outline" className="text-xs capitalize mt-0.5">{complaint.targetType}</Badge>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/40 p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Submitted</p>
                  <p className="font-medium">{formatDate(complaint.submittedAt)}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(complaint.submittedAt)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Updated</p>
                  <p className="font-medium">{formatDate(complaint.updatedAt)}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(complaint.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complaint text */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Complaint Details
              </CardTitle>
              <CardDescription>Full statement submitted by the student</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-muted/40 border p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{complaint.reason}</p>
              </div>
            </CardContent>
          </Card>

          {/* Resolution form */}
          {isActionable && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" /> Decision & Resolution
                </CardTitle>
                <CardDescription>Document your findings and take action</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Resolution Notes <span className="normal-case text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Document your decision, actions taken, and any follow-up required…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="resize-none min-h-[120px] text-sm"
                  />
                  <p className="text-xs text-muted-foreground text-right">{notes.length} characters</p>
                </div>

                <Separator />

                <div className="grid gap-2 sm:grid-cols-3">
                  {status === 'open' && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      disabled={isSubmitting}
                      onClick={() => handleAction('review')}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Start Review
                    </Button>
                  )}
                  <Button
                    className="gap-2 col-span-1"
                    disabled={isSubmitting}
                    onClick={() => handleAction('resolve')}
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Approve & Resolve
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-2 col-span-1"
                    disabled={isSubmitting}
                    onClick={() => handleAction('reject')}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Finalised banner */}
          {!isActionable && (
            <div className={`flex items-center gap-3 rounded-xl border p-4 ${sc.bg} ${sc.border}`}>
              <StatusIcon className={`h-6 w-6 ${sc.text} shrink-0`} />
              <div>
                <p className={`font-semibold ${sc.text}`}>
                  Complaint {status === 'resolved' ? 'Resolved' : 'Rejected'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This complaint has been finalised and requires no further action.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Timeline */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {timeline.map((event, i) => {
                  const EventIcon = event.icon
                  const isLast = i === timeline.length - 1
                  return (
                    <div key={event.id} className="relative flex gap-3 pb-5">
                      {/* Connector line */}
                      {!isLast && (
                        <div className={`absolute left-[15px] top-8 w-0.5 h-full ${event.active ? 'bg-primary/30' : 'bg-border'}`} />
                      )}

                      {/* Dot */}
                      <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 shrink-0 transition-all ${
                        event.active
                          ? 'bg-primary/10 border-primary/40'
                          : 'bg-muted border-border'
                      }`}>
                        <EventIcon className={`h-3.5 w-3.5 ${event.active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className={`text-sm font-semibold ${event.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{event.description}</p>
                        {event.time && (
                          <p className="text-xs text-muted-foreground/60 mt-1">{formatDate(event.time)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick info */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Complaint Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: 'Complaint ID', value: complaint.id },
                { label: 'Type',         value: tc.label },
                { label: 'Target',       value: complaint.targetName },
                { label: 'Filed by',     value: complaint.studentName },
              ].map(item => (
                <div key={item.label} className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground text-xs shrink-0">{item.label}</span>
                  <span className="font-medium text-xs text-right truncate max-w-[160px]">{item.value}</span>
                </div>
              ))}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Current Status</span>
                <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text} ${sc.border}`}>
                  <StatusIcon className="h-3 w-3" />
                  {sc.label}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other complaints link */}
          <Link href="/dashboard/coordinator/complaints">
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                <AlertTriangle className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">All Complaints</p>
                <p className="text-xs text-muted-foreground">Back to complaint list</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
