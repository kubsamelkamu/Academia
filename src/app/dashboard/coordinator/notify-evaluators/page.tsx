"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Eye,
  FileText,
  Filter,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  useCoordinatorEvaluatorNotificationDetail,
  useCoordinatorEvaluatorNotificationHistory,
  useCoordinatorEvaluatorNotificationHistorySummary,
  useCoordinatorEvaluatorNotificationRecipients,
  useSendCoordinatorEvaluatorNotification,
} from '@/lib/hooks/use-coordinator-evaluator-notifications'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import type {
  CoordinatorEvaluatorNotificationHistoryItem,
  CoordinatorEvaluatorNotificationRecipientItem,
  EmailStatus,
  EvaluationStage,
  EvaluatorNotificationDeliveryMethod,
  EvaluatorNotificationPriority,
  EvaluatorNotificationRecipientMode,
  EvaluatorRecipientOption,
  InAppStatus,
} from '@/types/coordinator-evaluator-notifications'

const NOTIFICATION_TEMPLATES = [
  {
    id: 'eval-submission-reminder',
    title: 'Evaluation Submission Reminder',
    icon: ClipboardCheck,
    description: 'Remind evaluators about pending evaluation submissions',
    subject: 'Reminder: Pending Evaluation Submission',
    message:
      'Dear Evaluator,\n\nThis is a reminder that you have pending evaluation submissions awaiting your attention. Please log in to the system and complete your evaluations at your earliest convenience.\n\nDeadline: [Date]\n\nThank you for your prompt attention to this matter.\n\nBest regards,\nAcademia Coordinator',
    priority: 'HIGH' as const,
    badge: 'Common',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-300',
  },
  {
    id: 'rubric-update',
    title: 'Rubric & Scoring Update',
    icon: FileText,
    description: 'Notify evaluators about rubric or scoring criteria changes',
    subject: 'Important: Updated Evaluation Rubric',
    message:
      'Dear Evaluator,\n\nPlease be informed that the evaluation rubric has been updated. Kindly review the new scoring criteria before proceeding with your pending evaluations.\n\nKey changes:\n- [Change 1]\n- [Change 2]\n\nFor questions, please contact the coordinator.\n\nBest regards,\nAcademia Coordinator',
    priority: 'INFO' as const,
    badge: 'Important',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-300',
  },
  {
    id: 'defense-schedule',
    title: 'Defense Schedule Notice',
    icon: Calendar,
    description: 'Inform evaluators of upcoming defense sessions',
    subject: 'Defense Schedule — Your Attendance Required',
    message:
      'Dear Evaluator,\n\nDefense schedules have been finalized. You have been assigned to evaluate the following projects. Please review the schedule and confirm your availability.\n\nDefense Period: [Date Range]\nVenue: [Location]\n\nKindly confirm your attendance by [Confirmation Deadline].\n\nBest regards,\nAcademia Coordinator',
    priority: 'HIGH' as const,
    badge: 'Seasonal',
    badgeColor: 'bg-violet-500/10 text-violet-600 border-violet-300',
  },
  {
    id: 'score-submission-deadline',
    title: 'Score Submission Deadline',
    icon: Star,
    description: 'Alert evaluators about score submission cut-offs',
    subject: 'IMPORTANT: Score Submission Deadline Approaching',
    message:
      'Dear Evaluator,\n\nThis is to notify you that the deadline for submitting your evaluation scores is approaching.\n\nSubmission Deadline: [Date]\n\nPlease ensure all evaluation forms are completed and submitted before the deadline. Late submissions may affect the grade finalization process.\n\nBest regards,\nAcademia Coordinator',
    priority: 'CRITICAL' as const,
    badge: 'Urgent',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-300',
  },
] as const

type EvaluatorRecipientFilter = 'all' | 'on_track' | 'has_pending' | 'no_tasks'
type HistoryStageFilter = 'ALL_STAGES' | EvaluationStage

interface EvaluatorRecipientMetric extends EvaluatorRecipientOption {
  status: Exclude<EvaluatorRecipientFilter, 'all'>
}

const priorityConfig: Record<
  EvaluatorNotificationPriority,
  { label: string; color: string; dot: string }
> = {
  INFO: {
    label: 'Info',
    color: 'bg-blue-500/10 text-blue-600 border-blue-300',
    dot: 'bg-blue-400',
  },
  HIGH: {
    label: 'High',
    color: 'bg-amber-500/10 text-amber-600 border-amber-300',
    dot: 'bg-amber-400',
  },
  CRITICAL: {
    label: 'Critical',
    color: 'bg-rose-500/10 text-rose-600 border-rose-300',
    dot: 'bg-rose-400',
  },
}

const inAppStatusConfig: Record<InAppStatus, string> = {
  NOT_REQUESTED: 'bg-muted text-muted-foreground border-border',
  DELIVERED: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
  FAILED: 'bg-rose-500/10 text-rose-700 border-rose-300',
}

const emailStatusConfig: Record<EmailStatus, string> = {
  NOT_REQUESTED: 'bg-muted text-muted-foreground border-border',
  QUEUED: 'bg-amber-500/10 text-amber-700 border-amber-300',
  ACCEPTED: 'bg-blue-500/10 text-blue-700 border-blue-300',
  DELIVERED: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
  FAILED: 'bg-rose-500/10 text-rose-700 border-rose-300',
}

function getEvaluatorStatus(recipient: EvaluatorRecipientOption): EvaluatorRecipientMetric['status'] {
  if (recipient.assignedProjectsCount === 0) {
    return 'no_tasks'
  }

  if (recipient.pendingEvaluationsCount > 0) {
    return 'has_pending'
  }

  return 'on_track'
}

function getRecipientModeLabel(recipientMode: EvaluatorNotificationRecipientMode) {
  if (recipientMode === 'ALL') return 'All Evaluators'
  if (recipientMode === 'SINGLE') return 'Single Evaluator'
  return 'Selected Evaluators'
}

function formatStage(stage: EvaluationStage) {
  return stage === 'CAPSTONE_II' ? 'Capstone II' : 'Capstone I'
}

