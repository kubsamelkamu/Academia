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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Search,
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

  function handleRequestRevision(project: ClearanceProject) {
    toast.message("Revision requested", { description: `Revision request has been sent for ${project.title}.` })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Clearance Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Review and clear student projects for final evaluation.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button asChild variant="outline" className="flex-1 sm:flex-none h-9 text-xs">
            <Link href="/dashboard/advisor/messages">
              <FileText className="h-3.5 w-3.5 mr-2" />
              Messages
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/10 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold leading-none">{readyCount}</p>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1 truncate">Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/10 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold leading-none">{clearedCount}</p>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1 truncate">Cleared</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/10 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold leading-none">{revisionCount}</p>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1 truncate">Revision</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/10 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold leading-none">{totalStudents}</p>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1 truncate">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-primary/10 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by project title or group name..."
              className="pl-9 h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Projects List - Responsive Grid/Table */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Projects Awaiting Clearance</h2>
        
        {/* Desktop Table View */}
        <Card className="hidden md:block border-primary/10 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Project</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Progress</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Submitted</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Members</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="py-1">
                        <p className="font-bold text-sm leading-tight">{project.title}</p>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{project.groupName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-primary">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(project.submittedAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{project.members.length}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {project.status === "ready_for_clearance" && (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="default" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider">
                                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Clear
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px] rounded-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold">Clear Project</DialogTitle>
                                  <DialogDescription className="text-sm font-medium">
                                    Confirm clearance for <span className="text-primary font-bold">{project.title}</span>.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`notes-${project.id}`} className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Clearance Notes</Label>
                                    <Textarea
                                      id={`notes-${project.id}`}
                                      placeholder="Add any notes for the evaluators..."
                                      value={clearanceNotes}
                                      onChange={(e) => setClearanceNotes(e.target.value)}
                                      rows={4}
                                      className="resize-none text-sm border-primary/20 focus-visible:ring-primary/30"
                                    />
                                  </div>
                                </div>
                                <DialogFooter className="gap-2 sm:gap-0">
                                  <Button variant="outline" className="h-10 text-xs font-bold uppercase tracking-wider">Cancel</Button>
                                  <Button onClick={() => handleClearProject(project)} className="h-10 text-xs font-bold uppercase tracking-wider">Confirm Clearance</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Button asChild variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider">
                              <Link href={`/dashboard/advisor/students/revision/${project.id}`}>
                                <AlertCircle className="h-3.5 w-3.5 mr-1.5" /> Revision
                              </Link>
                            </Button>
                          </>
                        )}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10">
                              <FileText className="h-3.5 w-3.5 mr-1.5" /> Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 rounded-2xl border-primary/20 shadow-2xl">
                            <DialogHeader className="p-6 pb-0 bg-muted/30 border-b">
                              <div className="flex items-start justify-between pr-8 mb-4">
                                <div className="space-y-1">
                                  <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight">{project.title}</DialogTitle>
                                  <DialogDescription className="flex items-center gap-2 mt-1 font-medium text-primary">
                                    <Users className="h-4 w-4" />
                                    {project.groupName}
                                  </DialogDescription>
                                </div>
                                <div className="mt-1">{getStatusBadge(project.status)}</div>
                              </div>
                            </DialogHeader>

                            <ScrollArea className="max-h-[calc(90vh-8rem)]">
                              <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  <div className="p-3 rounded-xl bg-muted/30 border shadow-sm text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Progress</p>
                                    <p className="text-lg font-bold text-primary mt-1">{project.progress}%</p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-muted/30 border shadow-sm text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Submitted</p>
                                    <p className="text-sm font-bold text-foreground mt-1">{formatDate(project.submittedAt)}</p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-muted/30 border shadow-sm text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Members</p>
                                    <p className="text-lg font-bold text-foreground mt-1">{project.members.length}</p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-muted/30 border shadow-sm text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Milestones</p>
                                    <p className="text-lg font-bold text-foreground mt-1">{project.milestones.length}</p>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Team Members</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {project.members.map((member) => (
                                      <div key={member.id} className="flex items-center gap-3 p-3 bg-background border rounded-xl shadow-sm">
                                        <Avatar className="h-9 w-9 border-2 border-primary/10 shadow-sm">
                                          <AvatarImage src={member.avatar} alt={member.name} />
                                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                            {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                          <p className="text-sm font-bold text-foreground truncate">{member.name}</p>
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{member.role}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Milestones Status</h4>
                                  <div className="space-y-2.5">
                                    {project.milestones.map((milestone) => (
                                      <div key={milestone.id} className="flex items-center justify-between p-3.5 bg-background border rounded-xl shadow-sm hover:bg-muted/5 transition-colors">
                                        <div className="min-w-0">
                                          <p className="font-bold text-sm text-foreground leading-tight">{milestone.name}</p>
                                          <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                            Submitted: {formatDate(milestone.submittedAt)}
                                          </p>
                                        </div>
                                        {getMilestoneStatusBadge(milestone.status)}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Evaluation Metrics</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(project.evaluationCriteria).map(([key, value]) => (
                                      <div key={key} className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{key}</span>
                                          <span className="text-xs font-bold text-primary">{value}%</span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                          <div className="bg-primary h-full rounded-full" style={{ width: `${value}%` }} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile Card View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="border-primary/10 shadow-md overflow-hidden">
              <CardHeader className="p-4 bg-muted/30 border-b">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base font-bold leading-tight">{project.title}</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium mt-1">{project.groupName}</p>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-primary">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Submitted</p>
                    <p className="text-xs font-bold mt-0.5">{formatDate(project.submittedAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2 border-y border-dashed">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold">{project.members.length} Members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold">{project.milestones.length} Milestones</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  {project.status === "ready_for_clearance" && (
                    <Button variant="default" size="sm" className="flex-1 h-9 text-[10px] font-bold uppercase tracking-wider">
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Clear
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="flex-1 h-9 text-[10px] font-bold uppercase tracking-wider">
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed">
            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No projects found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvisorStudentsPage