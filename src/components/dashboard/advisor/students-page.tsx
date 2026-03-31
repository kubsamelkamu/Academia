"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Users,
} from "lucide-react"

type ClearanceStatus = "ready_for_clearance" | "cleared" | "revision_required"
type MilestoneStatus = "approved" | "submitted" | "revision"

interface ClearanceMilestone {
  id: string
  name: string
  status: MilestoneStatus
  submittedAt: string
}

interface ClearanceMember {
  id: string
  name: string
  role: string
  avatar?: string
}

interface ClearanceProject {
  id: string
  title: string
  groupName: string
  progress: number
  status: ClearanceStatus
  submittedAt: string
  clearedAt?: string
  milestones: ClearanceMilestone[]
  members: ClearanceMember[]
  evaluationCriteria: {
    technical: number
    presentation: number
    documentation: number
    innovation: number
  }
}

const mockClearanceProjects: ClearanceProject[] = [
  {
    id: "1",
    title: "Smart Campus System",
    groupName: "Team Alpha",
    progress: 85,
    status: "ready_for_clearance",
    submittedAt: "2024-01-15T10:00:00Z",
    milestones: [
      { id: "1", name: "Requirements Analysis", status: "approved", submittedAt: "2024-01-10T09:00:00Z" },
      { id: "2", name: "System Design", status: "approved", submittedAt: "2024-01-12T14:00:00Z" },
      { id: "3", name: "Implementation", status: "approved", submittedAt: "2024-01-14T16:00:00Z" },
      { id: "4", name: "Testing & Deployment", status: "submitted", submittedAt: "2024-01-15T10:00:00Z" },
    ],
    members: [
      { id: "1", name: "John Doe", role: "Team Lead", avatar: "" },
      { id: "2", name: "Jane Smith", role: "Developer", avatar: "" },
      { id: "3", name: "Mike Johnson", role: "Designer", avatar: "" },
    ],
    evaluationCriteria: {
      technical: 85,
      presentation: 80,
      documentation: 90,
      innovation: 75,
    },
  },
  {
    id: "2",
    title: "AI Chatbot Development",
    groupName: "Team Beta",
    progress: 92,
    status: "cleared",
    submittedAt: "2024-01-12T08:00:00Z",
    clearedAt: "2024-01-13T11:00:00Z",
    milestones: [
      { id: "5", name: "Research Phase", status: "approved", submittedAt: "2024-01-08T10:00:00Z" },
      { id: "6", name: "Prototype Development", status: "approved", submittedAt: "2024-01-10T15:00:00Z" },
      { id: "7", name: "Final Implementation", status: "approved", submittedAt: "2024-01-12T08:00:00Z" },
    ],
    members: [
      { id: "4", name: "Alex Brown", role: "Team Lead", avatar: "" },
      { id: "5", name: "Emma Davis", role: "AI Engineer", avatar: "" },
    ],
    evaluationCriteria: {
      technical: 90,
      presentation: 85,
      documentation: 95,
      innovation: 88,
    },
  },
]

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function getStatusBadge(status: ClearanceStatus) {
  switch (status) {
    case "ready_for_clearance":
      return <Badge className="bg-warning/10 text-warning border-warning/20">Ready for Clearance</Badge>
    case "cleared":
      return <Badge className="bg-success/10 text-success border-success/20">Cleared</Badge>
    case "revision_required":
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Revision Required</Badge>
  }
}

function getMilestoneStatusBadge(status: MilestoneStatus) {
  switch (status) {
    case "approved":
      return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>
    case "submitted":
      return <Badge className="bg-warning/10 text-warning border-warning/20">Submitted</Badge>
    case "revision":
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Revision</Badge>
  }
}

