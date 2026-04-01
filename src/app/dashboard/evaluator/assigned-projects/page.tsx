"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Search,
  FolderKanban,
  GraduationCap,
  Users,
  Clock,
  CheckCircle2,
  Activity,
  Award,
  ChevronRight,
  ClipboardCheck,
  Star,
  Calendar,
  FileText,
  Filter,
} from "lucide-react"
import Link from "next/link"
import { mockProjects } from "@/data/mockData"

const EVALUATOR_ID = "u6"

const MOCK_PROJECT_DETAILS = [
  {
    id: "p1",
    projectTitle: "AI-Driven Academic Assistant",
    groupName: "AI Research Group",
    advisor: "Prof. Lisa Anderson",
    advisorEmail: "landerson@stanford.edu",
    progress: 75,
    evaluationStatus: "pending" as const,
    members: [
      { name: "Alex Johnson", role: "Group Manager" },
      { name: "Maria Garcia", role: "Developer" },
      { name: "David Kim", role: "Researcher" },
    ],
    description: "An AI-powered system that assists students with academic queries, resource discovery, and learning path recommendations using NLP and machine learning.",
    tags: ["AI/ML", "NLP", "Education", "Python"],
    defenseDate: "2024-02-10T09:00:00Z",
    defenseRoom: "Room A-201",
    startDate: "2023-09-01",
    finalScore: null,
    documentsCount: 8,
    milestonesComplete: 6,
    milestonesTotal: 8,
  },
  {
    id: "p2",
    projectTitle: "Real-Time Campus Analytics",
    groupName: "Data Analytics Team",
    advisor: "Dr. Michael Brown",
    advisorEmail: "mbrown@stanford.edu",
    progress: 60,
    evaluationStatus: "submitted" as const,
    members: [
      { name: "Samuel Lee", role: "Group Manager" },
      { name: "Emma Wilson", role: "Data Engineer" },
    ],
    description: "A real-time dashboard system for tracking campus resource utilization, student foot traffic, and energy consumption using IoT sensors and stream processing.",
    tags: ["IoT", "Analytics", "Real-time", "React"],
    defenseDate: "2024-01-28T14:00:00Z",
    defenseRoom: "Room B-105",
    startDate: "2023-09-15",
    finalScore: 85,
    documentsCount: 12,
    milestonesComplete: 5,
    milestonesTotal: 7,
  },
  {
    id: "p3",
    projectTitle: "Secure Research Data Platform",
    groupName: "Security Systems",
    advisor: "Prof. Emily Davis",
    advisorEmail: "edavis@stanford.edu",
    progress: 45,
    evaluationStatus: "in_progress" as const,
    members: [
      { name: "Alice Brown", role: "Group Manager" },
      { name: "Charlie Davis", role: "Security Engineer" },
      { name: "Bob Turner", role: "Backend Dev" },
    ],
    description: "A secure collaborative platform for research teams with end-to-end encryption, fine-grained access controls, audit trails, and document versioning.",
    tags: ["Security", "Cryptography", "Cloud", "Node.js"],
    defenseDate: "2024-02-18T10:00:00Z",
    defenseRoom: "Room C-310",
    startDate: "2023-10-01",
    finalScore: null,
    documentsCount: 6,
    milestonesComplete: 3,
    milestonesTotal: 8,
  },
  {
    id: "p4",
    projectTitle: "Smart Campus Navigation",
    groupName: "Mobile Dev Team",
    advisor: "Dr. Robert Taylor",
    advisorEmail: "rtaylor@stanford.edu",
    progress: 100,
    evaluationStatus: "reviewed" as const,
    members: [
      { name: "Rachel Kim", role: "Group Manager" },
      { name: "James Park", role: "Mobile Dev" },
    ],
    description: "An indoor navigation mobile app leveraging Bluetooth beacons and ML-based position estimation to guide students and visitors across campus buildings.",
    tags: ["Mobile", "Bluetooth BLE", "ML", "Swift/Kotlin"],
    defenseDate: "2024-01-18T11:00:00Z",
    defenseRoom: "Room A-101",
    startDate: "2023-09-01",
    finalScore: 89,
    documentsCount: 15,
    milestonesComplete: 8,
    milestonesTotal: 8,
  },
]

