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
  Bell,
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
  ChevronRight,
  BookOpen,
  Calendar,
  FileText,
  Zap,
  Star,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { mockUsers, mockProjects } from '@/data/mockData'

const NOTIFICATION_TEMPLATES = [
  {
    id: 'evaluation-reminder',
    title: 'Evaluation Reminder',
    icon: ClipboardIcon,
    description: 'Remind advisors about pending evaluation submissions',
    subject: 'Reminder: Pending Evaluation Submission',
    message: `Dear Advisor,\n\nThis is a reminder that you have pending evaluation submissions that require your attention. Please log in to the system and complete your evaluations at your earliest convenience.\n\nDeadline: [Date]\n\nThank you for your prompt attention to this matter.\n\nBest regards,\nAcademia Coordinator`,
    priority: 'high' as const,
    badge: 'Common',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-300',
  },
  {
    id: 'progress-update',
    title: 'Progress Update Request',
    icon: TrendingUpIcon,
    description: 'Request status updates on project progress',
    subject: 'Action Required: Project Progress Update',
    message: `Dear Advisor,\n\nPlease provide an updated status on the projects you are currently supervising. Ensure all milestone reports are up to date in the system.\n\nThis update is required by: [Date]\n\nThank you for your cooperation.\n\nBest regards,\nAcademia Coordinator`,
    priority: 'medium' as const,
    badge: 'Popular',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-300',
  },
  {
    id: 'defense-schedule',
    title: 'Defense Schedule Notice',
    icon: CalendarIcon,
    description: 'Notify advisors about upcoming defense schedules',
    subject: 'Defense Schedule Announcement',
    message: `Dear Advisor,\n\nPlease be advised that defense schedules have been finalized. Please review the schedule in the system and confirm your availability.\n\nDefense Period: [Date Range]\nLocation: [Location]\n\nKindly confirm your attendance for each scheduled defense.\n\nBest regards,\nAcademia Coordinator`,
    priority: 'high' as const,
    badge: 'Seasonal',
    badgeColor: 'bg-violet-500/10 text-violet-600 border-violet-300',
  },
  {
    id: 'grade-submission',
    title: 'Grade Submission Deadline',
    icon: AwardIcon,
    description: 'Alert advisors about grade submission deadlines',
    subject: 'IMPORTANT: Grade Submission Deadline',
    message: `Dear Advisor,\n\nThis is to notify you that the deadline for submitting student grades is approaching.\n\nSubmission Deadline: [Date]\n\nPlease ensure all scores are entered in the system before the deadline. Late submissions may affect the grade finalization process.\n\nBest regards,\nAcademia Coordinator`,
    priority: 'urgent' as const,
    badge: 'Urgent',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-300',
  },
]

function ClipboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return <FileText {...props} />
}
function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return <ChevronRight {...props} />
}
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Calendar {...props} />
}
function AwardIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Star {...props} />
}

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
    id: 'n1',
    subject: 'Reminder: Pending Evaluation Submission',
    sentTo: 'All Advisors',
    sentAt: '2024-01-14T09:30:00Z',
    priority: 'high',
    status: 'delivered',
    recipients: 8,
  },
  {
    id: 'n2',
    subject: 'Action Required: Project Progress Update',
    sentTo: 'Selected Advisors',
    sentAt: '2024-01-12T14:15:00Z',
    priority: 'medium',
    status: 'delivered',
    recipients: 3,
  },
  {
    id: 'n3',
    subject: 'Defense Schedule Announcement',
    sentTo: 'All Advisors',
    sentAt: '2024-01-10T11:00:00Z',
    priority: 'high',
    status: 'delivered',
    recipients: 8,
  },
]

const priorityConfig = {
  low: { label: 'Low', color: 'bg-slate-500/10 text-slate-600 border-slate-300', dot: 'bg-slate-400' },
  medium: { label: 'Medium', color: 'bg-blue-500/10 text-blue-600 border-blue-300', dot: 'bg-blue-400' },
  high: { label: 'High', color: 'bg-amber-500/10 text-amber-600 border-amber-300', dot: 'bg-amber-400' },
  urgent: { label: 'Urgent', color: 'bg-rose-500/10 text-rose-600 border-rose-300', dot: 'bg-rose-400' },
}