function formatDateTime(value: string | null) {
  if (!value) return 'Not available'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  const response = (error as { response?: { status?: unknown } }).response
  return typeof response?.status === 'number' ? response.status : null
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
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

function mapSendError(error: unknown) {
  const status = getErrorStatus(error)
  const backendMessage = getErrorMessage(error, 'Failed to send notification campaign.')

  if (status === 400) {
    return {
      title: 'Invalid request',
      description: backendMessage || 'Please review required fields and recipient selection.',
    }
  }

  if (status === 403) {
    return {
      title: 'Permission denied',
      description: backendMessage || 'You are not allowed to notify these evaluators.',
    }
  }

  if (status === 404) {
    return {
      title: 'Endpoint unavailable',
      description: backendMessage || 'Evaluator notification endpoint was not found.',
    }
  }

  return {
    title: 'Send failed',
    description: backendMessage,
  }
}

function mapHistoryError(error: unknown) {
  const status = getErrorStatus(error)
  if (status === 403) {
    return 'You do not have permission to view evaluator notification history.'
  }
  if (status === 404) {
    return 'Evaluator notification history endpoint was not found.'
  }
  return getErrorMessage(error, 'Failed to load evaluator notification history.')
}

function getCampaignStatus(campaign: CoordinatorEvaluatorNotificationHistoryItem) {
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

function getRecipientDisplayCount(campaign: CoordinatorEvaluatorNotificationHistoryItem) {
  return campaign.requestedRecipientsCount || campaign.totalReachedCount
}

function getBadgeClassForInAppStatus(status: InAppStatus) {
  return inAppStatusConfig[status] ?? inAppStatusConfig.NOT_REQUESTED
}

function getBadgeClassForEmailStatus(status: EmailStatus) {
  return emailStatusConfig[status] ?? emailStatusConfig.NOT_REQUESTED
}

function getCreatedByName(recipient: { firstName: string; lastName: string } | null) {
  if (!recipient) return 'Coordinator'
  return `${recipient.firstName} ${recipient.lastName}`.trim()
}

export default function NotifyEvaluatorsPage() {
  const user = useAuthStore((state) => state.user)
  const canQueryCoordinatorData = Boolean(user)

  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose')
  const [selectedStage, setSelectedStage] = useState<EvaluationStage>('CAPSTONE_I')
  const [recipientMode, setRecipientMode] = useState<EvaluatorNotificationRecipientMode>('MULTIPLE')
  const [selectedEvaluators, setSelectedEvaluators] = useState<string[]>([])
  const [manualSelectAll, setManualSelectAll] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<EvaluatorNotificationPriority>('HIGH')
  const [deliveryMethod, setDeliveryMethod] = useState<EvaluatorNotificationDeliveryMethod>('BOTH')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [recipientFilter, setRecipientFilter] = useState<EvaluatorRecipientFilter>('all')
  const [recipientSearch, setRecipientSearch] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historySearch, setHistorySearch] = useState('')
  const [historyPriorityFilter, setHistoryPriorityFilter] =
    useState<'ALL' | EvaluatorNotificationPriority>('ALL')
  const [historyDeliveryFilter, setHistoryDeliveryFilter] =
    useState<'ALL' | EvaluatorNotificationDeliveryMethod>('ALL')
  const [historyStageFilter, setHistoryStageFilter] = useState<HistoryStageFilter>('ALL_STAGES')
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const historyPageSize = 5

  const recipientsQuery = useCoordinatorEvaluatorNotificationRecipients(
    {
      stage: selectedStage,
      page: 1,
      limit: 100,
      search: recipientSearch.trim() || undefined,
    },
    canQueryCoordinatorData
  )
  const historySummaryQuery = useCoordinatorEvaluatorNotificationHistorySummary(
    historyStageFilter === 'ALL_STAGES' ? undefined : historyStageFilter,
    canQueryCoordinatorData
  )
  const historyQuery = useCoordinatorEvaluatorNotificationHistory(
    {
      page: historyPage,
      limit: historyPageSize,
      stage: historyStageFilter === 'ALL_STAGES' ? undefined : historyStageFilter,
      priority: historyPriorityFilter === 'ALL' ? undefined : historyPriorityFilter,
      deliveryMethod: historyDeliveryFilter === 'ALL' ? undefined : historyDeliveryFilter,
      search: historySearch.trim() || undefined,
    },
    canQueryCoordinatorData
  )
  const detailQuery = useCoordinatorEvaluatorNotificationDetail(
    selectedCampaignId ?? undefined,
    canQueryCoordinatorData && isDetailOpen,
    isDetailOpen ? 15_000 : false
  )
  const sendNotificationMutation = useSendCoordinatorEvaluatorNotification()

  const recipients = useMemo<EvaluatorRecipientMetric[]>(() => {
    return (recipientsQuery.data?.items ?? []).map((recipient) => ({
      ...recipient,
      status: getEvaluatorStatus(recipient),
    }))
  }, [recipientsQuery.data?.items])

  const filteredRecipients = useMemo(() => {
    if (recipientFilter === 'all') {
      return recipients
    }

    return recipients.filter((recipient) => recipient.status === recipientFilter)
  }, [recipientFilter, recipients])

  const historyItems = historyQuery.data?.items ?? []
  const historySummary = historySummaryQuery.data
  const historyError = historyQuery.error ?? historySummaryQuery.error
  const historyErrorMessage = historyError ? mapHistoryError(historyError) : null
  const isHistoryLoading = historyQuery.isLoading || historySummaryQuery.isLoading
  const totalEligibleEvaluators = recipientsQuery.data?.summary.totalEligibleEvaluators ?? 0
  const recipientCount = recipientMode === 'ALL' ? totalEligibleEvaluators : selectedEvaluators.length
  const recipientLoadError = recipientsQuery.error
    ? getErrorMessage(recipientsQuery.error, 'Failed to load evaluators.')
    : null

  const summaryCards = useMemo(() => {
    if (historySummary && (historySummary.totalSent > 0 || historySummary.totalReached > 0)) {
      return {
        totalSent: historySummary.totalSent,
        delivered: historySummary.delivered,
        totalReached: historySummary.totalReached,
      }
    }

    return {
      totalSent: historyItems.length,
      delivered: historyItems.filter((item) => getCampaignStatus(item) === 'delivered').length,
      totalReached: historyItems.reduce((sum, item) => sum + item.totalReachedCount, 0),
    }
  }, [historyItems, historySummary])

  useEffect(() => {
    setSelectedEvaluators([])
    setManualSelectAll(false)
  }, [selectedStage, recipientSearch, recipientFilter])

  useEffect(() => {
    if (recipientMode === 'ALL') {
      if (selectedEvaluators.length > 0) {
        setSelectedEvaluators([])
      }
      if (manualSelectAll) {
        setManualSelectAll(false)
      }
      return
    }

    if (recipientMode === 'SINGLE' && selectedEvaluators.length > 1) {
      setSelectedEvaluators(selectedEvaluators.slice(0, 1))
      if (manualSelectAll) {
        setManualSelectAll(false)
      }
    }
  }, [manualSelectAll, recipientMode, selectedEvaluators])

  useEffect(() => {
    setHistoryPage(1)
  }, [historySearch, historyPriorityFilter, historyDeliveryFilter, historyStageFilter])

  const handleSelectAllVisible = (checked: boolean) => {
    setManualSelectAll(checked)

    if (!checked) {
      setSelectedEvaluators([])
      return
    }

    setSelectedEvaluators(filteredRecipients.map((recipient) => recipient.evaluatorUserId))
  }

  const handleSelectEvaluator = (id: string, checked: boolean) => {
    setSelectedEvaluators((current) => {
      if (!checked) {
        return current.filter((value) => value !== id)
      }

      if (recipientMode === 'SINGLE') {
        return [id]
      }

      if (current.includes(id)) {
        return current
      }

      return [...current, id]
    })

    if (manualSelectAll) {
      setManualSelectAll(false)
    }
  }

  const handleUseTemplate = (template: (typeof NOTIFICATION_TEMPLATES)[number]) => {
    setSubject(template.subject)
    setMessage(template.message)
    setPriority(template.priority)
    toast.success('Template applied', { description: template.title })
  }

  const handleOpenDetail = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    setIsDetailOpen(true)
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

    if (recipientCount === 0) {
      toast.error('Select at least one evaluator')
      return
    }

    setIsSending(true)

    try {
      const result = await sendNotificationMutation.mutateAsync({
        recipientMode,
        evaluatorUserIds: recipientMode === 'ALL' ? undefined : selectedEvaluators,
        stage: selectedStage,
        priority,
        deliveryMethod,
        subject: subject.trim(),
        message: message.trim(),
      })

      setSent(true)
      toast.success('Notification sent', {
        description: `Campaign created for ${recipientCount} evaluator${recipientCount !== 1 ? 's' : ''}.`,
      })

      setTimeout(() => setSent(false), 3000)
      setSubject('')
      setMessage('')
      setSelectedEvaluators([])
      setManualSelectAll(false)
      setPriority('HIGH')
      setDeliveryMethod('BOTH')
      setRecipientMode('MULTIPLE')
      setActiveTab('history')
      handleOpenDetail(result.campaignId)
    } catch (error) {
      const mapped = mapSendError(error)
      toast.error(mapped.title, { description: mapped.description })
    } finally {
      setIsSending(false)
    }
  }

  const historyTotal = historyQuery.data?.pagination.total ?? historyItems.length
  const historyPages = Math.max(1, historyQuery.data?.pagination.pages ?? 1)
  const detail = detailQuery.data
  const detailErrorMessage = detailQuery.error
    ? getErrorMessage(detailQuery.error, 'Failed to load notification detail.')
    : null

  return (
    <>
      <div className="space-y-6 pb-8 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/coordinator">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-2xl font-bold font-display tracking-tight text-transparent">
                Notify Evaluators
              </h1>
              <p className="text-sm text-muted-foreground">
                Send notifications and announcements to project evaluators
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
            <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">{totalEligibleEvaluators} evaluators</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{summaryCards.totalSent} sent</span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'compose' | 'history')} className="space-y-4">
          <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="compose" className="gap-2 shrink-0">
              <Send className="h-4 w-4" /> Compose
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 shrink-0">
              <Clock className="h-4 w-4" /> History
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {historyTotal}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base font-display">Recipients</CardTitle>
                      <Select value={recipientFilter} onValueChange={(value) => setRecipientFilter(value as EvaluatorRecipientFilter)}>
                        <SelectTrigger className="h-7 w-36 text-xs">
                          <Filter className="mr-1 h-3 w-3" />
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
                  <CardContent className="space-y-3 p-3 pt-0">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Evaluation Stage
                        </Label>
                        <Select value={selectedStage} onValueChange={(value) => setSelectedStage(value as EvaluationStage)}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CAPSTONE_I">Capstone I</SelectItem>
                            <SelectItem value="CAPSTONE_II">Capstone II</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Recipient Mode
                        </Label>
                        <Select
                          value={recipientMode}
                          onValueChange={(value) => setRecipientMode(value as EvaluatorNotificationRecipientMode)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SINGLE">Single</SelectItem>
                            <SelectItem value="MULTIPLE">Multiple</SelectItem>
                            <SelectItem value="ALL">All eligible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Search Evaluators
                      </Label>
                      <Input
                        value={recipientSearch}
                        onChange={(event) => setRecipientSearch(event.target.value)}
                        placeholder="Search by name or email..."
                        className="h-9"
                      />
                    </div>

                    {recipientMode === 'ALL' ? (
                      <div className="rounded-lg border-2 border-amber-500/30 bg-amber-500/5 px-3 py-3">
                        <div className="flex items-start gap-3">
                          <Users className="mt-0.5 h-4 w-4 text-amber-600" />
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">All eligible evaluators will be targeted</p>
                            <p className="text-xs text-muted-foreground">
                              {recipientsQuery.isLoading
                                ? 'Loading eligible evaluator count...'
                                : `${totalEligibleEvaluators} evaluator${totalEligibleEvaluators !== 1 ? 's' : ''} in ${formatStage(selectedStage)}.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {recipientMode === 'MULTIPLE' && filteredRecipients.length > 0 && (
                          <div className="flex items-center gap-3 rounded-lg border-2 border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
                            <Checkbox
                              id="select-visible-evals"
                              checked={manualSelectAll}
                              onCheckedChange={(value) => handleSelectAllVisible(Boolean(value))}
                            />
                            <label htmlFor="select-visible-evals" className="flex-1 cursor-pointer">
                              <p className="text-sm font-semibold">Select All Visible Evaluators</p>
                              <p className="text-xs text-muted-foreground">
                                {filteredRecipients.length} visible in current filter
                              </p>
                            </label>
                            <Badge className="border-amber-300 bg-amber-500/10 text-xs text-amber-600">
                              Multiple
                            </Badge>
                          </div>
                        )}

                        <Separator />

                        <div className="space-y-1 pt-1">
                          {recipientLoadError && (
                            <div className="rounded-lg border border-destructive/20 px-3 py-4 text-sm text-destructive">
                              {recipientLoadError}
                            </div>
                          )}

                          {recipientsQuery.isLoading && !recipientLoadError && (
                            <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                              Loading evaluators...
                            </div>
                          )}

                          {!recipientsQuery.isLoading && !recipientLoadError && filteredRecipients.length === 0 && (
                            <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                              No evaluators found for the selected stage and filters.
                            </div>
                          )}

                          {filteredRecipients.map((recipient) => {
                            const checked = selectedEvaluators.includes(recipient.evaluatorUserId)

                            return (
                              <div
                                key={recipient.evaluatorUserId}
                                className={cn(
                                  'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                                  checked
                                    ? 'border-amber-500/20 bg-amber-500/5'
                                    : 'border-transparent hover:bg-muted/50'
                                )}
                                onClick={() => handleSelectEvaluator(recipient.evaluatorUserId, !checked)}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) =>
                                    handleSelectEvaluator(recipient.evaluatorUserId, Boolean(value))
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                />
                                <div className="relative shrink-0">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={recipient.avatarUrl ?? undefined} alt={recipient.fullName} />
                                    <AvatarFallback className="bg-amber-500/10 text-xs font-semibold text-amber-600">
                                      {recipient.fullName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-background">
                                    <Star className="h-2 w-2 fill-amber-500 text-amber-500" />
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{recipient.fullName}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {recipient.assignedProjectsCount} assigned · {recipient.pendingEvaluationsCount} pending
                                  </p>
                                </div>
                                <div
                                  className={cn(
                                    'h-2 w-2 shrink-0 rounded-full',
                                    recipient.status === 'on_track'
                                      ? 'bg-emerald-400'
                                      : recipient.status === 'has_pending'
                                        ? 'bg-amber-400'
                                        : 'bg-muted-foreground'
                                  )}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {recipientCount > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {recipientCount} evaluator{recipientCount !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4 lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-display">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Quick Templates
                    </CardTitle>
                    <CardDescription>Pre-written messages for common evaluator notifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {NOTIFICATION_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleUseTemplate(template)}
                          className="group flex items-start gap-3 rounded-xl border p-3 text-left transition-all hover:border-amber-500/40 hover:bg-amber-500/5 hover:shadow-sm"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 transition-transform group-hover:scale-110">
                            <template.icon className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex items-center gap-2">
                              <p className="truncate text-sm font-semibold">{template.title}</p>
                              <Badge className={`shrink-0 px-1.5 py-0 text-xs ${template.badgeColor}`}>
                                {template.badge}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-display">
                      <Mail className="h-4 w-4 text-amber-500" />
                      Compose Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Priority Level
                        </Label>
                        <Select value={priority} onValueChange={(value) => setPriority(value as EvaluatorNotificationPriority)}>
                          <SelectTrigger className="h-9">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${priorityConfig[priority].dot}`} />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INFO">Info</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Delivery Channel
                        </Label>
                        <Select
                          value={deliveryMethod}
                          onValueChange={(value) => setDeliveryMethod(value as EvaluatorNotificationDeliveryMethod)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IN_APP">
                              <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4" /> In-App Only
                              </div>
                            </SelectItem>
                            <SelectItem value="EMAIL">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" /> Email Only
                              </div>
                            </SelectItem>
                            <SelectItem value="BOTH">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" /> Email + In-App
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ev-subject" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Subject Line
                      </Label>
                      <Input
                        id="ev-subject"
                        placeholder="Enter notification subject..."
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        maxLength={255}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ev-message" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Message Body
                      </Label>
                      <Textarea
                        id="ev-message"
                        placeholder="Write your notification message here... Use [Date], [Name], or [Location] as placeholders."
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        rows={8}
                        maxLength={5000}
                        className="resize-none text-sm"
                      />
                      <p className="text-right text-xs text-muted-foreground">{message.length} characters</p>
                    </div>

                    {(subject || message) && (
                      <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
                        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5" /> Preview
                        </p>
                        {subject && <p className="text-sm font-semibold">{subject}</p>}
                        {message && (
                          <p className="line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{message}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Badge className={`text-xs ${priorityConfig[priority].color}`}>
                            {priorityConfig[priority].label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatStage(selectedStage)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {deliveryMethod}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            To: {recipientCount > 0 ? `${recipientCount} evaluator${recipientCount !== 1 ? 's' : ''}` : 'None selected'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        {recipientCount > 0
                          ? `Ready to send to ${recipientCount} evaluator${recipientCount !== 1 ? 's' : ''}`
                          : 'Select recipients to continue'}
                      </p>
                      <Button
                        className={`btn-gradient min-w-[160px] gap-2 ${sent ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                        onClick={handleSend}
                        disabled={
                          isSending ||
                          sendNotificationMutation.isPending ||
                          recipientCount === 0 ||
                          !subject.trim() ||
                          !message.trim()
                        }
                      >
                        {isSending || sendNotificationMutation.isPending ? (
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

          <TabsContent value="history" className="space-y-4">
            <div className="mb-2 grid grid-cols-3 gap-4">
              {[
                {
                  label: 'Total Sent',
                  value: summaryCards.totalSent,
                  icon: Send,
                  color: 'text-blue-500',
                  bg: 'bg-blue-500/10',
                },
                {
                  label: 'Delivered',
                  value: summaryCards.delivered,
                  icon: CheckCircle2,
                  color: 'text-emerald-500',
                  bg: 'bg-emerald-500/10',
                },
                {
                  label: 'Reached',
                  value: summaryCards.totalReached,
                  icon: Users,
                  color: 'text-violet-500',
                  bg: 'bg-violet-500/10',
                },
              ].map((stat) => (
                <Card key={stat.label} className="border-none shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-start gap-2 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-5">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${stat.bg}`}>
                      <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold tracking-tight sm:text-2xl">{stat.value}</p>
                      <p className="truncate text-[10px] text-muted-foreground sm:text-xs">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="Search history by subject or message..."
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                className="h-10 flex-1"
              />

              <Select value={historyStageFilter} onValueChange={(value) => setHistoryStageFilter(value as HistoryStageFilter)}>
                <SelectTrigger className="h-10 w-full shrink-0 sm:w-40">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_STAGES">All Stages</SelectItem>
                  <SelectItem value="CAPSTONE_I">Capstone I</SelectItem>
                  <SelectItem value="CAPSTONE_II">Capstone II</SelectItem>
                </SelectContent>
              </Select>

              <Select value={historyPriorityFilter} onValueChange={(value) => setHistoryPriorityFilter(value as 'ALL' | EvaluatorNotificationPriority)}>
                <SelectTrigger className="h-10 w-full shrink-0 sm:w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priority</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={historyDeliveryFilter}
                onValueChange={(value) => setHistoryDeliveryFilter(value as 'ALL' | EvaluatorNotificationDeliveryMethod)}
              >
                <SelectTrigger className="h-10 w-full shrink-0 sm:w-44">
                  <SelectValue placeholder="Delivery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Delivery</SelectItem>
                  <SelectItem value="IN_APP">In-App</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>

              {(historySearch || historyStageFilter !== 'ALL_STAGES' || historyPriorityFilter !== 'ALL' || historyDeliveryFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 shrink-0 text-xs"
                  onClick={() => {
                    setHistorySearch('')
                    setHistoryStageFilter('ALL_STAGES')
                    setHistoryPriorityFilter('ALL')
                    setHistoryDeliveryFilter('ALL')
                  }}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Clear
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
                    <div key={log.id} className="rounded-xl border p-4 transition-colors hover:bg-muted/30">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                            campaignStatus === 'delivered'
                              ? 'bg-emerald-500/10'
                              : campaignStatus === 'pending'
                                ? 'bg-amber-500/10'
                                : 'bg-rose-500/10'
                          )}
                        >
                          {campaignStatus === 'delivered' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : campaignStatus === 'pending' ? (
                            <Clock className="h-5 w-5 text-amber-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-start gap-2">
                            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{log.subject}</p>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <Badge className={`text-xs ${priorityConfig[log.priority].color}`}>
                                {priorityConfig[log.priority].label}
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">
                                {campaignStatus}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-500" />
                              {getRecipientDisplayCount(log)} evaluator{getRecipientDisplayCount(log) !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" /> {getRecipientModeLabel(log.recipientMode)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                                {formatStage(log.stage)}
                              </Badge>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {formatDateTime(log.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {log.deliveryMethod}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">
                              In-App {log.inAppDeliveredCount}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Email Accepted {log.emailAcceptedCount}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Email Delivered {log.emailDeliveredCount}
                            </Badge>
                            {log.emailFailedCount > 0 && (
                              <Badge className="border-rose-300 bg-rose-500/10 text-xs text-rose-600">
                                Email Failed {log.emailFailedCount}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => handleOpenDetail(log.id)}>
                          <Eye className="h-3.5 w-3.5" /> View details
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {historyPages > 1 && (
              <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Page <span className="font-semibold text-foreground">{historyQuery.data?.pagination.page ?? historyPage}</span> of {historyPages}
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
                    disabled={historyPage >= historyPages || historyQuery.isFetching}
                    onClick={() => setHistoryPage((current) => Math.min(historyPages, current + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Notification Campaign Detail</SheetTitle>
            <SheetDescription>
              Per-recipient delivery results for the selected evaluator notification campaign.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-6">
            {detailQuery.isLoading && (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Loading campaign detail...
              </div>
            )}

            {detailErrorMessage && (
              <div className="rounded-xl border border-destructive/20 p-4 text-sm text-destructive">
                {detailErrorMessage}
              </div>
            )}

            {detail && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base">{detail.subject}</CardTitle>
                        <CardDescription>
                          {formatStage(detail.stage)} · {getRecipientModeLabel(detail.recipientMode)}
                        </CardDescription>
                      </div>
                      <Badge className={`text-xs ${priorityConfig[detail.priority].color}`}>
                        {priorityConfig[detail.priority].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Delivery Method</p>
                        <p className="mt-1">{detail.deliveryMethod}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created At</p>
                        <p className="mt-1">{formatDateTime(detail.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created By</p>
                        <p className="mt-1">{getCreatedByName(detail.createdBy)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Requested Recipients</p>
                        <p className="mt-1">{detail.requestedRecipientsCount}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Message</p>
                      <p className="whitespace-pre-line text-sm text-muted-foreground">
                        {detail.message || 'No message body was returned.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Total Reached', value: detail.totalReachedCount },
                    { label: 'In-App Delivered', value: detail.inAppDeliveredCount },
                    { label: 'Email Accepted', value: detail.emailAcceptedCount },
                    { label: 'Email Failed', value: detail.emailFailedCount },
                  ].map((item) => (
                    <Card key={item.label}>
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                        <p className="mt-2 text-2xl font-bold tracking-tight">{item.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-display">Recipient Outcomes</CardTitle>
                    <CardDescription>
                      Delivery and read states for each targeted evaluator.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detail.recipients.length === 0 && (
                      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                        No recipient rows were returned for this campaign.
                      </div>
                    )}

                    {detail.recipients.map((recipient: CoordinatorEvaluatorNotificationRecipientItem) => (
                      <div key={recipient.evaluatorUserId} className="rounded-xl border p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{recipient.fullName}</p>
                            <p className="truncate text-xs text-muted-foreground">{recipient.email}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge className={`text-xs ${getBadgeClassForInAppStatus(recipient.inAppStatus)}`}>
                                In-App: {recipient.inAppStatus}
                              </Badge>
                              <Badge className={`text-xs ${getBadgeClassForEmailStatus(recipient.emailStatus)}`}>
                                Email: {recipient.emailStatus}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-muted-foreground sm:text-right">
                            <p>
                              Read At: <span className="text-foreground">{formatDateTime(recipient.readAt)}</span>
                            </p>
                            {recipient.emailFailureReason && (
                              <p>
                                Failure: <span className="text-rose-600">{recipient.emailFailureReason}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
