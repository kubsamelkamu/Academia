"use client"

import React, { useState, useMemo } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Star,
  Users,
  ClipboardCheck,
  AlertTriangle,
  Target,
  Send,
  BarChart3,
  Eye,
  MessageSquare,
  Activity,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { mockUsers, mockProjects, mockEvaluations } from '@/data/mockData'

interface EvaluatorMetrics {
  id: string
  name: string
  email: string
  assignedProjects: number
  submittedEvals: number
  pendingEvals: number
  reviewedEvals: number
  avgScore: number
  completionRate: number
  lastActivity: string
  performance: 'excellent' | 'good' | 'needs_attention' | 'no_activity'
}

const MOCK_EVAL_DETAILS: Record<string, { projectTitle: string; score: number | null; status: string; submittedAt: string | null }[]> = {
  u6: [
    { projectTitle: 'AI-Driven Academic Assistant', score: null, status: 'pending', submittedAt: null },
    { projectTitle: 'Real-Time Campus Analytics', score: 85, status: 'submitted', submittedAt: '2024-01-28' },
    { projectTitle: 'Secure Research Data Platform', score: null, status: 'in_progress', submittedAt: null },
    { projectTitle: 'Smart Campus Navigation', score: 89, status: 'reviewed', submittedAt: '2024-01-18' },
  ],
}

const perfConfig = {
  excellent:     { label: 'Excellent',     color: 'bg-emerald-500/10 text-emerald-600 border-emerald-300', dot: 'bg-emerald-500' },
  good:          { label: 'Good',          color: 'bg-blue-500/10 text-blue-600 border-blue-300',         dot: 'bg-blue-500' },
  needs_attention:{ label: 'Needs Attention', color: 'bg-amber-500/10 text-amber-600 border-amber-300',   dot: 'bg-amber-500' },
  no_activity:   { label: 'No Activity',   color: 'bg-muted text-muted-foreground border-muted',          dot: 'bg-muted-foreground' },
}

