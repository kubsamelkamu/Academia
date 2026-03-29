"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Users,
  FolderOpen,
  ClipboardCheck,
  UserCheck,
  Download,
  Eye,
  RefreshCw,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  BarChart3,
  Filter,
  Search,
  ChevronRight,
  MoreVertical,
  Star,
  Activity,
  Clock,
  Sparkles,
  Rocket,
  Brain,
  Zap,
  Target,
  Shield,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  PieChart,
  LineChart,
  Users2,
  GraduationCap,
  BookOpen,
  Layers,
  Grid3x3,
  LayoutGrid,
  List,
  Settings,
  Bell,
  HelpCircle,
  Menu,
  X,
  MessageSquare,
} from "lucide-react"
import {
  mockGrades,
  type Grade,
} from "@/data/mockData"
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
  phone?: string
  location?: string
}

type MetricCardProps = {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  trend?: "up" | "down" | "neutral"
  color?: string
  onClick?: () => void
}

type ActivityItem = {
  id: string
  type: "submission" | "approval" | "comment" | "milestone" | "grade"
  title: string
  description: string
  user: string
  userAvatar?: string
  time: string
  status?: "pending" | "completed" | "warning"
}

// ============================================================================
// CONSTANTS & HELPERS
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

function getRoleIcon(role: string) {
  switch (role.toLowerCase()) {
    case "student": return <GraduationCap className="h-3 w-3 text-muted-foreground" />
    case "advisor": return <UserCheck className="h-3 w-3 text-muted-foreground" />
    case "coordinator": return <ClipboardCheck className="h-3 w-3 text-muted-foreground" />
    case "department head": return <Star className="h-3 w-3 text-muted-foreground" />
    default: return <Users className="h-3 w-3 text-muted-foreground" />
  }
}

function getRoleGradient(role: string) {
  switch (role.toLowerCase()) {
    case "student": return "from-blue-500 to-cyan-500"
    case "advisor": return "from-emerald-500 to-teal-500"
    case "coordinator": return "from-purple-500 to-pink-500"
    case "department head": return "from-amber-500 to-orange-500"
    default: return "from-gray-500 to-gray-600"
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "active": return "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800"
    case "inactive": return "bg-gray-500/10 text-gray-600 border-gray-200 dark:border-gray-800"
    case "pending": return "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800"
    default: return "bg-gray-500/10 text-gray-600"
  }
}

// ============================================================================
// CUSTOM COMPONENTS
// ============================================================================

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, trend, color, onClick }) => (
  <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-xl",
        onClick && "hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                <TrendingUp className={cn(
                  "h-3 w-3",
                  trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-gray-500"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-gray-500"
                )}>
                  {change > 0 ? `+${change}%` : `${change}%`}
                </span>
              </div>
            )}
          </div>
          <div className={cn(
            "rounded-2xl p-3 bg-gradient-to-br",
            color || "from-primary/20 to-primary/10"
          )}>
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

