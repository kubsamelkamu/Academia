"use client"

import React, { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  FolderOpen,
  ClipboardCheck,
  UserCheck,
  RefreshCw,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  ChevronRight,
  Star,
  Activity,
  Clock,
  Rocket,
  Zap,
  Target,
  Shield,
  Mail,
  MapPin,
  Users2,
  GraduationCap,
  Grid3x3,
  LayoutGrid,
  List,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  Send,
} from "lucide-react"
import { mockGrades } from "@/data/mockData"
import { useTenantUsers } from "@/lib/hooks/use-users"
import { useBrowseProjectGroups } from "@/lib/hooks/use-project-groups"
import { useTenantInvitationsList } from "@/lib/hooks/use-invitations"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

type DepartmentUserRow = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  role: string
  status: string
  joinedAt?: string
  projectsCount?: number
  department?: string
}

type ActivityItem = {
  id: string
  type: "submission" | "approval" | "comment" | "milestone" | "grade"
  title: string
  description: string
  user: string
  time: string
  status?: "pending" | "completed" | "warning"
}

// ============================================================================
// HELPERS
// ============================================================================

const DASHBOARD_USERS_PAGE_SIZE = 6

function mapDashboardRoleLabel(roleName?: string): string {
  const normalized = (roleName ?? "").toLowerCase()
  if (normalized === "departmenthead") return "Department Head"
  if (normalized === "coordinator") return "Coordinator"
  if (normalized === "advisor") return "Advisor"
  if (normalized === "student") return "Student"
  return roleName ?? "Unknown"
}


const activityIcons: Record<ActivityItem["type"], React.ReactNode> = {
  submission: <FileText className="h-3.5 w-3.5" />,
  approval: <CheckCircle2 className="h-3.5 w-3.5" />,
  comment: <MessageSquare className="h-3.5 w-3.5" />,
  milestone: <Target className="h-3.5 w-3.5" />,
  grade: <Award className="h-3.5 w-3.5" />,
}

