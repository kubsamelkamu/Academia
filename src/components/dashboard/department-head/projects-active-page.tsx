"use client"

import React, { useState } from "react"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FolderOpen,
  GitBranch,
  Pause,
  Search,
  TrendingUp,
  Users,
} from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { DashboardBackLink } from "@/components/dashboard/dashboard-back"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const mockActiveProjects = [
  {
    id: "1",
    title: "AI-Powered Student Assistant",
    groupName: "Group Alpha",
    advisorName: "Dr. Sarah Johnson",
    status: "active" as const,
    progress: 75,
    startDate: "2024-01-15",
    dueDate: "2024-05-30",
    departmentName: "Computer Science",
    groupMembers: ["John Doe", "Jane Smith", "Bob Wilson"],
    category: "Artificial Intelligence",
    tags: ["AI", "Machine Learning", "Education"],
    lastActivity: "2024-03-15",
    description: "An AI-powered assistant to help students with coursework, reminders, and scheduling.",
    technologies: ["Python", "TensorFlow", "React", "Node.js"],
    milestones: [
      { name: "Requirements Analysis", status: "completed" as const, dueDate: "2024-02-15" },
      { name: "System Design",         status: "completed" as const, dueDate: "2024-03-15" },
      { name: "Prototype Dev",         status: "in-progress" as const, dueDate: "2024-04-15" },
      { name: "Testing & Deployment",  status: "pending" as const, dueDate: "2024-05-30" },
    ],
  },
  {
    id: "2",
    title: "Blockchain-Based Voting System",
    groupName: "Group Beta",
    advisorName: "Prof. Michael Chen",
    status: "submitted" as const,
    progress: 90,
    startDate: "2024-02-01",
    dueDate: "2024-06-15",
    departmentName: "Computer Science",
    groupMembers: ["Alice Brown", "Charlie Davis"],
    category: "Blockchain",
    tags: ["Blockchain", "Security", "E-voting"],
    lastActivity: "2024-03-14",
    description: "A secure blockchain-based voting system for academic institutions.",
    technologies: ["Ethereum", "Solidity", "Web3.js", "React"],
    milestones: [
      { name: "Requirements Analysis",      status: "completed" as const, dueDate: "2024-02-28" },
      { name: "System Design",              status: "completed" as const, dueDate: "2024-03-31" },
      { name: "Smart Contract Development", status: "completed" as const, dueDate: "2024-04-30" },
      { name: "Testing & Deployment",       status: "in-progress" as const, dueDate: "2024-06-15" },
    ],
  },
  {
    id: "3",
    title: "Smart Campus IoT Platform",
    groupName: "Group Gamma",
    advisorName: "Dr. Emily Rodriguez",
    status: "active" as const,
    progress: 45,
    startDate: "2024-03-01",
    dueDate: "2024-07-30",
    departmentName: "Computer Science",
    groupMembers: ["Eva Green", "Frank White", "Grace Lee"],
    category: "IoT",
    tags: ["IoT", "Smart Campus", "Sensors"],
    lastActivity: "2024-03-16",
    description: "An IoT platform for monitoring and managing campus resources in real time.",
    technologies: ["Arduino", "Raspberry Pi", "MQTT", "React"],
    milestones: [
      { name: "Requirements Analysis", status: "completed" as const, dueDate: "2024-03-15" },
      { name: "System Design",         status: "completed" as const, dueDate: "2024-04-15" },
      { name: "Hardware Development",  status: "in-progress" as const, dueDate: "2024-05-30" },
      { name: "Integration & Testing", status: "pending" as const, dueDate: "2024-07-30" },
    ],
  },
  {
    id: "4",
    title: "Virtual Reality Lab Simulator",
    groupName: "Group Delta",
    advisorName: "Prof. David Kim",
    status: "on-hold" as const,
    progress: 30,
    startDate: "2024-02-15",
    dueDate: "2024-08-15",
    departmentName: "Computer Science",
    groupMembers: ["Henry Ford", "Ivy Chen"],
    category: "VR/AR",
    tags: ["VR", "Education", "Simulation"],
    lastActivity: "2024-03-10",
    description: "A virtual reality laboratory simulator to support science education and experiments.",
    technologies: ["Unity", "C#", "Blender", "SteamVR"],
    milestones: [
      { name: "Requirements Analysis", status: "completed" as const, dueDate: "2024-03-01" },
      { name: "System Design",         status: "in-progress" as const, dueDate: "2024-04-15" },
      { name: "3D Modeling",           status: "in-progress" as const, dueDate: "2024-05-30" },
      { name: "Testing",               status: "pending" as const, dueDate: "2024-08-15" },
    ],
  },
]