const ActivityFeed: React.FC<{ activities: ActivityItem[] }> = ({ activities }) => (
  <ScrollArea className="h-[400px] pr-4">
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-6">
        {activities.map((activity, idx) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative pl-10"
          >
            <div className="absolute left-0 top-1">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
                activity.status === "completed" ? "border-emerald-500" :
                activity.status === "warning" ? "border-amber-500" : "border-primary"
              )}>
                {activity.type === "submission" && <FileText className="h-4 w-4" />}
                {activity.type === "approval" && <CheckCircle2 className="h-4 w-4" />}
                {activity.type === "comment" && <MessageSquare className="h-4 w-4" />}
                {activity.type === "milestone" && <Target className="h-4 w-4" />}
                {activity.type === "grade" && <Award className="h-4 w-4" />}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{activity.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">
                          {activity.user.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{activity.user}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                </div>
                {activity.status && (
                  <Badge variant={activity.status === "completed" ? "default" : "outline"}>
                    {activity.status}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </ScrollArea>
)

const TeamMemberCard: React.FC<{ member: DepartmentUserRow; isCurrentUser?: boolean }> = ({ member, isCurrentUser }) => (
  <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
    <Card className="overflow-hidden">
      <div className={cn(
        "h-2 bg-gradient-to-r",
        getRoleGradient(member.role)
      )} />
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarImage src={member.avatarUrl ?? undefined} />
            <AvatarFallback className={cn(
              "bg-gradient-to-br text-white text-lg",
              getRoleGradient(member.role)
            )}>
              {member.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{member.name}</p>
              {isCurrentUser && (
                <Badge variant="secondary" className="text-[10px]">You</Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {getRoleIcon(member.role)}
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{member.email}</p>
            {member.projectsCount !== undefined && (
              <div className="flex items-center gap-1.5 mt-2">
                <FolderOpen className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">{member.projectsCount} projects</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

const GradeReviewCard: React.FC<{ grade: Grade; onApprove: () => void; onReject: () => void }> = ({ 
  grade, onApprove, onReject 
}) => (
  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
    <Card className="group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{grade.studentName}</p>
                    {/* <p className="text-sm text-muted-foreground truncate">{grade.projectTitle}</p> */}
              <div className="flex items-center gap-2 mt-1">
                <Progress value={grade.finalScore} className="h-1.5 w-24" />
                <span className="text-xs font-medium">{grade.finalScore}%</span>
                <Badge variant="outline" className="text-xs">{grade.grade}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" className="h-8 text-emerald-600" onClick={onApprove}>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-red-600" onClick={onReject}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DepartmentHeadDashboard() {
  const authUser = useAuthStore((s) => s.user)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState("all")
  const [userStatusFilter, setUserStatusFilter] = useState("all")
  const [usersPage, setUsersPage] = useState(1)
  const [activeTab, setActiveTab] = useState("overview")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showNotifications, setShowNotifications] = useState(false)
  
  const {
    data: tenantUsers = [],
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
    isFetching: isUsersFetching,
  } = useTenantUsers()
  
  const { data: projectGroupsPage, isLoading: isProjectsLoading } = useBrowseProjectGroups({
    enabled: true,
    page: 1,
    limit: 1,
  })
  
  const { data: pendingInvitations = [], isLoading: isPendingInvitationsLoading } =
    useTenantInvitationsList({ status: "PENDING" })

  const departmentName = authUser?.departmentName ?? authUser?.department?.name ?? "Software Engineering"
  const universityName = authUser?.tenant?.name ?? "Haramaya University"
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
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
          phone: "+251-9XX-XXX-XXX",
          location: "Addis Ababa, Ethiopia",
        }
      }),
    [tenantUsers, departmentName]
  )

  const filteredDashboardUsers = useMemo(
    () =>
      dashboardUsers.filter((user) => {
        const search = userSearchQuery.trim().toLowerCase()
        const matchesSearch = search.length === 0 ||
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)

        const matchesRole = userRoleFilter === "all" || 
          user.role.toLowerCase().replace(/\s+/g, "_") === userRoleFilter

        const matchesStatus = userStatusFilter === "all" || user.status === userStatusFilter

        return matchesSearch && matchesRole && matchesStatus
      }),
    [dashboardUsers, userRoleFilter, userSearchQuery, userStatusFilter]
  )

  const activities: ActivityItem[] = useMemo(() => [
    {
      id: "1",
      type: "submission",
      title: "New project proposal submitted",
      description: "Group 5 submitted their project proposal for AI-Driven Healthcare System",
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
  ], [])

  const activeStudentsCount = tenantUsers.filter((u) => {
    const role = (u.roles?.[0]?.role?.name ?? "").toLowerCase()
    const isActive = (u.status ?? "").toUpperCase() === "ACTIVE"
    return isActive && role === "student"
  }).length

  const activeAdvisorsCount = tenantUsers.filter((u) => {
    const role = (u.roles?.[0]?.role?.name ?? "").toLowerCase()
    const isActive = (u.status ?? "").toUpperCase() === "ACTIVE"
    return isActive && role === "advisor"
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

  const handleApproveGrade = useCallback((gradeId: string) => {
    const grade = mockGrades.find((g) => g.id === gradeId)
    toast.success("Grade approved", {
      description: grade ? `${grade.studentName}'s grade has been approved.` : "Grade approved.",
      duration: 4000,
    })
  }, [])

  const handleRejectGrade = useCallback((gradeId: string) => {
    const grade = mockGrades.find((g) => g.id === gradeId)
    toast.warning("Grade rejected", {
      description: grade ? `${grade.studentName}'s grade has been rejected.` : "Grade rejected.",
      duration: 4000,
    })
  }, [])

  const metrics = [
    { title: "Active Students", value: activeStudentsCount, change: 12, trend: "up" as const, icon: GraduationCap },
    { title: "Faculty Advisors", value: activeAdvisorsCount, change: 2, trend: "up" as const, icon: UserCheck },
    { title: "Active Projects", value: activeProjectsCount, change: 5, trend: "up" as const, icon: FolderOpen },
    { title: "Pending Reviews", value: pendingApprovalsCount, change: -3, trend: "down" as const, icon: ClipboardCheck },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 mb-6">
        <div className="absolute right-0 top-0 opacity-10">
          <Sparkles className="h-64 w-64" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  Academic Year 2024–2025
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {currentDate}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome back, {authUser?.firstName || "Department Head"}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Here&apos;s what&apos;s happening with your department today. Monitor progress, review submissions, 
                and guide your team toward excellence.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => refetchUsers()}>
                <RefreshCw className={cn("h-4 w-4", isUsersFetching && "animate-spin")} />
                Refresh
              </Button>
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                <Rocket className="h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {metrics.map((metric, idx) => (
          <MetricCard
            key={metric.title}
            {...metric}
            onClick={() => metric.title === "Pending Reviews" && setActiveTab("grades")}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Message with Insights */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Department Insights</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your department is performing above average. Completion rate is {completionRate.toFixed(0)}% 
                    with {activeProjectsCount} active projects. {pendingApprovalsCount} items require your attention.
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-muted-foreground">On track: 78%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-xs text-muted-foreground">At risk: 15%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-xs text-muted-foreground">Delayed: 7%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full justify-start bg-muted/50 p-1">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2">
                <Users2 className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="grades" className="gap-2">
                <Award className="h-4 w-4" />
                Grades
                {pendingProjectGrades.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1 text-[10px]">
                    {pendingProjectGrades.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-0">
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
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                      <Link href="/dashboard/department-head/invitations">
                        <Mail className="h-4 w-4" />
                        Invite New Users
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                      <Link href="/dashboard/department-head/grades">
                        <ClipboardCheck className="h-4 w-4" />
                        Review Pending Grades
                        {pendingProjectGrades.length > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {pendingProjectGrades.length}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                      <Link href="/dashboard/department-head/reports">
                        <FileText className="h-4 w-4" />
                        Generate Reports
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                      <Link href="/dashboard/department-committee/assigned-projects">
                        <Shield className="h-4 w-4" />
                        DC Committee Dashboard
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Performance Overview */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Performance Overview
                    </CardTitle>
                    <CardDescription>Key metrics at a glance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Grade Completion</span>
                        <span className="font-medium">{completionRate.toFixed(0)}%</span>
                      </div>
                      <Progress value={completionRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Project Progress</span>
                        <span className="font-medium">68%</span>
                      </div>
                      <Progress value={68} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{approvedGrades.length}</p>
                        <p className="text-xs text-muted-foreground">Approved Grades</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">{pendingProjectGrades.length}</p>
                        <p className="text-xs text-muted-foreground">Pending Review</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Feed */}
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
                    <Button variant="ghost" size="sm" className="gap-1">
                      View All
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ActivityFeed activities={activities} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="border-b">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="text-base">Department Members</CardTitle>
                      <CardDescription>{filteredDashboardUsers.length} active members</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search members..."
                          value={userSearchQuery}
                          onChange={(e) => {
                            setUserSearchQuery(e.target.value)
                            setUsersPage(1)
                          }}
                          className="pl-9 w-48"
                        />
                      </div>
                      <select
                        value={userRoleFilter}
                        onChange={(e) => {
                          setUserRoleFilter(e.target.value)
                          setUsersPage(1)
                        }}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="all">All Roles</option>
                        <option value="advisor">Advisor</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="student">Student</option>
                      </select>
                      <div className="flex border rounded-md">
                        <Button
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          size="icon"
                          className="h-9 w-9 rounded-none rounded-l-md"
                          onClick={() => setViewMode("grid")}
                        >
                          <Grid3x3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "ghost"}
                          size="icon"
                          className="h-9 w-9 rounded-none rounded-r-md"
                          onClick={() => setViewMode("list")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  {isUsersLoading ? (
                    <div className="text-center py-8">Loading team members...</div>
                  ) : filteredDashboardUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No members found</div>
                  ) : (
                    <>
                      <div className={cn(
                        "grid gap-4",
                        viewMode === "grid" 
                          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                          : "grid-cols-1"
                      )}>
                        {pagedDashboardUsers.map((member) => (
                          <TeamMemberCard 
                            key={member.id} 
                            member={member} 
                            isCurrentUser={member.id === authUser?.id}
                          />
                        ))}
                      </div>
                      {usersTotalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            Showing {((safeUsersPage - 1) * DASHBOARD_USERS_PAGE_SIZE) + 1} to{" "}
                            {Math.min(safeUsersPage * DASHBOARD_USERS_PAGE_SIZE, filteredDashboardUsers.length)} of{" "}
                            {filteredDashboardUsers.length}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                              disabled={safeUsersPage <= 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))}
                              disabled={safeUsersPage >= usersTotalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grades Tab */}
            <TabsContent value="grades" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Grade Review Queue</CardTitle>
                      <CardDescription>
                        {pendingProjectGrades.length} grades awaiting your approval
                      </CardDescription>
                    </div>
                    {pendingProjectGrades.length > 0 && (
                      <Button size="sm" onClick={handleApproveGrades} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Approve All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {pendingProjectGrades.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20 mb-4">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                      </div>
                      <p className="text-muted-foreground">All grades have been reviewed</p>
                      <p className="text-sm text-muted-foreground mt-1">No pending grades require your attention</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingProjectGrades.slice(0, 8).map((grade) => (
                        <GradeReviewCard
                          key={grade.id}
                          grade={grade}
                          onApprove={() => handleApproveGrade(grade.id)}
                          onReject={() => handleRejectGrade(grade.id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Department Profile Card */}
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            <CardContent className="text-center -mt-12">
              <Avatar className="h-24 w-24 mx-auto border-4 border-background shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-2xl text-white">
                  {departmentName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg mt-3">{departmentName}</h3>
              <p className="text-sm text-muted-foreground">{universityName}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="secondary">Active</Badge>
                <Badge variant="outline">{activeProjectsCount} Projects</Badge>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{activeStudentsCount} Students</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span>{activeAdvisorsCount} Advisors</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Addis Ababa, Ethiopia</span>
                </div>
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
            <CardContent className="space-y-3">
              {[
                { title: "Final Project Submission", date: "May 15, 2025", daysLeft: 12, urgent: false },
                { title: "Grade Approval Deadline", date: "May 20, 2025", daysLeft: 17, urgent: false },
                { title: "DC Committee Review", date: "May 25, 2025", daysLeft: 22, urgent: false },
                { title: "Academic Board Meeting", date: "June 1, 2025", daysLeft: 29, urgent: false },
              ].map((deadline, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{deadline.title}</p>
                    <p className="text-xs text-muted-foreground">{deadline.date}</p>
                  </div>
                  <Badge variant={deadline.urgent ? "destructive" : "outline"}>
                    {deadline.daysLeft} days
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Completion Rate</span>
                <span className="text-sm font-semibold">{completionRate.toFixed(0)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{approvedGrades.length}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{pendingProjectGrades.length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DC Committee CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary p-3">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">DC Committee Member Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Review project titles and final evaluations as a committee member
                  </p>
                </div>
              </div>
              <Button asChild className="gap-2 shrink-0">
                <Link href="/dashboard/department-committee/assigned-projects">
                  Access DC Committee
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}