const activityStatusColor: Record<string, string> = {
  completed: "text-emerald-600",
  warning: "text-amber-600",
  pending: "text-primary",
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DepartmentHeadDashboard() {
  const authUser = useAuthStore((s) => s.user)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState("all")
  const [usersPage, setUsersPage] = useState(1)
  const [activeTab, setActiveTab] = useState("overview")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // ── User action dialog state ──
  const [detailUser, setDetailUser] = useState<DepartmentUserRow | null>(null)
  const [editUser, setEditUser] = useState<DepartmentUserRow | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")
  const [emailUser, setEmailUser] = useState<DepartmentUserRow | null>(null)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [deleteUser, setDeleteUser] = useState<DepartmentUserRow | null>(null)
  
  const {
    data: tenantUsers = [],
    isLoading: isUsersLoading,
    isFetching: isUsersFetching,
    refetch: refetchUsers,
  } = useTenantUsers()
  
  const { data: projectGroupsPage } = useBrowseProjectGroups({
    enabled: true,
    page: 1,
    limit: 1,
  })
  
  const { data: pendingInvitations = [] } =
    useTenantInvitationsList({ status: "PENDING" })

  const departmentName = authUser?.departmentName ?? authUser?.department?.name ?? "Software Engineering"
  const universityName = authUser?.tenant?.name ?? "Haramaya University"
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const pendingProjectGrades = mockGrades.filter((g) => g.status === "provisional")
  const approvedGrades = mockGrades.filter((g) => g.status === "final")
  const completionRate = (approvedGrades.length / mockGrades.length) * 100

  const dashboardUsers = useMemo<DepartmentUserRow[]>(
    () =>
      tenantUsers.map((user) => {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
        const roleName = user.roles?.[0]?.role?.name
        return {
          id: user.id,
          name: fullName.length > 0 ? fullName : user.email,
          email: user.email,
          avatarUrl: user.avatarUrl ?? null,
          role: mapDashboardRoleLabel(roleName),
          status: (user.status ?? "UNKNOWN").toLowerCase(),
          joinedAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : undefined,
          department: departmentName,
        }
      }),
    [tenantUsers, departmentName]
  )

  const filteredDashboardUsers = useMemo(
    () =>
      dashboardUsers.filter((user) => {
        const search = userSearchQuery.trim().toLowerCase()
        const matchesSearch =
          search.length === 0 ||
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
        const matchesRole =
          userRoleFilter === "all" ||
          user.role.toLowerCase().replace(/\s+/g, "_") === userRoleFilter
        return matchesSearch && matchesRole
      }),
    [dashboardUsers, userRoleFilter, userSearchQuery]
  )

  const activities: ActivityItem[] = useMemo(
    () => [
    {
      id: "1",
      type: "submission",
      title: "New project proposal submitted",
        description: "Group 5 submitted their proposal for AI-Driven Healthcare System",
      user: "Group 5",
      time: "2 hours ago",
      status: "pending",
    },
    {
      id: "2",
      type: "approval",
      title: "Grade approval completed",
      description: "Project grades for Group 3 have been approved",
      user: "Dr. Sarah Johnson",
      time: "5 hours ago",
      status: "completed",
    },
    {
      id: "3",
      type: "comment",
      title: "Feedback provided",
      description: "Advisor provided feedback on Software Requirements Specification",
      user: "Prof. Michael Chen",
      time: "1 day ago",
      status: "completed",
    },
    {
      id: "4",
      type: "milestone",
      title: "Milestone achieved",
      description: "Group 2 completed System Design Document",
      user: "Group 2",
      time: "2 days ago",
      status: "completed",
    },
    {
      id: "5",
      type: "grade",
      title: "Grades pending review",
      description: "4 project grades awaiting department head approval",
      user: "Coordinator",
      time: "3 days ago",
      status: "warning",
    },
    ],
    []
  )

  const activeStudentsCount = tenantUsers.filter((u) => {
    const role = (u.roles?.[0]?.role?.name ?? "").toLowerCase()
    return (u.status ?? "").toUpperCase() === "ACTIVE" && role === "student"
  }).length

  const activeAdvisorsCount = tenantUsers.filter((u) => {
    const role = (u.roles?.[0]?.role?.name ?? "").toLowerCase()
    return (u.status ?? "").toUpperCase() === "ACTIVE" && role === "advisor"
  }).length

  const activeProjectsCount = projectGroupsPage?.pagination.total ?? 0
  const pendingApprovalsCount = pendingInvitations.length

  const usersTotalPages = Math.max(1, Math.ceil(filteredDashboardUsers.length / DASHBOARD_USERS_PAGE_SIZE))
  const safeUsersPage = Math.min(usersPage, usersTotalPages)
  const pagedDashboardUsers = filteredDashboardUsers.slice(
    (safeUsersPage - 1) * DASHBOARD_USERS_PAGE_SIZE,
    safeUsersPage * DASHBOARD_USERS_PAGE_SIZE
  )

  const handleApproveGrades = useCallback(() => {
    toast.success("Grades approved for publication", {
      description: "All provisional grades have been marked as approved.",
      duration: 5000,
    })
  }, [])

  const openEdit = useCallback((user: DepartmentUserRow) => {
    setEditUser(user)
    setEditName(user.name)
    setEditRole(user.role)
  }, [])

  const openEmail = useCallback((user: DepartmentUserRow) => {
    setEmailUser(user)
    setEmailSubject("")
    setEmailBody("")
  }, [])

  const handleSendEmail = useCallback(() => {
    if (!emailUser) return
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error("Please fill in both subject and message.")
      return
    }
    toast.success(`Email sent to ${emailUser.name}`, {
      description: `Subject: ${emailSubject}`,
    })
    setEmailUser(null)
  }, [emailUser, emailSubject, emailBody])

  const handleSaveEdit = useCallback(() => {
    if (!editUser) return
    toast.success(`Profile updated for ${editName}`)
    setEditUser(null)
  }, [editUser, editName])

  const handleDeactivate = useCallback(() => {
    if (!deleteUser) return
    toast.success(`${deleteUser.name} has been deactivated`)
    setDeleteUser(null)
  }, [deleteUser])

  const handleApproveGrade = useCallback((gradeId: string) => {
    const grade = mockGrades.find((g) => g.id === gradeId)
    toast.success("Grade approved", {
      description: grade ? `${grade.studentName}'s grade has been approved.` : "Grade approved.",
    })
  }, [])

  const handleRejectGrade = useCallback((gradeId: string) => {
    const grade = mockGrades.find((g) => g.id === gradeId)
    toast.warning("Grade rejected", {
      description: grade ? `${grade.studentName}'s grade has been rejected.` : "Grade rejected.",
    })
  }, [])

  const kpiCards = [
    {
      title: "Active Students",
      value: activeStudentsCount,
      sub: `+12% this semester`,
      icon: GraduationCap,
      href: "/dashboard/department-head/faculty",
    },
    {
      title: "Faculty Advisors",
      value: activeAdvisorsCount,
      sub: `${activeAdvisorsCount} currently active`,
      icon: UserCheck,
      href: "/dashboard/department-head/faculty",
    },
    {
      title: "Active Projects",
      value: activeProjectsCount,
      sub: `${completionRate.toFixed(0)}% completion rate`,
      icon: FolderOpen,
      href: "/dashboard/department-head/projects",
    },
    {
      title: "Pending Reviews",
      value: pendingApprovalsCount,
      sub: pendingApprovalsCount > 0 ? "Requires your attention" : "All clear",
      icon: ClipboardCheck,
      href: undefined as string | undefined,
      onClick: () => setActiveTab("grades"),
    },
  ]

  const deadlines = [
    { title: "Final Project Submission", date: "May 15, 2025", daysLeft: 12, urgent: false },
    { title: "Grade Approval Deadline", date: "May 20, 2025", daysLeft: 17, urgent: false },
    { title: "DC Committee Review", date: "May 25, 2025", daysLeft: 22, urgent: false },
    { title: "Academic Board Meeting", date: "June 1, 2025", daysLeft: 29, urgent: false },
  ]

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Welcome back, {authUser?.firstName || "Department Head"}
              </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {departmentName} · {universityName}
              </p>
            </div>
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <span className="hidden sm:inline text-xs text-muted-foreground">{currentDate}</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => refetchUsers()}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isUsersFetching && "animate-spin")} />
                Refresh
              </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/dashboard/department-head/reports">
              <Rocket className="h-3.5 w-3.5" />
              Reports
            </Link>
              </Button>
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const cardEl = (
            <Card
              key={card.title}
              className={cn(
                "transition-colors",
                (card.href || card.onClick) && "cursor-pointer hover:bg-muted/30 hover:border-muted-foreground/20"
              )}
              onClick={card.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            </CardContent>
          </Card>
          )
          if (card.href) {
            return (
              <Link key={card.title} href={card.href} className="block">
                {cardEl}
              </Link>
            )
          }
          return <React.Fragment key={card.title}>{cardEl}</React.Fragment>
        })}
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column ── Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full h-auto justify-start rounded-xl border border-border bg-muted/40 p-1.5 gap-1">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all
                  data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
                  data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-background/60"
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all
                  data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
                  data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-background/60"
              >
                <Users2 className="h-4 w-4 shrink-0" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger
                value="grades"
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all
                  data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
                  data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-background/60"
              >
                <Award className="h-4 w-4 shrink-0" />
                <span>Grades</span>
                {pendingProjectGrades.length > 0 && (
                  <Badge variant="destructive" className="ml-0.5 h-5 min-w-5 px-1.5 text-[10px] font-semibold">
                    {pendingProjectGrades.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ── */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Frequently used tools and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { href: "/dashboard/department-head/invitations", icon: Mail, label: "Invite New Users", badge: null },
                      {
                        href: "/dashboard/department-head/review",
                        icon: ClipboardCheck,
                        label: "Review Pending Grades",
                        badge: pendingProjectGrades.length > 0 ? pendingProjectGrades.length : null,
                      },
                      { href: "/dashboard/department-head/group-leader-requests", icon: Users2, label: "Group Leader Requests", badge: null },
                      { href: "/dashboard/department-head/announcements", icon: FileText, label: "Announcements", badge: null },
                      { href: "/dashboard/department-head/reports", icon: Target, label: "Generate Reports", badge: null },
                      { href: "/dashboard/department-committee/assigned-projects", icon: Shield, label: "DC Committee", badge: null },
                    ].map((action) => (
                      <Button
                        key={action.href}
                        variant="outline"
                        className="w-full justify-start gap-2 text-sm"
                        asChild
                      >
                        <Link href={action.href}>
                          <action.icon className="h-4 w-4 shrink-0" />
                          {action.label}
                          {action.badge !== null && (
                          <Badge variant="destructive" className="ml-auto">
                              {action.badge}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                    ))}
                  </CardContent>
                </Card>

                {/* Performance */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Performance
                    </CardTitle>
                    <CardDescription>Key metrics at a glance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">Grade Completion</span>
                        <span className="font-medium">{completionRate.toFixed(0)}%</span>
                      </div>
                      <Progress value={completionRate} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">Project Progress</span>
                        <span className="font-medium">68%</span>
                      </div>
                      <Progress value={68} className="h-1.5" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
                        <p className="text-xs text-muted-foreground">Approved</p>
                        <p className="mt-1 text-xl font-semibold text-emerald-600">{approvedGrades.length}</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                        <p className="text-xs text-muted-foreground">Pending Review</p>
                        <p className="mt-1 text-xl font-semibold text-amber-600">{pendingProjectGrades.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>Latest updates from your department</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" asChild>
                      <Link href="/dashboard/department-head/reports">
                      View All
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-y-auto max-h-72 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-6 pb-4 pt-2 space-y-2">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-lg bg-muted/40 px-3 py-2.5"
                    >
                      <div className={cn(
                        "mt-0.5 shrink-0",
                        activityStatusColor[activity.status ?? "pending"]
                      )}>
                        {activityIcons[activity.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{activity.user}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {activity.time}
                          </span>
                        </div>
                      </div>
                      {activity.status && (
                        <Badge
                          variant={activity.status === "completed" ? "default" : activity.status === "warning" ? "outline" : "secondary"}
                          className="capitalize text-[10px] shrink-0"
                        >
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Team Tab ── */}
            <TabsContent value="team" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="border-b pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base">Department Members</CardTitle>
                      <CardDescription>{filteredDashboardUsers.length} members</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Search..."
                          value={userSearchQuery}
                          onChange={(e) => { setUserSearchQuery(e.target.value); setUsersPage(1) }}
                          className="pl-8 h-8 w-40 text-sm"
                        />
                      </div>
                      <select
                        value={userRoleFilter}
                        onChange={(e) => { setUserRoleFilter(e.target.value); setUsersPage(1) }}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="all">All Roles</option>
                        <option value="advisor">Advisor</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="student">Student</option>
                      </select>
                      <div className="flex border rounded-md overflow-hidden">
                        <Button
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() => setViewMode("grid")}
                        >
                          <Grid3x3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "ghost"}
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() => setViewMode("list")}
                        >
                          <List className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {isUsersLoading ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Loading members…</p>
                  ) : filteredDashboardUsers.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No members found</p>
                  ) : viewMode === "list" ? (
                    <div className="space-y-2">
                        {pagedDashboardUsers.map((member) => (
                        <div
                            key={member.id} 
                          className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {member.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold truncate">{member.name}</p>
                                {member.id === authUser?.id && (
                                  <Badge variant="outline" className="text-[10px]">You</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="capitalize text-xs">{member.role}</Badge>
                            <Badge
                              variant={member.status === "active" ? "default" : "secondary"}
                              className="capitalize text-xs"
                            >
                              {member.status}
                            </Badge>
                          </div>
                        </div>
                        ))}
                      </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {pagedDashboardUsers.map((member) => (
                        <Card key={member.id} className="transition-shadow hover:shadow-lg overflow-hidden">
                          <CardContent className="pt-6 px-5">
                            {/* Top row: avatar + name/email + status badge */}
                            <div className="flex items-start gap-3">
                              <Avatar className="h-11 w-11 shrink-0">
                                <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-sm truncate">{member.name}</p>
                                  <Badge
                                    variant={member.status === "active" ? "default" : "secondary"}
                                    className="capitalize text-[10px] shrink-0"
                                  >
                                    {member.status}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground text-xs truncate mt-0.5">{member.email}</p>
                                {member.id === authUser?.id && (
                                  <Badge variant="outline" className="text-[10px] mt-1">You</Badge>
                                )}
                              </div>
                            </div>

                            {/* Meta row: role + department + joined */}
                            <div className="mt-3 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="capitalize text-xs">{member.role}</Badge>
                                {member.department && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">{member.department}</span>
                                )}
                              </div>
                              {member.joinedAt && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <UserCheck className="h-3 w-3 shrink-0" />
                                  <span className="truncate">Joined: {new Date(member.joinedAt).toLocaleDateString()}</span>
                                </p>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="mt-4 flex items-center justify-end gap-1 border-t pt-3">
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="View detail" onClick={() => setDetailUser(member)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(member)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Compose email" onClick={() => openEmail(member)}>
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Deactivate" onClick={() => setDeleteUser(member)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                      {usersTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        {(safeUsersPage - 1) * DASHBOARD_USERS_PAGE_SIZE + 1}–
                            {Math.min(safeUsersPage * DASHBOARD_USERS_PAGE_SIZE, filteredDashboardUsers.length)} of{" "}
                            {filteredDashboardUsers.length}
                          </p>
                          <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setUsersPage((p) => Math.max(1, p - 1))} disabled={safeUsersPage <= 1}>
                              Previous
                            </Button>
                        <Button variant="outline" size="sm" onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))} disabled={safeUsersPage >= usersTotalPages}>
                              Next
                            </Button>
                          </div>
                        </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Grades Tab ── */}
            <TabsContent value="grades" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Grade Review Queue</CardTitle>
                      <CardDescription>
                        {pendingProjectGrades.length} grades awaiting approval
                      </CardDescription>
                    </div>
                    {pendingProjectGrades.length > 0 && (
                      <Button size="sm" onClick={handleApproveGrades} className="gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {pendingProjectGrades.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20 mb-3">
                        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                      </div>
                      <p className="text-sm font-medium">All grades reviewed</p>
                      <p className="text-xs text-muted-foreground mt-1">No pending grades require your attention</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingProjectGrades.slice(0, 8).map((grade) => (
                        <div
                          key={grade.id}
                          className="group flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{grade.studentName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Progress value={grade.finalScore} className="h-1 w-20" />
                                <span className="text-xs text-muted-foreground">{grade.finalScore}%</span>
                                <Badge variant="outline" className="text-[10px]">{grade.grade}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleApproveGrade(grade.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRejectGrade(grade.id)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column ── Sidebar */}
        <div className="space-y-4">
          {/* Department Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-bold text-lg">
                  {departmentName.charAt(0)}
                </AvatarFallback>
              </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{departmentName}</p>
                  <p className="text-xs text-muted-foreground truncate">{universityName}</p>
              </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Separator />
              <div className="space-y-2 pt-1">
                {[
                  { icon: Users, label: `${activeStudentsCount} Students` },
                  { icon: UserCheck, label: `${activeAdvisorsCount} Advisors` },
                  { icon: FolderOpen, label: `${activeProjectsCount} Active Projects` },
                  { icon: MapPin, label: "Addis Ababa, Ethiopia" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">{label}</span>
                </div>
                ))}
                </div>
              <div className="flex gap-2 pt-1">
                <Badge variant="secondary" className="text-xs">Active</Badge>
                <Badge variant="outline" className="text-xs">AY 2024–2025</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>Critical dates to watch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {deadlines.map((deadline, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{deadline.title}</p>
                    <p className="text-xs text-muted-foreground">{deadline.date}</p>
                  </div>
                  <Badge variant={deadline.urgent ? "destructive" : "outline"} className="shrink-0 text-xs ml-2">
                    {deadline.daysLeft}d
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* DC Committee CTA */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-primary p-2 shrink-0">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">DC Committee Access</p>
                  <p className="text-xs text-muted-foreground">Review project evaluations</p>
                </div>
              </div>
              <Button asChild size="sm" className="w-full gap-1.5">
                <Link href="/dashboard/department-committee/assigned-projects">
                  Access DC Committee
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
           VIEW DETAIL DIALOG
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!detailUser} onOpenChange={(open) => { if (!open) setDetailUser(null) }}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          {detailUser && (
            <>
              {/* Profile header card */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pt-6 pb-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                    <AvatarImage src={detailUser.avatarUrl ?? undefined} alt={detailUser.name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                      {detailUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold truncate">{detailUser.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{detailUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="capitalize text-xs">{detailUser.role}</Badge>
                      <Badge variant={detailUser.status === "active" ? "default" : "secondary"} className="capitalize text-xs">
                        {detailUser.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info sections */}
              <div className="px-6 py-4 space-y-3">
                {/* Details card */}
                <Card className="border-border/60">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Profile Details
              </CardTitle>
            </CardHeader>
                  <CardContent className="px-4 pb-3 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Role</p>
                      <p className="font-medium capitalize">{detailUser.role}</p>
              </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                      <p className="font-medium capitalize">{detailUser.status}</p>
                </div>
                    {detailUser.department && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Department</p>
                        <p className="font-medium">{detailUser.department}</p>
                </div>
                    )}
                    {detailUser.joinedAt && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Member since</p>
                        <p className="font-medium">{detailUser.joinedAt}</p>
              </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions card */}
                <Card className="border-border/60">
                  <CardContent className="px-4 py-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => { setDetailUser(null); openEdit(detailUser) }}>
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => { setDetailUser(null); openEmail(detailUser) }}>
                      <Mail className="h-3.5 w-3.5" /> Email
                    </Button>
            </CardContent>
          </Card>
        </div>

              <div className="px-6 pb-5 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setDetailUser(null)}>Close</Button>
      </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
           EDIT DIALOG
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null) }}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          {editUser && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pt-6 pb-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-background shadow-md shrink-0">
                    <AvatarImage src={editUser.avatarUrl ?? undefined} alt={editUser.name} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {editUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{editUser.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{editUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Form card */}
              <div className="px-6 py-4">
                <Card className="border-border/60">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Edit Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Display Name</label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Role</label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="Advisor">Advisor</option>
                        <option value="Coordinator">Coordinator</option>
                        <option value="Student">Student</option>
                        <option value="Department Head">Department Head</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Email <span className="text-muted-foreground font-normal">(read-only)</span></label>
                      <Input value={editUser.email} disabled className="bg-muted/60 text-muted-foreground cursor-not-allowed" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="px-6 pb-5 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
           COMPOSE EMAIL DIALOG
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!emailUser} onOpenChange={(open) => { if (!open) setEmailUser(null) }}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          {emailUser && (
            <>
              {/* Email header bar */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pt-5 pb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-base leading-tight">New Message</p>
                  <p className="text-xs text-muted-foreground">Compose and send an email to this member</p>
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                {/* To / Recipient card */}
                <Card className="border-border/60">
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10 shrink-0">To</p>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={emailUser.avatarUrl ?? undefined} alt={emailUser.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                            {emailUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate">{emailUser.name}</span>
                        <span className="text-xs text-muted-foreground truncate hidden sm:block">&lt;{emailUser.email}&gt;</span>
                        <Badge variant="outline" className="text-[10px] capitalize ml-auto shrink-0">{emailUser.role}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compose card */}
                <Card className="border-border/60">
                  <CardContent className="px-4 pb-4 pt-3 space-y-3">
                    {/* Subject row */}
                    <div className="flex items-center gap-1.5 border-b pb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16 shrink-0">Subject</p>
                      <Separator orientation="vertical" className="h-4" />
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Enter subject…"
                        className="border-0 shadow-none focus-visible:ring-0 px-2 h-8 text-sm"
                      />
                    </div>
                    {/* Body */}
                    <Textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Write your message here…"
                      rows={6}
                      className="resize-none border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Footer toolbar */}
              <div className="px-6 pb-5 flex items-center justify-between gap-2 border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  {emailBody.length > 0
                    ? `${emailBody.length} character${emailBody.length !== 1 ? "s" : ""}`
                    : "Start typing your message"}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEmailUser(null)}>Discard</Button>
                  <Button size="sm" className="gap-1.5" onClick={handleSendEmail}>
                    <Send className="h-3.5 w-3.5" />
                    Send Email
              </Button>
            </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
           DEACTIVATE DIALOG
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!deleteUser} onOpenChange={(open) => { if (!open) setDeleteUser(null) }}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          {deleteUser && (
            <>
              {/* Danger header */}
              <div className="bg-gradient-to-br from-destructive/10 via-destructive/5 to-background px-6 pt-6 pb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <h2 className="text-lg font-bold text-destructive">Deactivate Member</h2>
                </div>
                <p className="text-sm text-muted-foreground">Access will be revoked. You can re-activate them later.</p>
              </div>

              <div className="px-6 py-4 space-y-3">
                {/* User identity card */}
                <Card className="border-border/60">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={deleteUser.avatarUrl ?? undefined} alt={deleteUser.name} />
                      <AvatarFallback className="bg-destructive/10 text-destructive font-bold">
                        {deleteUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{deleteUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{deleteUser.email}</p>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs ml-auto shrink-0">{deleteUser.role}</Badge>
          </CardContent>
        </Card>

                {/* Warning card */}
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="px-4 py-3">
                    <p className="text-sm text-destructive font-medium">
                      Are you sure you want to deactivate{" "}
                      <span className="font-bold">{deleteUser.name}</span>?
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      They will immediately lose access to all department resources, projects, and communications.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="px-6 pb-5 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteUser(null)}>Cancel</Button>
                <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleDeactivate}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Yes, Deactivate
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
