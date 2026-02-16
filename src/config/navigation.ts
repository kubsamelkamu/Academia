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
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Coordinators",
      href: "/dashboard/coordinators",
      icon: UserCheck,
    },
    {
      title: "Faculty",
      href: "/dashboard/faculty",
      icon: Users,
    },
    {
      title: "Projects Overview",
      href: "/dashboard/projects",
      icon: FolderKanban,
    },
    {
      title: "Reports",
      href: "/dashboard/reports",
      icon: FileText,
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
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Projects",
      href: "/dashboard/projects",
      icon: FolderKanban,
    },
    {
      title: "Students",
      href: "/dashboard/students",
      icon: GraduationCap,
    },
    {
      title: "Advisors",
      href: "/dashboard/advisors",
      icon: UserCheck,
    },
    {
      title: "Defenses",
      href: "/dashboard/defenses",
      icon: Calendar,
    },
    {
      title: "Evaluations",
      href: "/dashboard/evaluations",
      icon: ClipboardList,
    },
    {
      title: "Reports",
      href: "/dashboard/reports",
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
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "My Projects",
      href: "/dashboard/my-projects",
      icon: FolderKanban,
    },
    {
      title: "Students",
      href: "/dashboard/students",
      icon: GraduationCap,
    },
    {
      title: "Evaluations",
      href: "/dashboard/evaluations",
      icon: ClipboardList,
    },
    {
      title: "Schedule",
      href: "/dashboard/schedule",
      icon: Calendar,
    },
    {
      title: "Messages",
      href: "/dashboard/messages",
      icon: FileText,
    },
  ],
  student: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "My Project",
      href: "/dashboard/my-project",
      icon: FolderKanban,
    },
    {
      title: "Team",
      href: "/dashboard/team",
      icon: Users,
    },
    {
      title: "Submissions",
      href: "/dashboard/submissions",
      icon: FileText,
    },
    {
      title: "Defense",
      href: "/dashboard/defense",
      icon: Calendar,
    },
    {
      title: "Timeline",
      href: "/dashboard/timeline",
      icon: Clock,
    },
    {
      title: "Messages",
      href: "/dashboard/messages",
      icon: FileText,
    },
  ],
  department_committee: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Assigned Projects",
      href: "/dashboard/assigned-projects",
      icon: FolderKanban,
    },
    {
      title: "Evaluations",
      href: "/dashboard/evaluations",
      icon: CheckSquare,
    },
    {
      title: "Defense Schedule",
      href: "/dashboard/defense-schedule",
      icon: Calendar,
    },
    {
      title: "Reports",
      href: "/dashboard/reports",
      icon: FileText,
    },
  ],
}