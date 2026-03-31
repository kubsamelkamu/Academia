"use client"

import React, { useState } from "react"
import StatCard from "@/components/shared/StatCard"
import DataTable, { Column } from "@/components/shared/DataTable"
import StatusBadge from "@/components/shared/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TimelineCard } from "@/components/timeline/TimelineCard"
import { StatusIndicator } from "@/components/timeline/StatusIndicator"
import {
  FileText,
  Users,
  ClipboardCheck,
  Calculator,
  AlertTriangle,
  Send,
  UserPlus,
  CheckCircle2,
  TrendingUp,
  Clock,
  BarChart3,
  Timer,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  mockProjectTitles,
  mockProjects,
  mockEvaluations,
  mockComplaints,
  mockUsers,
  ProjectSummary,
  Complaint,
} from "@/data/mockData"
import { mockProjectTimelines, mockTimelineAlerts } from "@/data/timelineData"

export function CoordinatorDashboard() {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null)
  const [selectedAdvisor, setSelectedAdvisor] = useState('')

  const pendingTitles = mockProjectTitles.filter(t => t.status === 'pending')
  const activeProjects = mockProjects.filter(p => p.status === 'in_progress')
  const pendingEvaluations = mockEvaluations.filter(e => e.status === 'pending')
  const openComplaints = mockComplaints.filter(c => c.status === 'open' || c.status === 'under_review')

  const advisors = mockUsers.filter(u => u.role === 'advisor')
  const evaluators = mockUsers.filter(u => u.role === 'evaluator')

  const handleAssignAdvisor = () => {
    toast.success('Advisor Assigned', {
      description: `Successfully assigned advisor to the project.`,
    })
    setAssignDialogOpen(false)
  }

  const projectColumns: Column<ProjectSummary>[] = [
    { 
      key: 'title', 
      header: 'Project', 
      render: (p) => (
        <div>
          <p className="font-medium">{p.title}</p>
          <p className="text-sm text-muted-foreground">{p.groupName}</p>
        </div>
      )
    },
    { 
      key: 'advisorName', 
      header: 'Advisor', 
      render: (p) => p.advisorName || (
        <Badge variant="outline" className="badge-warning">Unassigned</Badge>
      )
    },
    { 
      key: 'evaluators', 
      header: 'Evaluators', 
      render: (p) => {
        const evaluatorNames = (p.evaluatorIds ?? []).map(id => {
          const evaluator = evaluators.find(e => e.id === id)
          return evaluator?.name || 'Unknown'
        })
        return evaluatorNames.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {evaluatorNames.map((name, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {name}
              </Badge>
            ))}
          </div>
        ) : (
          <Badge variant="outline" className="badge-warning">Unassigned</Badge>
        )
      }
    },
    { 
      key: 'progress', 
      header: 'Progress', 
      render: (p) => (
        <div className="w-32">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>{p.progress}%</span>
          </div>
          <Progress value={p.progress} className="h-2" />
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (p) => <StatusBadge status={p.status} /> 
    },
    { 
      key: 'actions', 
      header: 'Actions', 
      render: (p) => (
        <Dialog open={assignDialogOpen && selectedProject?.id === p.id} onOpenChange={(open) => {
          setAssignDialogOpen(open)
          if (open) setSelectedProject(p)
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="mr-2 h-4 w-4" /> Manage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Project Assignment</DialogTitle>
              <DialogDescription>Assign or change advisors and evaluators for this project.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Project</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedProject?.title}</p>
              </div>
              <div>
                <Label>Assign Advisor</Label>
                <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select an advisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {advisors.map((advisor) => (
                      <SelectItem key={advisor.id} value={advisor.id}>
                        {advisor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assign Evaluators</Label>
                <Select>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select evaluators (multiple)" />
                  </SelectTrigger>
                  <SelectContent>
                    {evaluators.map((evaluator) => (
                      <SelectItem key={evaluator.id} value={evaluator.id}>
                        {evaluator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full btn-gradient" onClick={handleAssignAdvisor}>
                Save Assignments
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )
    },
  ]

  const complaintColumns: Column<Complaint>[] = [
    { 
      key: 'studentName', 
      header: 'Student', 
      render: (c) => c.studentName 
    },
    { 
      key: 'targetType', 
      header: 'Target', 
      render: (c) => (
        <span className="capitalize">{c.targetType}</span>
      )
    },
    { 
      key: 'targetName', 
      header: 'Target Name', 
      render: (c) => c.targetName 
    },
    { 
      key: 'reason', 
      header: 'Reason', 
      render: (c) => (
        <p className="max-w-xs truncate">{c.reason}</p>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (c) => <StatusBadge status={c.status} /> 
    },
    { 
      key: 'actions', 
      header: 'Actions', 
      render: (c) => (
        <Link href={`/dashboard/coordinator/complaints/review?complaintId=${c.id}`} passHref>
          <Button asChild variant="outline" size="sm">
            <span>Review</span>
          </Button>
        </Link>
      )
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Titles"
          value={pendingTitles.length}
          subtitle="From DC Committee"
          icon={FileText}
          iconClassName="bg-warning/10 text-warning"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects.length}
          subtitle="In progress"
          icon={TrendingUp}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          title="Pending Evaluations"
          value={pendingEvaluations.length}
          subtitle="Awaiting submission"
          icon={ClipboardCheck}
          iconClassName="bg-info/10 text-info"
        />
        <StatCard
          title="Open Complaints"
          value={openComplaints.length}
          subtitle="Need attention"
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
        />
      </div>

      {/* Workflow Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Project Workflow Overview</CardTitle>
          <CardDescription>Track the current state of all projects in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Title Review', count: 5, icon: FileText, color: 'bg-muted' },
              { label: 'In Progress', count: 12, icon: Clock, color: 'bg-info/10' },
              { label: 'Under Evaluation', count: 8, icon: ClipboardCheck, color: 'bg-warning/10' },
              { label: 'Grading', count: 4, icon: Calculator, color: 'bg-accent/10' },
              { label: 'Completed', count: 25, icon: CheckCircle2, color: 'bg-success/10' },
            ].map((stage) => (
              <div key={stage.label} className={`${stage.color} rounded-xl p-4 text-center`}>
                <stage.icon className="h-6 w-6 mx-auto mb-2 text-foreground/70" />
                <p className="text-2xl font-display font-bold">{stage.count}</p>
                <p className="text-xs text-muted-foreground">{stage.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Alerts */}
      {mockTimelineAlerts.filter(a => !a.isRead).length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Timer className="h-5 w-5 text-warning" />
              Timeline Alerts ({mockTimelineAlerts.filter(a => !a.isRead).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {mockTimelineAlerts.filter(a => !a.isRead).slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                  <StatusIndicator status={alert.severity === 'critical' ? 'overdue' : alert.severity === 'high' ? 'at_risk' : 'on_track'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Timelines */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Project Timelines</CardTitle>
          <CardDescription>Real-time countdown and progress tracking for all projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {mockProjectTimelines.slice(0, 4).map((timeline) => {
              const project = mockProjects.find(p => p.id === timeline.projectId)
              return (
                <TimelineCard
                  key={timeline.projectId}
                  timeline={timeline}
                  projectTitle={project?.title || 'Unknown Project'}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Active Projects</TabsTrigger>
          <TabsTrigger value="advisor-progress">Advisor Progress</TabsTrigger>
          <TabsTrigger value="grades">Grade Management</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Active Projects</CardTitle>
              <Link href="/dashboard/coordinator/notify-advisors">
                <Button variant="outline" size="sm">
                  <Send className="mr-2 h-4 w-4" /> Notify All Advisors
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable data={mockProjects} columns={projectColumns} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advisor-progress">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Advisor Progress & Status</CardTitle>
              <CardDescription>Monitor advisor performance and project completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Detailed Advisor Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  View comprehensive advisor performance metrics, progress tracking, and communication tools.
                </p>
                <Link href="/dashboard/coordinator/advisor-progress">
                  <Button className="btn-gradient">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Advisor Progress
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Grade Management</CardTitle>
              <CardDescription>Calculate, review, and publish student grades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Grade Management</h3>
                <p className="text-muted-foreground mb-4">
                  Access detailed grade calculations, breakdowns, distributions, and bulk operations.
                </p>
                <Link href="/dashboard/coordinator/grade-management">
                  <Button className="btn-gradient">
                    <Calculator className="mr-2 h-4 w-4" />
                    Manage Grades
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Complaint Management</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={mockComplaints}
                columns={complaintColumns}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/coordinator/title-management">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Send to DC Committee</h3>
                  <p className="text-sm text-muted-foreground">Forward validated titles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/coordinator/advisor-progress">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Advisor Analytics</h3>
                  <p className="text-sm text-muted-foreground">Monitor advisor performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/coordinator/grade-management">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Grade Management</h3>
                  <p className="text-sm text-muted-foreground">Calculate and publish grades</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}