export function AdvisorStudentsPage() {
  const [query, setQuery] = React.useState("")
  const [clearanceNotes, setClearanceNotes] = React.useState("")

  const filteredProjects = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mockClearanceProjects
    return mockClearanceProjects.filter((p) => {
      return p.title.toLowerCase().includes(q) || p.groupName.toLowerCase().includes(q)
    })
  }, [query])

  const readyCount = filteredProjects.filter((p) => p.status === "ready_for_clearance").length
  const clearedCount = filteredProjects.filter((p) => p.status === "cleared").length
  const revisionCount = filteredProjects.filter((p) => p.status === "revision_required").length
  const totalStudents = filteredProjects.reduce((acc, p) => acc + p.members.length, 0)

  function handleClearProject(project: ClearanceProject) {
    if (!clearanceNotes.trim()) {
      toast.error("Notes required", { description: "Please provide clearance notes before approving." })
      return
    }

    toast.success("Project cleared", { description: `${project.title} has been cleared for evaluation.` })
    setClearanceNotes("")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Clear</h1>
          <p className="text-muted-foreground">Review clear groups and clear projects for evaluation.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/advisor/messages">
              <FileText className="h-4 w-4 mr-2" />
              Messages
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1">
              <Label className="sr-only" htmlFor="search">
                Search
              </Label>
              <Input
                id="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by project title or group name..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projects Awaiting Clearance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{project.title}</p>
                      <p className="text-sm text-muted-foreground">{project.groupName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="text-sm">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(project.submittedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{project.members.length} members</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {project.status === "ready_for_clearance" && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <CheckCircle className="h-4 w-4 mr-1" /> Clear
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Clear Project for Evaluation</DialogTitle>
                                <DialogDescription>
                                  Confirm clearance of <span className="font-medium">{project.title}</span> for final
                                  evaluation.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`notes-${project.id}`}>Clearance Notes</Label>
                                  <Textarea
                                    id={`notes-${project.id}`}
                                    placeholder="Add any notes for the evaluators..."
                                    value={clearanceNotes}
                                    onChange={(e) => setClearanceNotes(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline">Cancel</Button>
                                  <Button onClick={() => handleClearProject(project)}>Clear Project</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/advisor/students/revision/${project.id}`}>
                              <AlertCircle className="h-4 w-4 mr-1" /> Revision
                            </Link>
                          </Button>
                        </>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" /> Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[99vw] max-w-9xl">
                          <DialogHeader>
                            <DialogTitle>{project.title}</DialogTitle>
                            <DialogDescription>Project details and clearance information</DialogDescription>
                          </DialogHeader>

                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium">Group</h4>
                                <p className="text-sm text-muted-foreground">{project.groupName}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Progress</h4>
                                <p className="text-sm text-muted-foreground">{project.progress}%</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Submitted</h4>
                                <p className="text-sm text-muted-foreground">{formatDate(project.submittedAt)}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Status</h4>
                                <div className="mt-1">{getStatusBadge(project.status)}</div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-3">Team Members</h4>
                              <div className="flex flex-wrap gap-2">
                                {project.members.map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={member.avatar} alt={member.name} />
                                      <AvatarFallback className="text-xs">
                                        {member.name
                                          .split(" ")
                                          .filter(Boolean)
                                          .map((n) => n[0])
                                          .slice(0, 2)
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{member.name}</span>
                                    <span className="text-xs text-muted-foreground">({member.role})</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-3">Milestones</h4>
                              <div className="space-y-2">
                                {project.milestones.map((milestone) => (
                                  <div
                                    key={milestone.id}
                                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                                  >
                                    <div>
                                      <p className="font-medium text-sm">{milestone.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Submitted: {formatDate(milestone.submittedAt)}
                                      </p>
                                    </div>
                                    {getMilestoneStatusBadge(milestone.status)}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-3">Evaluation Criteria</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm">Technical</span>
                                    <span className="text-sm font-medium">{project.evaluationCriteria.technical}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm">Presentation</span>
                                    <span className="text-sm font-medium">
                                      {project.evaluationCriteria.presentation}%
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm">Documentation</span>
                                    <span className="text-sm font-medium">
                                      {project.evaluationCriteria.documentation}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm">Innovation</span>
                                    <span className="text-sm font-medium">{project.evaluationCriteria.innovation}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                    No projects found for “{query}”.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{readyCount}</p>
                <p className="text-sm text-muted-foreground">Ready for Clearance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clearedCount}</p>
                <p className="text-sm text-muted-foreground">Cleared Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{revisionCount}</p>
                <p className="text-sm text-muted-foreground">Revision Required</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdvisorStudentsPage