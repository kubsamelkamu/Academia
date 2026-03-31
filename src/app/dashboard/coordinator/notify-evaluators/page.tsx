"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Star,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Filter,
  ClipboardCheck,
  Calendar,
  FileText,
  Zap,
  Bell,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { mockUsers, mockProjects, mockEvaluations } from '@/data/mockData'

const NOTIFICATION_TEMPLATES = [
  {
    id: 'eval-submission-reminder',
    title: 'Evaluation Submission Reminder',
    icon: ClipboardCheck,
    description: 'Remind evaluators about pending evaluation submissions',
    subject: 'Reminder: Pending Evaluation Submission',
    message: `Dear Evaluator,\n\nThis is a reminder that you have pending evaluation submissions awaiting your attention. Please log in to the system and complete your evaluations at your earliest convenience.\n\nDeadline: [Date]\n\nThank you for your prompt attention to this matter.\n\nBest regards,\nAcademia Coordinator`,
    priority: 'high' as const,
    badge: 'Common',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-300',
  },
  {
    id: 'rubric-update',
    title: 'Rubric & Scoring Update',
    icon: FileText,
    description: 'Notify evaluators about rubric or scoring criteria changes',
    subject: 'Important: Updated Evaluation Rubric',
    message: `Dear Evaluator,\n\nPlease be informed that the evaluation rubric has been updated. Kindly review the new scoring criteria before proceeding with your pending evaluations.\n\nKey changes:\n- [Change 1]\n- [Change 2]\n\nFor questions, please contact the coordinator.\n\nBest regards,\nAcademia Coordinator`,
    priority: 'medium' as const,
    badge: 'Important',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-300',
  },
  {
    id: 'defense-schedule',
    title: 'Defense Schedule Notice',
    icon: Calendar,
    description: 'Inform evaluators of upcoming defense sessions',
    subject: 'Defense Schedule — Your Attendance Required',
    message: `Dear Evaluator,\n\nDefense schedules have been finalized. You have been assigned to evaluate the following projects. Please review the schedule and confirm your availability.\n\nDefense Period: [Date Range]\nVenue: [Location]\n\nKindly confirm your attendance by [Confirmation Deadline].\n\nBest regards,\nAcademia Coordinator`,
    priority: 'high' as const,
    badge: 'Seasonal',
    badgeColor: 'bg-violet-500/10 text-violet-600 border-violet-300',
  },
  {
    id: 'score-submission-deadline',
    title: 'Score Submission Deadline',
    icon: Star,
    description: 'Alert evaluators about score submission cut-offs',
    subject: 'IMPORTANT: Score Submission Deadline Approaching',
    message: `Dear Evaluator,\n\nThis is to notify you that the deadline for submitting your evaluation scores is approaching.\n\nSubmission Deadline: [Date]\n\nPlease ensure all evaluation forms are completed and submitted before the deadline. Late submissions may affect the grade finalization process.\n\nBest regards,\nAcademia Coordinator`,
    priority: 'urgent' as const,
    badge: 'Urgent',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-300',
  },
]

interface NotificationLog {
  id: string
  subject: string
  sentTo: string
  sentAt: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'delivered' | 'pending' | 'failed'
  recipients: number
}

const mockNotificationLogs: NotificationLog[] = [
  {
    id: 'en1',
    subject: 'Reminder: Pending Evaluation Submission',
    sentTo: 'All Evaluators',
    sentAt: '2024-01-15T10:30:00Z',
    priority: 'high',
    status: 'delivered',
    recipients: 4,
  },
  {
    id: 'en2',
    subject: 'Defense Schedule — Your Attendance Required',
    sentTo: 'Selected Evaluators',
    sentAt: '2024-01-13T09:00:00Z',
    priority: 'high',
    status: 'delivered',
    recipients: 2,
  },
  {
    id: 'en3',
    subject: 'Important: Updated Evaluation Rubric',
    sentTo: 'All Evaluators',
    sentAt: '2024-01-10T14:00:00Z',
    priority: 'medium',
    status: 'delivered',
    recipients: 4,
  },
]

const priorityConfig = {
  low:    { label: 'Low',    color: 'bg-slate-500/10 text-slate-600 border-slate-300',  dot: 'bg-slate-400' },
  medium: { label: 'Medium', color: 'bg-blue-500/10 text-blue-600 border-blue-300',     dot: 'bg-blue-400' },
  high:   { label: 'High',   color: 'bg-amber-500/10 text-amber-600 border-amber-300', dot: 'bg-amber-400' },
  urgent: { label: 'Urgent', color: 'bg-rose-500/10 text-rose-600 border-rose-300',    dot: 'bg-rose-400' },
}

