"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import StatCard from "@/components/shared/StatCard"
import StatusBadge from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockStudentGroups } from "@/data/mockData"
import {
  CheckCircle,
  Clock,
  Eye,
  FileText,
  FolderOpen,
  MessageSquare,
  Upload,
  Users,
  Video,
} from "lucide-react"

type ProjectStatus = "active" | "completed" | "on-hold" | "pending-review" | "cleared"
type MilestoneStatus = "approved" | "submitted" | "revision" | "pending"

interface ProjectMilestone {
  id: string
  name: string
  dueDate: string
  status: MilestoneStatus
  submittedAt?: string
}

interface AdvisorProject {
  id: string
  title: string
  groupName: string
  advisorId: string
  status: ProjectStatus
  progress: number
  milestones: ProjectMilestone[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

const mockAdvisorProjects: AdvisorProject[] = [
  {
    id: "p1",
    title: "AI‑Driven Academic Assistant",
    groupName: "AI Research Group",
    advisorId: "u7",
    status: "active",
    progress: 72,
    milestones: [
      { id: "m1", name: "Proposal", dueDate: "2024-05-05", status: "approved", submittedAt: "2024-05-01" },
      { id: "m2", name: "Architecture", dueDate: "2024-06-02", status: "approved", submittedAt: "2024-05-31" },
      { id: "m3", name: "Prototype", dueDate: "2024-07-10", status: "submitted", submittedAt: "2024-07-08" },
    ],
  },
  {
    id: "p2",
    title: "Real‑Time Campus Analytics",
    groupName: "Team Atlas",
    advisorId: "u7",
    status: "pending-review",
    progress: 58,
    milestones: [
      { id: "m1", name: "Requirements", dueDate: "2024-05-18", status: "approved", submittedAt: "2024-05-15" },
      { id: "m2", name: "Data pipeline", dueDate: "2024-06-25", status: "submitted", submittedAt: "2024-06-24" },
      { id: "m3", name: "Dashboard MVP", dueDate: "2024-07-20", status: "pending" },
    ],
  },
  {
    id: "p3",
    title: "Secure Research Data Platform",
    groupName: "Team Nova",
    advisorId: "u7",
    status: "active",
    progress: 83,
    milestones: [
      { id: "m1", name: "Threat model", dueDate: "2024-05-10", status: "approved", submittedAt: "2024-05-09" },
      { id: "m2", name: "Encryption layer", dueDate: "2024-06-14", status: "approved", submittedAt: "2024-06-13" },
      { id: "m3", name: "Audit logging", dueDate: "2024-07-01", status: "submitted", submittedAt: "2024-06-30" },
    ],
  },
]

function milestoneAccent(status: MilestoneStatus) {
  if (status === "approved") return "bg-success/20 text-success"
  if (status === "submitted") return "bg-warning/20 text-warning"
  if (status === "revision") return "bg-destructive/20 text-destructive"
  return "bg-muted text-muted-foreground"
}

export function AdvisorDashboard({ userName }: { userName?: string }) {
  const myProjects = React.useMemo(() => mockAdvisorProjects.filter((p) => p.advisorId === "u7"), [])
  const pendingMilestones = React.useMemo(
    () => myProjects.flatMap((p) => p.milestones.filter((m) => m.status === "submitted").map((m) => ({ project: p, milestone: m }))),
    [myProjects],
  )

  const studentsCount = React.useMemo(() => mockStudentGroups.flatMap((g) => g.members).length, [])
  const clearedCount = React.useMemo(() => myProjects.filter((p) => p.status === "cleared").length, [myProjects])

  function handleApproveMilestone(project: AdvisorProject, milestone: ProjectMilestone) {
    toast.success("Milestone approved", { description: `${project.groupName} • ${milestone.name}` })
  }

  function handleRequestRevision(project: AdvisorProject, milestone: ProjectMilestone) {
    toast.message("Revision flow opened", { description: `${project.groupName} • ${milestone.name}` })
  }

  function handleClearForEvaluation(project: AdvisorProject) {
    toast.success("Cleared for evaluation", { description: `${project.title} is ready for evaluation.` })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Advisor Dashboard</h1>
          <p className="text-muted-foreground">
            {userName ? `Welcome back, ${userName}. ` : ""}Oversee projects, review milestones, and communicate with teams.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Assigned Projects"
          value={myProjects.length}
          subtitle="Active supervision"
          icon={FolderOpen}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Pending Reviews"
          value={pendingMilestones.length}
          subtitle="Milestones to review"
          icon={Clock}
          iconClassName="bg-warning/10 text-warning"
        />
        <StatCard
          title="Students"
          value={studentsCount}
          subtitle="Under guidance"
          icon={Users}
          iconClassName="bg-accent/10 text-accent"
        />
        <StatCard
          title="Cleared Projects"
          value={clearedCount}
          subtitle="Ready for evaluation"
          icon={CheckCircle}
          iconClassName="bg-success/10 text-success"
        />
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="milestones">Pending Reviews</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <div className="space-y-4">
            {myProjects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="font-display">{project.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{project.groupName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={project.status} />
                      <Badge variant="outline">{project.progress}%</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3">Milestones</h4>
                    <div className="space-y-2">
                      {project.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center ${milestoneAccent(
                                milestone.status,
                              )}`}
                            >
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{milestone.name}</p>
                              <p className="text-xs text-muted-foreground">Due: {formatDate(milestone.dueDate)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <StatusBadge status={milestone.status} />
                            {milestone.status === "submitted" && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => handleApproveMilestone(project, milestone)}>
                                  <CheckCircle className="mr-1 h-3 w-3" /> Approve
                                </Button>
                                <Button asChild variant="ghost" size="sm">
                                  <Link href={`/dashboard/advisor/students/revision/${project.id}`}>Request Revision</Link>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/advisor/documents">
                        <Eye className="mr-2 h-4 w-4" /> View Documents
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/advisor/upload">
                        <Upload className="mr-2 h-4 w-4" /> Upload Document
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/advisor/message-group">
                        <MessageSquare className="mr-2 h-4 w-4" /> Message Group
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/advisor/schedule">
                        <Video className="mr-2 h-4 w-4" /> Schedule Meeting
                      </Link>
                    </Button>
                    {project.progress >= 80 && (
                      <Button className="btn-gradient" size="sm" onClick={() => handleClearForEvaluation(project)}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Clear for Evaluation
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Pending Milestone Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingMilestones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No pending milestones to review</div>
              ) : (
                <div className="space-y-3">
                  {pendingMilestones.map(({ project, milestone }) => (
                    <div key={`${project.id}:${milestone.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium">{milestone.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {project.groupName} • Submitted: {milestone.submittedAt ? formatDate(milestone.submittedAt) : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href="/dashboard/advisor/reviews">Review</Link>
                        </Button>
                        <Button className="btn-gradient" size="sm" onClick={() => handleApproveMilestone(project, milestone)}>
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Recent Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">M</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">Maria Garcia</p>
                      <span className="text-xs text-muted-foreground">2h ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Thank you for the feedback on our prototype!</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/advisor/messages">
                    <MessageSquare className="mr-2 h-4 w-4" /> View All Messages
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Video className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Weekly Progress Review</p>
                    <p className="text-sm text-muted-foreground">Team Atlas • Tomorrow, 2:00 PM</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/advisor/schedule">
                    <Video className="mr-2 h-4 w-4" /> Schedule New Meeting
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