const statusConfig = {
  pending: { label: "Pending Evaluation", color: "bg-amber-500/10 text-amber-600 border-amber-300", icon: Clock },
  in_progress: { label: "Evaluation In Progress", color: "bg-blue-500/10 text-blue-600 border-blue-300", icon: Activity },
  submitted: { label: "Evaluation Submitted", color: "bg-violet-500/10 text-violet-600 border-violet-300", icon: ClipboardCheck },
  reviewed: { label: "Reviewed & Finalized", color: "bg-emerald-500/10 text-emerald-600 border-emerald-300", icon: Award },
}

export default function AssignedProjectsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = MOCK_PROJECT_DETAILS.filter(p => {
    const matchSearch = p.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
      p.groupName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || p.evaluationStatus === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/evaluator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Assigned Projects</h1>
            <p className="text-sm text-muted-foreground">Projects you are assigned to evaluate this term</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-11 sm:pl-0">
          {[
            { label: "Total", value: MOCK_PROJECT_DETAILS.length, color: "text-primary" },
            { label: "Pending", value: MOCK_PROJECT_DETAILS.filter(p => p.evaluationStatus === "pending").length, color: "text-amber-600" },
            { label: "Done", value: MOCK_PROJECT_DETAILS.filter(p => p.evaluationStatus === "reviewed" || p.evaluationStatus === "submitted").length, color: "text-emerald-600" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5">
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects or groups..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full sm:w-44">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Cards */}
      <div className="space-y-4">
        {filtered.map(project => {
          const sConfig = statusConfig[project.evaluationStatus]
          const StatusIcon = sConfig.icon
          const isExpanded = expandedId === project.id

          return (
            <Card key={project.id} className={`transition-all duration-200 hover:shadow-md ${isExpanded ? "border-primary/30 shadow-md" : ""}`}>
              <CardContent className="p-0">
                {/* Card Header Row */}
                <div className="flex items-start gap-4 p-4">
                  <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-6 w-6 text-violet-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-tight">{project.projectTitle}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{project.groupName}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {project.finalScore !== null && (
                          <div className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1">
                            <Star className="h-3 w-3 text-violet-600" />
                            <span className="text-xs font-bold text-violet-600">{project.finalScore}/100</span>
                          </div>
                        )}
                        <Badge className={`text-xs ${sConfig.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {sConfig.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress + Milestones */}
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Project Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-1.5" />
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        <span className="font-semibold text-foreground">{project.milestonesComplete}</span>/{project.milestonesTotal} milestones
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {project.tags.map(tag => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>
                      ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {project.members.length} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.defenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {project.defenseRoom}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {project.documentsCount} docs
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setExpandedId(isExpanded ? null : project.id)}>
                          {isExpanded ? "Collapse" : "Details"}
                          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </Button>
                        <Link href={`/dashboard/evaluator/evaluations/${project.id}`}>
                          <Button size="sm" className={`h-8 text-xs gap-1.5 ${project.evaluationStatus === "pending" || project.evaluationStatus === "in_progress" ? "btn-gradient" : ""}`} variant={project.evaluationStatus === "pending" || project.evaluationStatus === "in_progress" ? "default" : "outline"}>
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            {project.evaluationStatus === "pending" ? "Evaluate" : project.evaluationStatus === "in_progress" ? "Continue" : "View Eval"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-4 bg-muted/20 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Project Description</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Supervisor</p>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">{project.advisor.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{project.advisor}</p>
                              <p className="text-xs text-muted-foreground">{project.advisorEmail}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Team Members</p>
                          <div className="space-y-1.5">
                            {project.members.map((m, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-[10px] bg-violet-500/10 text-violet-600">{m.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{m.name}</span>
                                <Badge variant="outline" className="text-xs ml-auto">{m.role}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
