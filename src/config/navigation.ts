import {
  LayoutDashboard,
  Users,
  FolderKanban,
  UserCheck,
  Calendar,
  FileText,
  Settings,
  ClipboardList,
  GraduationCap,
  CheckSquare,
  Clock,
  type LucideIcon,
} from "lucide-react"

export type UserRole = "department_head" | "coordinator" | "advisor" | "student" | "department_committee"

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
      title: "Coordinators",
      href: "/dashboard/department-head/coordinators",
      icon: UserCheck,
    },
    {
      title: "Faculty",
      href: "/dashboard/department-head/faculty",
      icon: Users,
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
      title: "Verification",
      href: "/dashboard/verify-institution",
      icon: CheckSquare,
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
      title: "Projects",
      href: "/dashboard/coordinator/projects",
      icon: FolderKanban,
    },
    {
      title: "Students",
      href: "/dashboard/coordinator/students",
      icon: GraduationCap,
    },
    {
      title: "Advisors",
      href: "/dashboard/coordinator/advisors",
      icon: UserCheck,
    },
    {
      title: "Defenses",
      href: "/dashboard/coordinator/defenses",
      icon: Calendar,
    },
    {
      title: "Evaluations",
      href: "/dashboard/coordinator/evaluations",
      icon: ClipboardList,
    },
    {
      title: "Reports",
      href: "/dashboard/coordinator/reports",
      icon: FileText,
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
      title: "Students",
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
  ],
  student: [
    {
      title: "Dashboard",
      href: "/dashboard/student",
      icon: LayoutDashboard,
    },
    {
      title: "My Project",
      href: "/dashboard/student/my-project",
      icon: FolderKanban,
    },
    {
      title: "Team",
      href: "/dashboard/student/team",
      icon: Users,
    },
    {
      title: "Submissions",
      href: "/dashboard/student/submissions",
      icon: FileText,
    },
    {
      title: "Defense",
      href: "/dashboard/student/defense",
      icon: Calendar,
    },
    {
      title: "Timeline",
      href: "/dashboard/student/timeline",
      icon: Clock,
    },
    {
      title: "Messages",
      href: "/dashboard/student/messages",
      icon: FileText,
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
  ],
}