export default function EvaluatorProgressPage() {
  const [feedbackEvaluator, setFeedbackEvaluator] = useState<EvaluatorMetrics | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const allEvaluators = mockUsers.filter(u => u.role === 'evaluator')

  const evaluatorMetrics: EvaluatorMetrics[] = useMemo(() => allEvaluators.map(ev => {
    const assigned = mockProjects.filter(p => (p.evaluatorIds ?? []).includes(ev.id))
    const evEvals = mockEvaluations.filter(e => e.evaluatorId === ev.id)
    const submitted = evEvals.filter(e => e.status === 'submitted').length
    const reviewed  = evEvals.filter(e => e.status === 'reviewed').length
    const pending   = evEvals.filter(e => e.status === 'pending').length

    const scoredEvals = evEvals.filter(e => e.score != null)
    const avgScore = scoredEvals.length > 0
      ? Math.round(scoredEvals.reduce((s, e) => s + (e.score ?? 0), 0) / scoredEvals.length)
      : 0

    const completionRate = assigned.length > 0
      ? Math.round(((submitted + reviewed) / assigned.length) * 100)
      : 0

    let performance: EvaluatorMetrics['performance'] = 'no_activity'
    if (assigned.length > 0) {
      if (completionRate >= 75 && pending === 0) performance = 'excellent'
      else if (completionRate >= 40) performance = 'good'
      else performance = 'needs_attention'
    }

    return {
      id: ev.id,
      name: ev.name,
      email: ev.email,
      assignedProjects: assigned.length,
      submittedEvals: submitted,
      pendingEvals: pending,
      reviewedEvals: reviewed,
      avgScore,
      completionRate,
      lastActivity: submitted + reviewed > 0 ? '2 days ago' : 'No activity yet',
      performance,
    }
  }), [allEvaluators])

  const handleSendFeedback = () => {
    if (!feedbackEvaluator || !feedbackText.trim()) return
    toast.success('Feedback Sent', { description: `Feedback sent to ${feedbackEvaluator.name}` })
    setFeedbackEvaluator(null)
    setFeedbackText('')
  }

  const handleSendReminder = (ev: EvaluatorMetrics) => {
    toast.success('Reminder Sent', { description: `Reminder sent to ${ev.name} about pending evaluations` })
  }

  const totalAssigned  = evaluatorMetrics.reduce((s, e) => s + e.assignedProjects, 0)
  const totalSubmitted = evaluatorMetrics.reduce((s, e) => s + e.submittedEvals + e.reviewedEvals, 0)
  const totalPending   = evaluatorMetrics.reduce((s, e) => s + e.pendingEvals, 0)
  const overallRate    = totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 0

  const summaryStats = [
    { label: 'Total Evaluators', value: allEvaluators.length, icon: Users,         color: 'text-primary',        bg: 'bg-primary/10' },
    { label: 'Overall Completion', value: `${overallRate}%`,  icon: TrendingUp,     color: 'text-emerald-500',    bg: 'bg-emerald-500/10' },
    { label: 'Pending Evaluations', value: totalPending,      icon: AlertTriangle,  color: 'text-amber-500',      bg: 'bg-amber-500/10' },
    { label: 'Excellent Performers', value: evaluatorMetrics.filter(e => e.performance === 'excellent').length, icon: Award, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  ]

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <PageHeader
        title="Evaluator Progress & Analytics"
        description="Monitor evaluation submission status, performance, and provide feedback"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map(s => (
          <div key={s.label} className="group relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{s.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-2xl ${s.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Completion Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Department Evaluation Completion</p>
            <span className="text-sm font-bold text-primary">{overallRate}%</span>
          </div>
          <Progress value={overallRate} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{totalSubmitted} submitted / {totalAssigned} total</span>
            <span>{totalPending} pending</span>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="overview" className="gap-2 shrink-0">
            <Activity className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2 shrink-0">
            <BarChart3 className="h-4 w-4" /> Performance
          </TabsTrigger>
          <TabsTrigger value="communication" className="gap-2 shrink-0">
            <MessageSquare className="h-4 w-4" /> Communication
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-3">
          {evaluatorMetrics.map(ev => {
            const pc = perfConfig[ev.performance]
            const details = MOCK_EVAL_DETAILS[ev.id] ?? []
            return (
              <Card key={ev.id} className="group transition-all hover:shadow-md hover:border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar with star badge */}
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold text-base">
                          {ev.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border-2 border-border flex items-center justify-center">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold">{ev.name}</p>
                          <p className="text-xs text-muted-foreground">{ev.email}</p>
                        </div>
                        <Badge className={`text-xs ${pc.color}`}>{pc.label}</Badge>
                      </div>

                      {/* Stat pills */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[
                          { label: 'Assigned', value: ev.assignedProjects, color: 'bg-primary/10 text-primary' },
                          { label: 'Submitted', value: ev.submittedEvals + ev.reviewedEvals, color: 'bg-emerald-500/10 text-emerald-600' },
                          { label: 'Pending', value: ev.pendingEvals, color: ev.pendingEvals > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground' },
                          { label: 'Avg Score', value: ev.avgScore > 0 ? `${ev.avgScore}%` : '—', color: 'bg-violet-500/10 text-violet-600' },
                        ].map(pill => (
                          <div key={pill.label} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${pill.color}`}>
                            {pill.value} <span className="opacity-70">{pill.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Completion bar */}
                      <div className="mb-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Completion rate</span>
                          <span className="font-medium">{ev.completionRate}%</span>
                        </div>
                        <Progress value={ev.completionRate} className="h-1.5" />
                      </div>

                      {/* Per-evaluation list */}
                      {details.length > 0 && (
                        <div className="grid gap-1.5 sm:grid-cols-2 mb-3">
                          {details.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs">
                              <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${d.status === 'reviewed' ? 'bg-emerald-500' : d.status === 'submitted' ? 'bg-violet-500' : d.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                              <span className="truncate flex-1">{d.projectTitle}</span>
                              {d.score != null && <span className="font-bold text-violet-600 shrink-0">{d.score}%</span>}
                              {d.score == null && <span className="text-muted-foreground capitalize shrink-0">{d.status.replace('_', ' ')}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                          onClick={() => { setFeedbackEvaluator(ev); setFeedbackText('') }}
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Feedback
                        </Button>
                        <Button
                          variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                          disabled={ev.pendingEvals === 0}
                          onClick={() => handleSendReminder(ev)}
                        >
                          <Send className="h-3.5 w-3.5" /> Remind
                        </Button>
                        <Link href="/dashboard/coordinator/evaluator-progress">
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                            <Eye className="h-3.5 w-3.5" /> Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* Performance Analysis */}
        <TabsContent value="performance">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Performance Distribution</CardTitle>
                <CardDescription>Evaluator performance breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(['excellent', 'good', 'needs_attention', 'no_activity'] as const).map(p => {
                  const count = evaluatorMetrics.filter(e => e.performance === p).length
                  const pct = evaluatorMetrics.length > 0 ? Math.round((count / evaluatorMetrics.length) * 100) : 0
                  const pc = perfConfig[p]
                  return (
                    <div key={p} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${pc.dot}`} />
                          <span className="capitalize">{pc.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">{count} evaluator{count !== 1 ? 's' : ''}</span>
                          <Badge variant="outline" className="text-xs">{pct}%</Badge>
                        </div>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Evaluation Insights</CardTitle>
                <CardDescription>Key submission metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Highest Completion', value: `${Math.max(...evaluatorMetrics.map(e => e.completionRate), 0)}%` },
                  { label: 'Lowest Completion', value: `${Math.min(...evaluatorMetrics.map(e => e.completionRate), 0)}%` },
                  { label: 'Avg Score (all evals)', value: evaluatorMetrics.filter(e => e.avgScore > 0).length > 0 ? `${Math.round(evaluatorMetrics.filter(e => e.avgScore > 0).reduce((s, e) => s + e.avgScore, 0) / evaluatorMetrics.filter(e => e.avgScore > 0).length)}%` : '—' },
                  { label: 'Total Evaluations Done', value: totalSubmitted },
                  { label: 'Still Pending', value: totalPending },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="font-bold text-sm">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Communication */}
        <TabsContent value="communication">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: MessageSquare, label: 'Send Feedback', desc: 'Provide individual feedback', color: 'text-primary', bg: 'bg-primary/10', href: null, action: () => evaluatorMetrics[0] && setFeedbackEvaluator(evaluatorMetrics[0]) },
              { icon: Send, label: 'Notify All Evaluators', desc: 'Broadcast a notification', color: 'text-fuchsia-600', bg: 'bg-fuchsia-500/10', href: '/dashboard/coordinator/notify-evaluators', action: null },
              { icon: BarChart3, label: 'Full Analytics', desc: 'Deep-dive performance data', color: 'text-emerald-600', bg: 'bg-emerald-500/10', href: '/dashboard/coordinator/evaluator-progress', action: null },
            ].map(item => (
              item.href ? (
                <Link key={item.label} href={item.href}>
                  <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/30">
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-center gap-4">
                        <div className={`h-11 w-11 rounded-xl ${item.bg} flex items-center justify-center`}>
                          <item.icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  className="w-full text-left"
                  onClick={item.action ?? undefined}
                  aria-label={item.label}
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/30">
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-center gap-4">
                        <div className={`h-11 w-11 rounded-xl ${item.bg} flex items-center justify-center`}>
                          <item.icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              )
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Feedback Dialog */}
      <Dialog open={!!feedbackEvaluator} onOpenChange={open => !open && setFeedbackEvaluator(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>Provide constructive feedback to {feedbackEvaluator?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="feedback">Message</Label>
              <Textarea
                id="feedback"
                placeholder="Enter your feedback..."
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                className="mt-1.5"
                rows={4}
              />
            </div>
            <Button className="w-full btn-gradient" onClick={handleSendFeedback} disabled={!feedbackText.trim()}>
              Send Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
