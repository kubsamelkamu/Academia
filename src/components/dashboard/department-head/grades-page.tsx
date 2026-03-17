"use client"

import React, { useState } from "react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import DataTable, { type Column } from "@/components/shared/DataTable"
import StatusBadge from "@/components/shared/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  mockGrades,
  type Grade,
  mockGroupManagerApplications,
  type GroupManagerApplication,
  mockStudentGroups,
} from "@/data/mockData"
import { toast } from "sonner"
import Link from "next/link"
import { 
  ClipboardCheck, 
  Eye, 
  Users, 
  CheckCircle, 
  XCircle, 
  UserPlus,
  Search,
  ChevronRight,
  GraduationCap,
  Clock,
  BarChart3,
  FileText,
  Award,
  Filter,
  Download,
  Mail,
  Phone,
  Calendar,
  UserCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

// Modern color system
const colors = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    hover: "hover:bg-primary/20",
  },
  success: {
    bg: "bg-emerald-500/10 dark:bg-emerald-400/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20 dark:border-emerald-400/20",
    hover: "hover:bg-emerald-500/20 dark:hover:bg-emerald-400/20",
    light: "bg-emerald-50 dark:bg-emerald-950/50",
  },
  warning: {
    bg: "bg-amber-500/10 dark:bg-amber-400/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20 dark:border-amber-400/20",
    hover: "hover:bg-amber-500/20 dark:hover:bg-amber-400/20",
  },
  danger: {
    bg: "bg-rose-500/10 dark:bg-rose-400/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20 dark:border-rose-400/20",
    hover: "hover:bg-rose-500/20 dark:hover:bg-rose-400/20",
  },
  info: {
    bg: "bg-sky-500/10 dark:bg-sky-400/10",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/20 dark:border-sky-400/20",
    hover: "hover:bg-sky-500/20 dark:hover:bg-sky-400/20",
  },
}