export default function NotifyEvaluatorsPage() {
  const evaluators = mockUsers.filter(u => u.role === 'evaluator')

  const [selectedEvaluators, setSelectedEvaluators] = useState<string[]>([])
  const [selectAll, setSelectAll]   = useState(false)
  const [subject, setSubject]       = useState('')
  const [message, setMessage]       = useState('')
  const [priority, setPriority]     = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [deliveryChannel, setDeliveryChannel] = useState<'email' | 'in-app' | 'both'>('both')
  const [isSending, setIsSending]   = useState(false)
  const [sent, setSent]             = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  const evaluatorMetrics = evaluators.map(ev => {
    const assigned = mockProjects.filter(p => (p.evaluatorIds ?? []).includes(ev.id))
    const evEvals  = mockEvaluations.filter(e => e.evaluatorId === ev.id)
    const pending  = evEvals.filter(e => e.status === 'pending').length
    const done     = evEvals.filter(e => e.status === 'submitted' || e.status === 'reviewed').length
    const completion = assigned.length > 0 ? Math.round((done / assigned.length) * 100) : 0
    const status = completion >= 75 ? 'on_track' : pending > 0 ? 'has_pending' : 'no_tasks'
    return { ...ev, assignedCount: assigned.length, pending, done, completion, status }
  })

  const filteredEvaluators = filterStatus === 'all'
    ? evaluatorMetrics
    : evaluatorMetrics.filter(e => e.status === filterStatus)

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setSelectedEvaluators(checked ? filteredEvaluators.map(e => e.id) : [])
  }

  const handleSelectEvaluator = (id: string, checked: boolean) => {
    setSelectedEvaluators(prev => checked ? [...prev, id] : prev.filter(i => i !== id))
  }

  const handleUseTemplate = (t: typeof NOTIFICATION_TEMPLATES[0]) => {
    setSubject(t.subject)
    setMessage(t.message)
    setPriority(t.priority)
    toast.success('Template applied', { description: t.title })
  }

  const handleSend = async () => {
    if (!subject.trim()) { toast.error('Subject is required'); return }
    if (!message.trim()) { toast.error('Message is required'); return }
    const targetCount = selectAll ? evaluators.length : selectedEvaluators.length
    if (targetCount === 0) { toast.error('Select at least one evaluator'); return }

    setIsSending(true)
    await new Promise(r => setTimeout(r, 1500))
    setIsSending(false)
    setSent(true)

    toast.success('Notifications Sent!', {
      description: `Successfully notified ${targetCount} evaluator${targetCount !== 1 ? 's' : ''}.`,
    })

    setTimeout(() => setSent(false), 3000)
    setSubject('')
    setMessage('')
    setSelectedEvaluators([])
    setSelectAll(false)
  }

  const recipientCount = selectAll ? evaluators.length : selectedEvaluators.length

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Notify Evaluators</h1>
            <p className="text-sm text-muted-foreground">Send notifications and announcements to project evaluators</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-11 sm:pl-0">
          <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">{evaluators.length} evaluators</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{mockNotificationLogs.length} sent</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList className="h-10">
          <TabsTrigger value="compose" className="gap-2">
            <Send className="h-4 w-4" /> Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" /> History
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{mockNotificationLogs.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Compose Tab ── */}
        <TabsContent value="compose" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">

            {/* Recipients Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-display">Recipients</CardTitle>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <Filter className="h-3 w-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="has_pending">Has Pending</SelectItem>
                        <SelectItem value="no_tasks">No Tasks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 p-3 pt-0">

                  {/* Select All */}
                  <div className="flex items-center gap-3 rounded-lg border-2 border-amber-500/30 bg-amber-500/5 px-3 py-2.5 mb-2">
                    <Checkbox
                      id="select-all-evals"
                      checked={selectAll}
                      onCheckedChange={(v) => handleSelectAll(v as boolean)}
                    />
                    <label htmlFor="select-all-evals" className="flex-1 cursor-pointer">
                      <p className="text-sm font-semibold">Select All Evaluators</p>
                      <p className="text-xs text-muted-foreground">{evaluators.length} evaluators</p>
                    </label>
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-300 text-xs">All</Badge>
                  </div>

                  <Separator />

                  {/* Individual Evaluators */}
                  <div className="space-y-1 pt-1">
                    {filteredEvaluators.map(ev => (
                      <div
                        key={ev.id}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${selectedEvaluators.includes(ev.id) ? 'bg-amber-500/5 border border-amber-500/20' : 'hover:bg-muted/50 border border-transparent'}`}
                        onClick={() => handleSelectEvaluator(ev.id, !selectedEvaluators.includes(ev.id))}
                      >
                        <Checkbox
                          checked={selectAll || selectedEvaluators.includes(ev.id)}
                          onCheckedChange={(v) => handleSelectEvaluator(ev.id, v as boolean)}
                          onClick={e => e.stopPropagation()}
                        />
                        <div className="relative shrink-0">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-amber-500/10 text-amber-600 font-semibold">
                              {ev.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-background border flex items-center justify-center">
                            <Star className="h-2 w-2 text-amber-500 fill-amber-500" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ev.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ev.assignedCount} assigned · {ev.pending} pending
                          </p>
                        </div>
                        <div className={`h-2 w-2 rounded-full shrink-0 ${ev.status === 'on_track' ? 'bg-emerald-400' : ev.status === 'has_pending' ? 'bg-amber-400' : 'bg-muted-foreground'}`} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {recipientCount > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                    {recipientCount} evaluator{recipientCount !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>

            {/* Compose Panel */}
            <div className="lg:col-span-2 space-y-4">

              {/* Templates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Quick Templates
                  </CardTitle>
                  <CardDescription>Pre-written messages for common evaluator notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {NOTIFICATION_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleUseTemplate(t)}
                        className="group flex items-start gap-3 rounded-xl border p-3 text-left transition-all hover:border-amber-500/40 hover:bg-amber-500/5 hover:shadow-sm"
                      >
                        <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                          <t.icon className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold truncate">{t.title}</p>
                            <Badge className={`text-xs px-1.5 py-0 shrink-0 ${t.badgeColor}`}>{t.badge}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Compose Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-500" />
                    Compose Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority Level</Label>
                      <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                        <SelectTrigger className="h-9">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${priorityConfig[priority].dot}`} />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                            <SelectItem key={p} value={p}>
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${priorityConfig[p].dot}`} />
                                {priorityConfig[p].label} Priority
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery Channel</Label>
                      <Select value={deliveryChannel} onValueChange={(v) => setDeliveryChannel(v as typeof deliveryChannel)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email Only</div>
                          </SelectItem>
                          <SelectItem value="in-app">
                            <div className="flex items-center gap-2"><Bell className="h-4 w-4" /> In-App Only</div>
                          </SelectItem>
                          <SelectItem value="both">
                            <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> Email + In-App</div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ev-subject" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject Line</Label>
                    <Input
                      id="ev-subject"
                      placeholder="Enter notification subject..."
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ev-message" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message Body</Label>
                    <Textarea
                      id="ev-message"
                      placeholder="Write your notification message here... Use [Date], [Name], or [Location] as placeholders."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={8}
                      className="resize-none text-sm"
                    />
                    <p className="text-xs text-muted-foreground text-right">{message.length} characters</p>
                  </div>

                  {/* Preview */}
                  {(subject || message) && (
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" /> Preview
                      </p>
                      {subject && <p className="font-semibold text-sm">{subject}</p>}
                      {message && <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">{message}</p>}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge className={`text-xs ${priorityConfig[priority].color}`}>{priorityConfig[priority].label}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{deliveryChannel}</Badge>
                        <Badge variant="outline" className="text-xs">
                          To: {recipientCount > 0 ? `${recipientCount} evaluator${recipientCount !== 1 ? 's' : ''}` : 'None selected'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      {recipientCount > 0
                        ? `Ready to send to ${recipientCount} evaluator${recipientCount !== 1 ? 's' : ''}`
                        : 'Select recipients to continue'}
                    </p>
                    <Button
                      className={`btn-gradient gap-2 min-w-[160px] ${sent ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                      onClick={handleSend}
                      disabled={isSending || recipientCount === 0 || !subject.trim() || !message.trim()}
                    >
                      {isSending ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          Sending...
                        </>
                      ) : sent ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" /> Sent!
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> Send Notification
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 mb-2">
            {[
              { label: 'Total Sent',    value: mockNotificationLogs.length,                                                icon: Send,         color: 'text-blue-500',    bg: 'bg-blue-500/10' },
              { label: 'Delivered',     value: mockNotificationLogs.filter(n => n.status === 'delivered').length,          icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Total Reached', value: mockNotificationLogs.reduce((s, n) => s + n.recipients, 0),                icon: Users,        color: 'text-violet-500',  bg: 'bg-violet-500/10' },
            ].map(stat => (
              <Card key={stat.label} className="border-none shadow-sm">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Notification History</CardTitle>
              <CardDescription>Previously sent notifications and their delivery status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockNotificationLogs.map(log => (
                <div key={log.id} className="flex items-start gap-4 rounded-xl border p-4 hover:bg-muted/30 transition-colors">
                  <div className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${log.status === 'delivered' ? 'bg-emerald-500/10' : log.status === 'pending' ? 'bg-amber-500/10' : 'bg-rose-500/10'}`}>
                    {log.status === 'delivered'
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : log.status === 'pending'
                      ? <Clock className="h-5 w-5 text-amber-500" />
                      : <AlertTriangle className="h-5 w-5 text-rose-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 mb-1">
                      <p className="font-semibold text-sm flex-1 min-w-0 truncate">{log.subject}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge className={`text-xs ${priorityConfig[log.priority].color}`}>{priorityConfig[log.priority].label}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{log.status}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" /> {log.recipients} evaluator{log.recipients !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> {log.sentTo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
