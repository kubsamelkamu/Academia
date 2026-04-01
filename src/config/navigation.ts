import {
  LayoutDashboard,
  User,
  Users,
  FolderKanban,
  UserCheck,
  Calendar,
  FileText,
  Settings,
  ClipboardList,
  GraduationCap,
  CheckSquare,
  ClipboardCheck,
  Clock,
  Bell,
  Megaphone,
  MessageSquare,
  Edit,
  AlertTriangle,
  BarChart,
  Calculator,
  type LucideIcon,
} from "lucide-react"

export type UserRole = "department_head" | "coordinator" | "advisor" | "student" | "department_committee" | "evaluator"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
  children?: NavItem[]
}

export const navigationConfig: Record<UserRole, NavItem[]> = {
  department_head: [
    {
      title: "Dashboard",
      href: "/dashboard/department-head",
      icon: LayoutDashboard,
    },
    {
      title: "Invitations",
      href: "/dashboard/department-head/invitations",
      icon: Users,
    },
    {
      title: "Faculty",
      href: "/dashboard/department-head/faculty",
      icon: UserCheck,
    },
    {
      title: "Review & Approval",
      href: "/dashboard/department-head/grades",
      icon: ClipboardCheck,
    },
    {
      title: "Projects Overview",
      href: "/dashboard/department-head/projects",
      icon: FolderKanban,
    },
    {
      title: "Reports",
      href: "/dashboard/department-head/reports",
      icon: FileText,
    },
    {
      title: "Announcements",
      href: "/dashboard/department-head/announcements",
      icon: Megaphone,
    },
    {
      title: "Verification",
      href: "/dashboard/verify-institution",
      icon: CheckSquare,
    },
    {
      title: "Messages",
      href: "/dashboard/department-head/messages",
      icon: FileText,
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ],
  coordinator: [
    {
      title: "Dashboard",
      href: "/dashboard/coordinator",
      icon: LayoutDashboard,
    },
    {
      title: "Assignments",
      href: "/dashboard/coordinator/projects",
      icon: FolderKanban,
    },
    {
      title: "Complaints",
      href: "/dashboard/coordinator/complaints",
      icon: AlertTriangle,
    },
    {
      title: "Advisor Progress",
      href: "/dashboard/coordinator/advisor-progress",
      icon: BarChart,
    },
    {
      title: "Grade Management",
      href: "/dashboard/coordinator/grade-management",
      icon: Calculator,
    },
    {
      title: "Messages",
      href: "/dashboard/coordinator/messages",
      icon: MessageSquare,
    },
    {
      title: "Title Management",
      href: "/dashboard/coordinator/title-management",
      icon: Edit,
    },
    {
      title: "Reports",
      href: "/dashboard/coordinator/reports",
      icon: FileText,
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ],
  advisor: [
    {
      title: "Dashboard",
      href: "/dashboard/advisor",
      icon: LayoutDashboard,
    },
    {
      title: "My Projects",
      href: "/dashboard/advisor/my-projects",
      icon: FolderKanban,
    },
    {
      title: "Clear",
      href: "/dashboard/advisor/students",
      icon: GraduationCap,
    },
    {
      title: "Evaluations",
      href: "/dashboard/advisor/evaluations",
      icon: ClipboardList,
    },
    {
      title: "Schedule",
      href: "/dashboard/advisor/schedule",
      icon: Calendar,
    },
    {
      title: "Messages",
      href: "/dashboard/advisor/messages",
      icon: FileText,
    },
    {
      title: "Announcements",
      href: "/dashboard/advisor/announcements",
      icon: Megaphone,
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
  ],
  student: [
    {
      title: "Dashboard",
      href: "/dashboard/student",
      icon: LayoutDashboard,
    },
    {
      title: "Team",
      href: "/dashboard/student/team",
      icon: Users,
    },
    {
      title: "My Project",
      href: "/dashboard/student/my-project",
      icon: FolderKanban,
    },
    {
      title: "Milestones",
      href: "/dashboard/student/milestones",
      icon: Calendar,
    },
    {
      title: "Submissions",
      href: "/dashboard/student/submissions",
      icon: FileText,
    },
    {
      title: "Timeline",
      href: "/dashboard/student/timeline",
      icon: Clock,
    },
    {
      title: "Defense",
      href: "/dashboard/student/defense",
      icon: Calendar,
    },
    {
      title: "Messages",
      href: "/dashboard/student/messages",
      icon: FileText,
    },
    {
      title: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
  ],
  department_committee: [
    {
      title: "Dashboard",
      href: "/dashboard/department-committee",
      icon: LayoutDashboard,
    },
    {
      title: "Assigned Projects",
      href: "/dashboard/department-committee/assigned-projects",
      icon: FolderKanban,
    },
    {
      title: "Evaluations",
      href: "/dashboard/department-committee/evaluations",
      icon: CheckSquare,
    },
    {
      title: "Defense Schedule",
      href: "/dashboard/department-committee/defense-schedule",
      icon: Calendar,
    },
    {
      title: "Reports",
      href: "/dashboard/department-committee/reports",
      icon: FileText,
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
  ],
  evaluator: [
    {
      title: "Dashboard",
      href: "/dashboard/evaluator",
      icon: LayoutDashboard,
    },
    {
      title: "Assigned Projects",
      href: "/dashboard/evaluator/assigned-projects",
      icon: FolderKanban,
    },
    {
      title: "Evaluations",
      href: "/dashboard/evaluator/evaluations",
      icon: CheckSquare,
    },
    {
      title: "Schedule",
      href: "/dashboard/evaluator/schedule",
      icon: Calendar,
    },
    {
      title: "Reports",
      href: "/dashboard/evaluator/reports",
      icon: FileText,
    },
    {
      title: "Messages",
      href: "/dashboard/evaluator/messages",
      icon: MessageSquare,
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
  ],
}