// Stats Card Component
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "primary",
  description 
}: { 
  title: string
  value: string | number
  icon: React.ElementType
  trend?: { value: number; positive: boolean }
  color?: keyof typeof colors
  description?: string
}) => (
  <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">{value}</span>
            {trend && (
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded-full",
                trend.positive ? colors.success.bg : colors.danger.bg,
                trend.positive ? colors.success.text : colors.danger.text
              )}>
                {trend.positive ? "+" : "-"}{trend.value}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn(
          "rounded-xl p-3",
          colors[color].bg,
          colors[color].text
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// Quick Action Button
const QuickAction = ({ 
  icon: Icon, 
  label, 
  onClick,
  variant = "default" 
}: { 
  icon: React.ElementType
  label: string
  onClick: () => void
  variant?: "default" | "success" | "danger" | "info"
}) => {
  const colorMap = {
    default: "text-muted-foreground hover:text-foreground hover:bg-accent",
    success: colors.success.text + " " + colors.success.hover,
    danger: colors.danger.text + " " + colors.danger.hover,
    info: colors.info.text + " " + colors.info.hover,
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "gap-2 h-9 px-3 rounded-lg",
        colorMap[variant]
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

// Member Badge Component
const MemberBadge = ({ name, role, isManager }: { name: string; role: string; isManager?: boolean }) => (
  <div className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
      isManager ? colors.success.bg : colors.primary.bg,
      isManager ? colors.success.text : colors.primary.text
    )}>
      {name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{name}</p>
      <p className="text-xs text-muted-foreground">{role}</p>
    </div>
    {isManager && (
      <Badge variant="secondary" className={cn("text-[10px]", colors.success.light, colors.success.text)}>
        Manager
      </Badge>
    )}
  </div>
)

export function DepartmentHeadGradesPage() {
  const [activeSection, setActiveSection] = useState<"overview" | "grades" | "applications">("overview")
  const [searchQuery, setSearchQuery] = useState("")
  
  const pendingGrades = mockGrades.filter((g) => g.status === "provisional")
  const pendingApplications = mockGroupManagerApplications.filter((app) => app.status === "pending")
  
  const stats = {
    totalGroups: mockStudentGroups.length,
    pendingGrades: pendingGrades.length,
    pendingApplications: pendingApplications.length,
    approvedGrades: mockGrades.filter((g) => g.status === "final").length,
    averageScore: (mockGrades.reduce((acc, g) => acc + g.finalScore, 0) / mockGrades.length).toFixed(1),
  }

  const handleApproveGrade = (gradeId: string) => {
    const grade = mockGrades.find((g) => g.id === gradeId)
    toast.success("Grade approved", {
      description: grade ? `${grade.studentName}'s grade has been approved.` : "Grade approved.",
    })
  }

  const handleRejectGrade = (gradeId: string) => {
    const grade = mockGrades.find((g) => g.id === gradeId)
    toast.error("Grade rejected", {
      description: grade ? `${grade.studentName}'s grade has been rejected.` : "Grade rejected.",
    })
  }

  const filteredGrades = pendingGrades.filter((g) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return g.studentName.toLowerCase().includes(q) || g.id.toLowerCase().includes(q)
  })

  const gradeColumns: Column<Grade>[] = [
    {
      key: "student",
      header: "Student",
      render: (g) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            colors.primary.bg,
            colors.primary.text
          )}>
            {g.studentName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-sm">{g.studentName}</p>
            <p className="text-xs text-muted-foreground">ID: {g.id.slice(0, 8)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "score",
      header: "Score",
      render: (g) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{g.finalScore.toFixed(1)}%</span>
            <Badge variant="outline" className={cn(
              "text-xs",
              g.finalScore >= 70 ? colors.success.text : colors.warning.text
            )}>
              {g.grade}
            </Badge>
          </div>
          <div className="w-24 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full",
                g.finalScore >= 70 ? "bg-emerald-500" : "bg-amber-500"
              )}
              style={{ width: `${g.finalScore}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (g) => <StatusBadge status={g.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (g) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
            <Link href={`/dashboard/department-head/grades/${g.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", colors.success.text)}
            onClick={() => handleApproveGrade(g.id)}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", colors.danger.text)}
            onClick={() => handleRejectGrade(g.id)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const filteredApplications = pendingApplications.filter((a) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      a.studentName.toLowerCase().includes(q) ||
      (a.proposedGroupName ?? "").toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    )
  })

  const applicationColumns: Column<GroupManagerApplication>[] = [
    {
      key: "applicant",
      header: "Applicant",
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            colors.warning.bg,
            colors.warning.text
          )}>
            {a.studentName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="font-medium text-sm">{a.studentName}</p>
            <p className="text-xs text-muted-foreground">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "group",
      header: "Proposed Group",
      render: (a) => (
        <div>
          <p className="font-medium text-sm">{a.proposedGroupName || "Not specified"}</p>
          <p className="text-xs text-muted-foreground">Requested {a.requestedAt}</p>
        </div>
      ),
    },
    {
      key: "motivation",
      header: "Motivation",
      render: (a) => (
        <p className="line-clamp-2 text-sm text-muted-foreground max-w-[200px]">
          {a.motivation}
        </p>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (a) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
            <Link href={`/dashboard/department-head/grades/${a.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Review &amp; Approval
            </h1>
            <p className="text-muted-foreground mt-1">
              Review and manage grades, applications, and project groups
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Groups"
            value={stats.totalGroups}
            icon={Users}
            trend={{ value: 12, positive: true }}
            description="Active project groups"
          />
          <StatsCard
            title="Pending Grades"
            value={stats.pendingGrades}
            icon={Clock}
            color="warning"
            description="Awaiting approval"
          />
          <StatsCard
            title="Applications"
            value={stats.pendingApplications}
            icon={UserPlus}
            color="info"
            description="Group manager requests"
          />
          <StatsCard
            title="Average Score"
            value={`${stats.averageScore}%`}
            icon={Award}
            color="success"
            trend={{ value: 5, positive: true }}
            description="Overall performance"
          />
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  activeSection === "overview"
                    ? "Search groups..."
                    : activeSection === "grades"
                      ? "Search students or grade IDs..."
                      : "Search applications..."
                }
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "relative px-4 py-2 rounded-none border-b-2 transition-all",
              activeSection === "overview" 
                ? "border-primary text-foreground" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveSection("overview")}
          >
            <GraduationCap className="h-4 w-4 inline mr-2" />
            Overview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "relative px-4 py-2 rounded-none border-b-2 transition-all",
              activeSection === "grades" 
                ? "border-primary text-foreground" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveSection("grades")}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Grades
            {pendingGrades.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingGrades.length}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "relative px-4 py-2 rounded-none border-b-2 transition-all",
              activeSection === "applications" 
                ? "border-primary text-foreground" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveSection("applications")}
          >
            <UserPlus className="h-4 w-4 inline mr-2" />
            Applications
            {pendingApplications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingApplications.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Content Sections */}
        <div className="space-y-4">
          {activeSection === "overview" && (
            <>
              {/* Groups Overview */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Project Groups</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage and monitor all active project groups
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {mockStudentGroups
                      .filter((group) => {
                        if (!searchQuery.trim()) return true
                        const q = searchQuery.toLowerCase()
                        return (
                          group.name.toLowerCase().includes(q) ||
                          group.projectTitle.toLowerCase().includes(q) ||
                          group.managerName.toLowerCase().includes(q)
                        )
                      })
                      .map((group) => (
                      <Card key={group.id} className="overflow-hidden border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <h3 className="font-semibold">{group.name}</h3>
                                  <Badge variant="outline" className={colors.success.text}>
                                    {group.members.length} members
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {group.projectTitle}
                                </p>
                                
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{group.managerName}</span>
                                  </div>
                                  <StatusBadge status={group.status} />
                                </div>
                              </div>

                              <Button variant="ghost" size="sm" className="gap-2" asChild>
                                <Link href={`/dashboard/department-head/grades/group-${group.id}`}>
                                  Details
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>

                            <div className="border-t pt-4">
                              <p className="text-xs font-medium text-muted-foreground mb-3">
                                Team Members
                              </p>
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {group.members.slice(0, 3).map((member) => (
                                  <MemberBadge
                                    key={member.id}
                                    name={member.name}
                                    role={member.role}
                                    isManager={member.isManager}
                                  />
                                ))}
                                {group.members.length > 3 && (
                                  <Button variant="outline" size="sm" className="text-muted-foreground">
                                    +{group.members.length - 3} more
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === "grades" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pending Review &amp; Approvals</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review and approve or reject submitted grades
                  </p>
                </div>
                {/* Single-grade actions are available in the table below */}
              </CardHeader>
              <CardContent className="p-0">
                {pendingGrades.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className={cn("rounded-full p-4", colors.success.bg)}>
                      <CheckCircle className={cn("h-8 w-8", colors.success.text)} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      No pending grades to review. New submissions will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      <DataTable data={filteredGrades} columns={gradeColumns} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === "applications" && (
            <Card>
              <CardHeader>
                <CardTitle>Group Leader Applications</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Students requesting to become group leaders
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {pendingApplications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className={cn("rounded-full p-4", colors.info.bg)}>
                      <UserPlus className={cn("h-8 w-8", colors.info.text)} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No pending applications</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      When students apply to be group leaders, they&apos;ll appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[900px]">
                      <DataTable data={filteredApplications} columns={applicationColumns} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}