export default function NotifyAdvisorsPage() {
  const advisors = mockUsers.filter(u => u.role === 'advisor')

  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [notificationType, setNotificationType] = useState<'email' | 'in-app' | 'both'>('both')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [filterPerformance, setFilterPerformance] = useState('all')

  const advisorMetrics = advisors.map(advisor => {
    const projects = mockProjects.filter(p => p.advisorId === advisor.id)
    const avgProg = projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length)
      : 0
    return {
      ...advisor,
      projectCount: projects.length,
      avgProgress: avgProg,
      performance: avgProg >= 75 ? 'excellent' : avgProg >= 50 ? 'good' : 'needs_attention',
    }
  })

  const filteredAdvisors = filterPerformance === 'all'
    ? advisorMetrics
    : advisorMetrics.filter(a => a.performance === filterPerformance)

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setSelectedAdvisors(checked ? filteredAdvisors.map(a => a.id) : [])
  }

  const handleSelectAdvisor = (id: string, checked: boolean) => {
    setSelectedAdvisors(prev =>
      checked ? [...prev, id] : prev.filter(i => i !== id)
    )
  }

  const handleUseTemplate = (template: typeof NOTIFICATION_TEMPLATES[0]) => {
    setSubject(template.subject)
    setMessage(template.message)
    setPriority(template.priority)
    toast.success('Template applied', { description: template.title })
  }

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error('Subject is required')
      return
    }
    if (!message.trim()) {
      toast.error('Message is required')
      return
    }
    const targetCount = selectAll ? advisors.length : selectedAdvisors.length
    if (targetCount === 0) {
      toast.error('Select at least one advisor')
      return
    }

    setIsSending(true)
    await new Promise(r => setTimeout(r, 1500))
    setIsSending(false)
    setSent(true)

    toast.success('Notifications Sent!', {
      description: `Successfully notified ${targetCount} advisor${targetCount !== 1 ? 's' : ''}.`,
    })

    setTimeout(() => setSent(false), 3000)
    setSubject('')
    setMessage('')
    setSelectedAdvisors([])
    setSelectAll(false)
  }

  const recipientCount = selectAll ? advisors.length : selectedAdvisors.length

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
            <h1 className="text-2xl font-bold font-display tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Notify Advisors</h1>
            <p className="text-sm text-muted-foreground">Send notifications and announcements to faculty advisors</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-11 sm:pl-0">
          <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{advisors.length} advisors</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{mockNotificationLogs.length} sent today</span>
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

        <TabsContent value="compose" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">

            {/* Left: Recipient Selection */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-display">Recipients</CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={filterPerformance} onValueChange={setFilterPerformance}>
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <Filter className="h-3 w-3 mr-1" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="needs_attention">Needs Attention</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 p-3 pt-0">
                  {/* Select All */}
                  <div className="flex items-center gap-3 rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2.5 mb-2">
                    <Checkbox
                      id="select-all"
                      checked={selectAll}
                      onCheckedChange={(v) => handleSelectAll(v as boolean)}
                    />
                    <label htmlFor="select-all" className="flex-1 cursor-pointer">
                      <p className="text-sm font-semibold">Select All Advisors</p>
                      <p className="text-xs text-muted-foreground">{advisors.length} advisors</p>
                    </label>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">All</Badge>
                  </div>

                  <Separator />

                  {/* Individual Advisors */}
                  <div className="space-y-1 pt-1">
                    {filteredAdvisors.map(advisor => (
                      <div
                        key={advisor.id}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${selectedAdvisors.includes(advisor.id) ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50 border border-transparent'}`}
                        onClick={() => handleSelectAdvisor(advisor.id, !selectedAdvisors.includes(advisor.id))}
                      >
                        <Checkbox
                          checked={selectAll || selectedAdvisors.includes(advisor.id)}
                          onCheckedChange={(v) => handleSelectAdvisor(advisor.id, v as boolean)}
                          onClick={e => e.stopPropagation()}
                        />
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {advisor.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{advisor.name}</p>
                          <p className="text-xs text-muted-foreground">{advisor.projectCount} projects</p>
                        </div>
                        <div className={`h-2 w-2 rounded-full shrink-0 ${advisor.performance === 'excellent' ? 'bg-emerald-400' : advisor.performance === 'good' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {recipientCount > 0 && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm text-primary font-medium">
                    {recipientCount} advisor{recipientCount !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>

            {/* Right: Compose Area */}
            <div className="lg:col-span-2 space-y-4">

              {/* Templates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Quick Templates
                  </CardTitle>
                  <CardDescription>Start with a pre-written template</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {NOTIFICATION_TEMPLATES.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleUseTemplate(template)}
                        className="group flex items-start gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                      >
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                          <template.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold">{template.title}</p>
                            <Badge className={`text-xs px-1.5 py-0 ${template.badgeColor}`}>{template.badge}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Compose */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Compose Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Settings Row */}
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
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-slate-400" />
                              Low Priority
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-400" />
                              Medium Priority
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-amber-400" />
                              High Priority
                            </div>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-rose-400" />
                              Urgent
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery Channel</Label>
                      <Select value={notificationType} onValueChange={(v) => setNotificationType(v as typeof notificationType)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" /> Email Only
                            </div>
                          </SelectItem>
                          <SelectItem value="in-app">
                            <div className="flex items-center gap-2">
                              <Bell className="h-4 w-4" /> In-App Only
                            </div>
                          </SelectItem>
                          <SelectItem value="both">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" /> Email + In-App
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject Line</Label>
                    <Input
                      id="subject"
                      placeholder="Enter notification subject..."
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message Body</Label>
                    <Textarea
                      id="message"
                      placeholder="Write your notification message here... Use [Date], [Name], or [Location] as placeholders."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={8}
                      className="resize-none text-sm"
                    />
                    <p className="text-xs text-muted-foreground text-right">{message.length} characters</p>
                  </div>

                  {/* Preview Banner */}
                  {(subject || message) && (
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" /> Preview
                      </p>
                      {subject && <p className="font-semibold text-sm">{subject}</p>}
                      {message && (
                        <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">{message}</p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <Badge className={`text-xs ${priorityConfig[priority].color}`}>
                          {priorityConfig[priority].label}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">{notificationType}</Badge>
                        <Badge variant="outline" className="text-xs">
                          To: {recipientCount > 0 ? `${recipientCount} advisor${recipientCount !== 1 ? 's' : ''}` : 'None selected'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Send Button */}
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      {recipientCount > 0
                        ? `Ready to send to ${recipientCount} advisor${recipientCount !== 1 ? 's' : ''}`
                        : 'Select recipients to continue'}
                    </p>
                    <Button
                      className={`btn-gradient gap-2 min-w-[140px] ${sent ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
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
                          <CheckCircle2 className="h-4 w-4" />
                          Sent!
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Notification
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            {[
              { label: 'Total Sent', value: mockNotificationLogs.length, icon: Send, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Delivered', value: mockNotificationLogs.filter(n => n.status === 'delivered').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Total Reached', value: mockNotificationLogs.reduce((s, n) => s + n.recipients, 0), icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
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
              {mockNotificationLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 rounded-xl border p-4 hover:bg-muted/30 transition-colors">
                  <div className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${log.status === 'delivered' ? 'bg-emerald-500/10' : log.status === 'pending' ? 'bg-amber-500/10' : 'bg-rose-500/10'}`}>
                    {log.status === 'delivered' ? (
                      <CheckCircle2 className={`h-5 w-5 text-emerald-500`} />
                    ) : log.status === 'pending' ? (
                      <Clock className="h-5 w-5 text-amber-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                    )}
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
                        <Users className="h-3 w-3" /> {log.recipients} recipients
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> {log.sentTo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(log.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
