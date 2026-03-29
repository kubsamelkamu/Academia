"use client"

import React, { useState, useMemo } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { Column } from '@/components/shared/DataTable'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Send,
  MessageSquare,
  BarChart3,
  Clock,
  Eye,
  Target
} from 'lucide-react'
import Link from "next/link"
import { mockUsers, mockProjects, mockEvaluations } from '@/data/mockData'
import { useToast } from '@/hooks/use-toast'

interface AdvisorMetrics {
  id: string
  name: string
  email: string
  totalProjects: number
  activeProjects: number
  completedProjects: number
  avgProgress: number
  pendingEvaluations: number
  overdueTasks: number
  lastActivity: string
  performance: 'excellent' | 'good' | 'needs_attention'
}

export default function AdvisorProgressPage() {
  const { toast } = useToast()
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorMetrics | null>(null)
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const advisors = mockUsers.filter(u => u.role === 'advisor')

  const advisorMetrics: AdvisorMetrics[] = useMemo(() => {
    return advisors.map(advisor => {
      const advisorProjects = mockProjects.filter(p => p.advisorId === advisor.id)
      const activeProjects = advisorProjects.filter(p => p.status === 'in_progress')
      const completedProjects = advisorProjects.filter(p => p.status === 'completed')
      const avgProgress = advisorProjects.length > 0
        ? Math.round(advisorProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / advisorProjects.length)
        : 0

      const pendingEvaluations = mockEvaluations.filter(e =>
        advisorProjects.some(p => p.id === e.projectId) && e.status === 'pending'
      ).length

      // Calculate overdue tasks (simplified logic)
      const overdueTasks = advisorProjects.filter(p =>
        p.status === 'in_progress' && (p.progress || 0) < 50
      ).length

      // Determine performance based on metrics
      let performance: AdvisorMetrics['performance'] = 'good'
      if (avgProgress >= 80 && overdueTasks === 0) performance = 'excellent'
      else if (avgProgress < 50 || overdueTasks > 2) performance = 'needs_attention'

      return {
        id: advisor.id,
        name: advisor.name,
        email: advisor.email,
        totalProjects: advisorProjects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        avgProgress,
        pendingEvaluations,
        overdueTasks,
        lastActivity: '2 days ago', // Mock data
        performance
      }
    })
  }, [advisors])

  const handleSendFeedback = () => {
    if (!selectedAdvisor || !feedbackText.trim()) return

    toast("Feedback Sent", {
      description: `Feedback sent to ${selectedAdvisor.name}`,
    })

    setFeedbackDialogOpen(false)
    setFeedbackText('')
    setSelectedAdvisor(null)
  }

  const handleSendReminder = (advisor: AdvisorMetrics) => {
    toast("Reminder Sent", {
      description: `Reminder sent to ${advisor.name} about pending evaluations`,
    })
  }

  const getPerformanceColor = (performance: AdvisorMetrics['performance']) => {
    switch (performance) {
      case 'excellent': return 'text-success'
      case 'good': return 'text-primary'
      case 'needs_attention': return 'text-destructive'
      default: return 'text-muted-foreground'
    }
  }

  const getPerformanceBadge = (performance: AdvisorMetrics['performance']) => {
    switch (performance) {
      case 'excellent': return <Badge className="bg-success/10 text-success border-success/20">Excellent</Badge>
      case 'good': return <Badge className="bg-primary/10 text-primary border-primary/20">Good</Badge>
      case 'needs_attention': return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Needs Attention</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  const advisorColumns: Column<AdvisorMetrics>[] = [
    {
      key: 'advisor',
      header: 'Advisor',
      render: (advisor) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {advisor.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{advisor.name}</p>
            <p className="text-sm text-muted-foreground">{advisor.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'projects',
      header: 'Projects',
      render: (advisor) => (
        <div className="text-center">
          <p className="font-medium">{advisor.activeProjects}/{advisor.totalProjects}</p>
          <p className="text-xs text-muted-foreground">active/total</p>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Avg Progress',
      render: (advisor) => (
        <div className="w-24">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>{advisor.avgProgress}%</span>
          </div>
          <Progress value={advisor.avgProgress} className="h-2" />
        </div>
      ),
    },
    {
      key: 'performance',
      header: 'Performance',
      render: (advisor) => getPerformanceBadge(advisor.performance),
    },
    {
      key: 'pending',
      header: 'Pending',
      render: (advisor) => (
        <div className="space-y-1">
          {advisor.pendingEvaluations > 0 && (
            <Badge variant="outline" className="bg-warning/10 text-warning">
              {advisor.pendingEvaluations} eval{advisor.pendingEvaluations !== 1 ? 's' : ''}
            </Badge>
          )}
          {advisor.overdueTasks > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive">
              {advisor.overdueTasks} overdue
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (advisor) => (
        <div className="flex gap-2">
          <Link href={`/dashboard/coordinator/advisor-progress/${advisor.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendReminder(advisor)}
            disabled={advisor.pendingEvaluations === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            Remind
          </Button>
        </div>
      ),
    },
  ]

  const statsCards = [
    {
      title: 'Total Advisors',
      value: advisors.length,
      subtitle: 'Active faculty members',
      icon: Users,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Avg Progress',
      value: `${Math.round(advisorMetrics.reduce((sum, a) => sum + a.avgProgress, 0) / advisorMetrics.length)}%`,
      subtitle: 'Across all projects',
      icon: TrendingUp,
      color: 'bg-success/10 text-success',
    },
    {
      title: 'Pending Evaluations',
      value: advisorMetrics.reduce((sum, a) => sum + a.pendingEvaluations, 0),
      subtitle: 'Require attention',
      icon: AlertTriangle,
      color: 'bg-warning/10 text-warning',
    },
    {
      title: 'Excellent Performers',
      value: advisorMetrics.filter(a => a.performance === 'excellent').length,
      subtitle: 'Top tier advisors',
      icon: Target,
      color: 'bg-accent/10 text-accent',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advisor Progress & Performance"
        description="Monitor advisor performance, project progress, and provide feedback"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm font-medium">{stat.title}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Advisor Performance Overview</CardTitle>
              <CardDescription>
                Comprehensive view of advisor workload, progress, and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable data={advisorMetrics} columns={advisorColumns} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Performance Distribution</CardTitle>
                <CardDescription>Advisor performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['excellent', 'good', 'needs_attention'].map((performance) => {
                    const count = advisorMetrics.filter(a => a.performance === performance).length
                    const percentage = Math.round((count / advisorMetrics.length) * 100)
                    return (
                      <div key={performance} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getPerformanceColor(performance as AdvisorMetrics['performance'])}`} />
                          <span className="capitalize">{performance.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{count} advisors</span>
                          <Badge variant="outline">{percentage}%</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Progress Insights</CardTitle>
                <CardDescription>Key metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Highest Progress</span>
                    <span className="text-sm">
                      {Math.max(...advisorMetrics.map(a => a.avgProgress))}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Lowest Progress</span>
                    <span className="text-sm">
                      {Math.min(...advisorMetrics.map(a => a.avgProgress))}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Total Overdue Tasks</span>
                    <span className="text-sm">
                      {advisorMetrics.reduce((sum, a) => sum + a.overdueTasks, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Communication Tools</CardTitle>
              <CardDescription>Send feedback and reminders to advisors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Send Feedback</h3>
                        <p className="text-sm text-muted-foreground">Provide constructive feedback</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-warning" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Send Reminders</h3>
                        <p className="text-sm text-muted-foreground">Remind about pending tasks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Performance Report</h3>
                        <p className="text-sm text-muted-foreground">Generate detailed reports</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Provide constructive feedback to {selectedAdvisor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="feedback">Feedback Message</Label>
              <Textarea
                id="feedback"
                placeholder="Enter your feedback..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="mt-1.5"
                rows={4}
              />
            </div>
            <Button
              className="w-full btn-gradient"
              onClick={handleSendFeedback}
              disabled={!feedbackText.trim()}
            >
              Send Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}