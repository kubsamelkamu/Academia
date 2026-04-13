"use client"

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  X,
  ChevronRight,
  BookOpen,
  Calendar,
  FileText,
  Zap,
  Star,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  useCoordinatorAdvisorNotificationHistory,
  useCoordinatorAdvisorNotificationHistorySummary,
  useSendCoordinatorAdvisorNotification,
} from '@/lib/hooks/use-coordinator-advisor-notifications'
import type {
  CoordinatorAdvisorNotificationPriority,
  DeliveryMethod,
  RecipientMode,
} from '@/types/coordinator-advisor-notifications'
import { useCoordinatorAdvisorOverview } from '@/lib/hooks/use-coordinator-analytics'
import { useAuthStore } from '@/store/auth-store'
import type { CoordinatorAdvisorOverviewAdvisor } from '@/types/advisor-analytics'

const NOTIFICATION_TEMPLATES = [
  {
    id: 'evaluation-reminder',
    title: 'Evaluation Reminder',
    icon: ClipboardIcon,
    description: 'Remind advisors about pending evaluation submissions',
    subject: 'Reminder: Pending Evaluation Submission',
    message: `Dear Advisor,\n\nThis is a reminder that you have pending evaluation submissions that require your attention. Please log in to the system and complete your evaluations at your earliest convenience.\n\nDeadline: [Date]\n\nThank you for your prompt attention to this matter.\n\nBest regards,\nAcademia Coordinator`,
    priority: 'HIGH' as const,
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
    priority: 'INFO' as const,
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
    priority: 'HIGH' as const,
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
    priority: 'CRITICAL' as const,
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

const priorityConfig = {
  INFO: { label: 'Info', color: 'bg-blue-500/10 text-blue-600 border-blue-300', dot: 'bg-blue-400' },
  HIGH: { label: 'High', color: 'bg-amber-500/10 text-amber-600 border-amber-300', dot: 'bg-amber-400' },
  CRITICAL: { label: 'Critical', color: 'bg-rose-500/10 text-rose-600 border-rose-300', dot: 'bg-rose-400' },
}

type AdvisorPerformance = 'excellent' | 'good' | 'needs_attention'

interface AdvisorRecipientOption {
  advisorId: string
  fullName: string
  email: string
  avatarUrl: string | null
  status: string
  currentLoad: number
  availableCapacity: number
  projectCount: number
  performance: AdvisorPerformance
}

function getAdvisorPerformance(advisor: CoordinatorAdvisorOverviewAdvisor): AdvisorPerformance {
  if (advisor.availableCapacity <= 0) {
    return 'needs_attention'
  }

  const progress = advisor.metrics.overallProjectProgress
  if (progress >= 75) {
    return 'excellent'
  }
  if (progress >= 50) {
    return 'good'
  }

  return 'needs_attention'
}

function getRecipientModeLabel(recipientMode: 'SINGLE' | 'MULTIPLE' | 'ALL') {
  if (recipientMode === 'ALL') return 'All Advisors'
  if (recipientMode === 'SINGLE') return 'Single Advisor'
  return 'Selected Advisors'
}

function getCampaignStatus(campaign: {
  totalReachedCount: number
  inAppDeliveredCount: number
  emailAcceptedCount: number
  emailDeliveredCount: number
  emailFailedCount: number
}) {
  if (
    campaign.emailFailedCount > 0 &&
    campaign.inAppDeliveredCount === 0 &&
    campaign.emailAcceptedCount === 0 &&
    campaign.emailDeliveredCount === 0
  ) {
    return 'failed' as const
  }

  if (
    campaign.inAppDeliveredCount > 0 ||
    campaign.emailAcceptedCount > 0 ||
    campaign.emailDeliveredCount > 0
  ) {
    return 'delivered' as const
  }

  return 'pending' as const
}

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  const response = (error as { response?: { status?: unknown } }).response
  const status = response?.status
  return typeof status === 'number' ? status : null
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallback
}

function mapSendError(error: unknown): { title: string; description: string } {
  const status = getErrorStatus(error)
  const backendMessage = getErrorMessage(error, 'Failed to send notification campaign.')

  if (status === 403) {
    return {
      title: 'Permission denied',
      description: backendMessage || 'One or more selected advisors are outside your department.',
    }
  }

  if (status === 400) {
    return {
      title: 'Invalid request',
      description: backendMessage || 'Please check required fields and try again.',
    }
  }

  if (status === 404) {
    return {
      title: 'Not found',
      description: backendMessage || 'The notification endpoint is not available.',
    }
  }

  return {
    title: 'Send failed',
    description: backendMessage,
  }
}

function mapHistoryError(error: unknown): string {
  const status = getErrorStatus(error)
  if (status === 403) {
    return 'You do not have permission to view advisor notification history for this department.'
  }
  if (status === 404) {
    return 'Notification history endpoint was not found.'
  }
  return getErrorMessage(error, 'Failed to load notification history.')
}

export default function NotifyAdvisorsPage() {
  const user = useAuthStore((state) => state.user)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const canQueryCoordinatorData = Boolean(user)

  const advisorOverviewQuery = useCoordinatorAdvisorOverview({
    departmentId,
    enabled: canQueryCoordinatorData && Boolean(departmentId),
    page: 1,
    limit: 100,
  })

  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'INFO' | 'HIGH' | 'CRITICAL'>('INFO')
  const [notificationType, setNotificationType] = useState<'email' | 'in-app' | 'both'>('both')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [filterPerformance, setFilterPerformance] = useState('all')
  const [historyPage, setHistoryPage] = useState(1)
  const [historySearch, setHistorySearch] = useState('')
  const [historyPriorityFilter, setHistoryPriorityFilter] = useState<'all' | CoordinatorAdvisorNotificationPriority>('all')
  const [historyDeliveryFilter, setHistoryDeliveryFilter] = useState<'all' | DeliveryMethod>('all')
  const historyPageSize = 5

  const historySummaryQuery = useCoordinatorAdvisorNotificationHistorySummary(canQueryCoordinatorData)
  const historyQuery = useCoordinatorAdvisorNotificationHistory(
    {
      page: historyPage,
      limit: historyPageSize,
      search: historySearch.trim() || undefined,
      priority: historyPriorityFilter === 'all' ? undefined : historyPriorityFilter,
      deliveryMethod: historyDeliveryFilter === 'all' ? undefined : historyDeliveryFilter,
    },
    canQueryCoordinatorData
  )
  const sendNotificationMutation = useSendCoordinatorAdvisorNotification()

  const advisors = useMemo<AdvisorRecipientOption[]>(() => {
    return (advisorOverviewQuery.data?.advisors ?? []).map((advisor) => ({
      advisorId: advisor.advisorId,
      fullName: advisor.fullName,
      email: advisor.email,
      avatarUrl: advisor.avatarUrl,
      status: advisor.status,
      currentLoad: advisor.currentLoad,
      availableCapacity: advisor.availableCapacity,
      projectCount: advisor.metrics.totalProjectsAdvising,
      performance: getAdvisorPerformance(advisor),
    }))
  }, [advisorOverviewQuery.data?.advisors])

  const filteredAdvisors = filterPerformance === 'all'
    ? advisors
    : advisors.filter(a => a.performance === filterPerformance)

  const totalAdvisorCount = advisorOverviewQuery.data?.summary.totalAdvisors ?? advisors.length
  const recipientLoadError = advisorOverviewQuery.error?.message
  const isRecipientsLoading = advisorOverviewQuery.isLoading
  const historyItems = historyQuery.data?.items ?? []
  const historyTotalItems = historyQuery.data?.pagination.totalItems ?? historyItems.length
  const historySummary = historySummaryQuery.data
  const historyError = historyQuery.error ?? historySummaryQuery.error
  const historyErrorMessage = historyError ? mapHistoryError(historyError) : null
  const isHistoryLoading = historyQuery.isLoading || historySummaryQuery.isLoading

  const summaryCards = useMemo(() => {
    const summary = historySummary
    const summaryIsEmpty =
      !summary ||
      (
        summary.totalSent === 0 &&
        summary.delivered === 0 &&
        summary.totalReached === 0
      )

    if (!summaryIsEmpty) {
      return {
        totalSent: summary.totalSent,
        delivered: summary.delivered,
        totalReached: summary.totalReached,
      }
    }

    if (historyItems.length === 0) {
      return { totalSent: 0, delivered: 0, totalReached: 0 }
    }

    return {
      totalSent: historyItems.length,
      delivered: historyItems.filter((item) => getCampaignStatus(item) === 'delivered').length,
      totalReached: historyItems.reduce((sum, item) => sum + item.totalReachedCount, 0),
    }
  }, [historySummary, historyItems])

  React.useEffect(() => {
    setHistoryPage(1)
  }, [historySearch, historyPriorityFilter, historyDeliveryFilter])
  const historyPagination = historyQuery.data?.pagination
  const historyTotalPages = Math.max(1, historyPagination?.totalPages ?? 1)

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setSelectedAdvisors(checked ? filteredAdvisors.map(a => a.advisorId) : [])
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
    const targetCount = selectAll ? totalAdvisorCount : selectedAdvisors.length
    if (targetCount === 0) {
      toast.error('Select at least one advisor')
      return
    }

    const recipientMode: RecipientMode =
      selectAll ? 'ALL' : selectedAdvisors.length === 1 ? 'SINGLE' : 'MULTIPLE'

    const deliveryMethodMap: Record<typeof notificationType, DeliveryMethod> = {
      email: 'EMAIL',
      'in-app': 'IN_APP',
      both: 'BOTH',
    }

    const payload = {
      recipientMode,
      advisorUserIds: recipientMode === 'ALL' ? undefined : selectedAdvisors,
      priority,
      deliveryMethod: deliveryMethodMap[notificationType],
      subject: subject.trim(),
      message: message.trim(),
    }

    setIsSending(true)
    try {
      const result = await sendNotificationMutation.mutateAsync(payload)

      setSent(true)
      toast.success('Notifications Sent!', {
        description: `Successfully notified ${targetCount} advisor${targetCount !== 1 ? 's' : ''}.`,
      })

      setTimeout(() => setSent(false), 3000)
      setSubject('')
      setMessage('')
      setSelectedAdvisors([])
      setSelectAll(false)
    } catch (error) {
      const mapped = mapSendError(error)
      toast.error(mapped.title, { description: mapped.description })
    } finally {
      setIsSending(false)
    }
  }

  const recipientCount = selectAll ? totalAdvisorCount : selectedAdvisors.length

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
        <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
          <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{totalAdvisorCount} advisors</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{summaryCards.totalSent} sent</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="compose" className="gap-2 shrink-0">
            <Send className="h-4 w-4" /> Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 shrink-0">
            <Clock className="h-4 w-4" /> History
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{historyTotalItems}</Badge>
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
                      <p className="text-xs text-muted-foreground">{totalAdvisorCount} advisors</p>
                    </label>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">All</Badge>
                  </div>

                  <Separator />

                  {/* Individual Advisors */}
                  <div className="space-y-1 pt-1">
                    {!departmentId && (
                      <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                        Your account is missing a department assignment, so advisors cannot be loaded yet.
                      </div>
                    )}

                    {departmentId && recipientLoadError && (
                      <div className="rounded-lg border border-destructive/20 px-3 py-4 text-sm text-destructive">
                        Failed to load advisors: {recipientLoadError}
                      </div>
                    )}

                    {departmentId && isRecipientsLoading && (
                      <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                        Loading advisors...
                      </div>
                    )}

                    {departmentId && !isRecipientsLoading && !recipientLoadError && filteredAdvisors.length === 0 && (
                      <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                        No advisors found for the current department.
                      </div>
                    )}

                    {filteredAdvisors.map(advisor => (
                      <div
                        key={advisor.advisorId}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${selectedAdvisors.includes(advisor.advisorId) ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50 border border-transparent'}`}
                        onClick={() => handleSelectAdvisor(advisor.advisorId, !selectedAdvisors.includes(advisor.advisorId))}
                      >
                        <Checkbox
                          checked={selectAll || selectedAdvisors.includes(advisor.advisorId)}
                          onCheckedChange={(v) => handleSelectAdvisor(advisor.advisorId, v as boolean)}
                          onClick={e => e.stopPropagation()}
                        />
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={advisor.avatarUrl ?? undefined} alt={advisor.fullName} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {advisor.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{advisor.fullName}</p>
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
                          <SelectItem value="INFO">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-400" />
                              Info
                            </div>
                          </SelectItem>
                          <SelectItem value="HIGH">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-amber-400" />
                              High
                            </div>
                          </SelectItem>
                          <SelectItem value="CRITICAL">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-rose-400" />
                              Critical
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
                  <div className="flex flex-wrap items-center gap-2 pt-1">
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      {recipientCount > 0
                        ? `Ready to send to ${recipientCount} advisor${recipientCount !== 1 ? 's' : ''}`
                        : 'Select recipients to continue'}
                    </p>
                    <Button
                      className={`btn-gradient gap-2 w-full sm:w-auto sm:min-w-[140px] ${sent ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                      onClick={handleSend}
                      disabled={isSending || sendNotificationMutation.isPending || recipientCount === 0 || !subject.trim() || !message.trim()}
                    >
                      {isSending || sendNotificationMutation.isPending ? (
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
          <div className="grid gap-4 grid-cols-3 mb-6">
            {[
              { label: 'Total Sent', value: summaryCards.totalSent, icon: Send, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Delivered', value: summaryCards.delivered, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Reached', value: summaryCards.totalReached, icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
            ].map(stat => (
              <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-5">
                  <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                    <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold tracking-tight">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Input
                placeholder="Search history by subject..."
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                className="h-10"
              />
            </div>

            <Select
              value={historyPriorityFilter}
              onValueChange={(value) => setHistoryPriorityFilter(value as 'all' | CoordinatorAdvisorNotificationPriority)}
            >
              <SelectTrigger className="h-10 w-full sm:w-40 shrink-0">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={historyDeliveryFilter}
              onValueChange={(value) => setHistoryDeliveryFilter(value as 'all' | DeliveryMethod)}
            >
              <SelectTrigger className="h-10 w-full sm:w-44 shrink-0">
                <SelectValue placeholder="Delivery" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Delivery</SelectItem>
                <SelectItem value="IN_APP">In-App</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="BOTH">Both</SelectItem>
              </SelectContent>
            </Select>

            {(historySearch || historyPriorityFilter !== 'all' || historyDeliveryFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 shrink-0 text-xs"
                onClick={() => {
                  setHistorySearch('')
                  setHistoryPriorityFilter('all')
                  setHistoryDeliveryFilter('all')
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Notification History</CardTitle>
              <CardDescription>Previously sent notifications and their delivery status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {historyErrorMessage && (
                <div className="rounded-xl border border-destructive/20 p-4 text-sm text-destructive">
                  {historyErrorMessage}
                </div>
              )}

              {isHistoryLoading && !historyErrorMessage && (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Loading notification history...
                </div>
              )}

              {!isHistoryLoading && !historyErrorMessage && historyItems.length === 0 && (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  No notification campaigns have been sent yet.
                </div>
              )}

              {historyItems.map((log) => {
                const campaignStatus = getCampaignStatus(log)

                return (
                  <div key={log.campaignId} className="rounded-xl border">
                    <div className="flex items-start gap-4 p-4">
                      <div className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${campaignStatus === 'delivered' ? 'bg-emerald-500/10' : campaignStatus === 'pending' ? 'bg-amber-500/10' : 'bg-rose-500/10'}`}>
                        {campaignStatus === 'delivered' ? (
                          <CheckCircle2 className={`h-5 w-5 text-emerald-500`} />
                        ) : campaignStatus === 'pending' ? (
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
                            <Badge variant="outline" className="text-xs capitalize">{campaignStatus}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {log.totalReachedCount} recipients
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {getRecipientModeLabel(log.recipientMode)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {log.deliveryMethod}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
              )})}
            </CardContent>
          </Card>

          {historyTotalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page <span className="font-semibold text-foreground">{historyPagination?.page ?? historyPage}</span> of {historyTotalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage <= 1 || historyQuery.isFetching}
                  onClick={() => setHistoryPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyPage >= historyTotalPages || historyQuery.isFetching}
                  onClick={() => setHistoryPage((current) => Math.min(historyTotalPages, current + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}

        </TabsContent>
      </Tabs>
    </div>
  )
}