function statusConfig(status: string) {
  switch (status) {
    case "active":     return { label: "Active",     color: "bg-emerald-500/10 text-emerald-700 border-emerald-200", icon: TrendingUp }
    case "submitted":  return { label: "Submitted",  color: "bg-blue-500/10 text-blue-700 border-blue-200",         icon: CheckCircle2 }
    case "on-hold":    return { label: "On Hold",    color: "bg-amber-500/10 text-amber-700 border-amber-200",       icon: Pause }
    default:           return { label: status,       color: "bg-muted text-muted-foreground",                        icon: Clock }
  }
}

function progressColor(pct: number) {
  if (pct >= 80) return "[&>div]:bg-emerald-500"
  if (pct >= 50) return "[&>div]:bg-primary"
  return "[&>div]:bg-amber-500"
}

function milestoneColor(s: string) {
  if (s === "completed")  return "bg-emerald-500"
  if (s === "in-progress") return "bg-primary"
  return "bg-muted-foreground/30"
}

export function ProjectsActivePage() {
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatus]   = useState("all")
  const [expanded, setExpanded]     = useState<string | null>(null)

  const filtered = mockActiveProjects.filter((p) => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.groupName.toLowerCase().includes(q) ||
      p.advisorName.toLowerCase().includes(q)
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total:    mockActiveProjects.length,
    active:   mockActiveProjects.filter((p) => p.status === "active").length,
    submitted:mockActiveProjects.filter((p) => p.status === "submitted").length,
    onHold:   mockActiveProjects.filter((p) => p.status === "on-hold").length,
    avgProg:  Math.round(mockActiveProjects.reduce((a, p) => a + p.progress, 0) / mockActiveProjects.length),
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Active Projects"
        description="All current projects in progress across the department"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Report exported")}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <DashboardBackLink href="/dashboard/department-head/projects" variant="outline" />
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",     value: stats.total,     icon: FolderOpen,   color: "bg-primary/10",       iconColor: "text-primary" },
          { label: "Active",    value: stats.active,    icon: TrendingUp,   color: "bg-emerald-500/10",   iconColor: "text-emerald-600" },
          { label: "Submitted", value: stats.submitted, icon: CheckCircle2, color: "bg-blue-500/10",      iconColor: "text-blue-600" },
          { label: "Avg Progress", value: `${stats.avgProg}%`, icon: GitBranch, color: "bg-primary/10", iconColor: "text-primary" },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", k.color)}>
                <k.icon className={cn("h-4 w-4", k.iconColor)} />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">{k.value}</p>
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by title, group or advisor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-40 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Status</SelectItem>
            <SelectItem value="active" className="text-xs">Active</SelectItem>
            <SelectItem value="submitted" className="text-xs">Submitted</SelectItem>
            <SelectItem value="on-hold" className="text-xs">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project list */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Current Projects</CardTitle>
              <CardDescription>{filtered.length} project{filtered.length !== 1 ? "s" : ""} found</CardDescription>
            </div>
            <Badge variant="secondary">{filtered.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <FolderOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No projects found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            filtered.map((p) => {
              const sc = statusConfig(p.status)
              const isOpen = expanded === p.id
              return (
                <div key={p.id} className="rounded-xl border bg-card overflow-hidden">
                  {/* Main row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{p.title}</p>
                        <Badge variant="outline" className={cn("text-[10px] gap-1 shrink-0", sc.color)}>
                          <sc.icon className="h-2.5 w-2.5" /> {sc.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {p.groupName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Due {new Date(p.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Progress value={p.progress} className={cn("h-1.5 flex-1", progressColor(p.progress))} />
                        <span className="text-[11px] font-semibold text-primary shrink-0">{p.progress}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={() => setExpanded(isOpen ? null : p.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{isOpen ? "Less" : "Details"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="border-t bg-muted/20 px-4 py-4 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {[
                          { label: "Advisor",    value: p.advisorName },
                          { label: "Department", value: p.departmentName },
                          { label: "Category",   value: p.category },
                          { label: "Members",    value: p.groupMembers.length },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                            <p className="font-medium mt-0.5">{value}</p>
                          </div>
                        ))}
                      </div>

                      {p.description && (
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      )}

                      <Separator />

                      {/* Milestones */}
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Milestones</p>
                        <div className="space-y-1.5">
                          {p.milestones.map((m, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={cn("h-2 w-2 rounded-full shrink-0", milestoneColor(m.status))} />
                              <p className="text-xs flex-1 truncate">{m.name}</p>
                              <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                                {m.status.replace("-", " ")}
                              </Badge>
                              <p className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                                {new Date(m.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tech tags */}
                      {p.technologies && (
                        <div className="flex flex-wrap gap-1.5">
                          {p.technologies.map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
