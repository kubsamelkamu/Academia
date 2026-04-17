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
  BarChart,
  Star,
  Send,
  BookOpen,
  type LucideIcon,
} from "lucide-react"

export type UserRole = "department_head" | "coordinator" | "advisor" | "student" | "department_committee" | "evaluator"

export interface NavItem {
  title: string
  href?: string          // optional for parent group items that only expand/collapse
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
      href: "/dashboard/department-head/review",
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
      title: "Groups",
      href: "/dashboard/coordinator/groups",
      icon: BookOpen,
    },
    {
      title: "Title Management",
      href: "/dashboard/coordinator/title-management",
      icon: Edit,
    },
    {
      title: "Assignments",
      href: "/dashboard/coordinator/projects",
      icon: FolderKanban,
    },
    {
      title: "Progress",
      icon: BarChart,
      children: [
        {
          title: "Advisor Progress",
          href: "/dashboard/coordinator/advisor-progress",
          icon: BarChart,
        },
        {
          title: "Evaluator Progress",
          href: "/dashboard/coordinator/evaluator-progress",
          icon: Star,
        },
      ],
    },
    {
      title: "Notify",
      icon: Bell,
      children: [
        {
          title: "Notify Advisors",
          href: "/dashboard/coordinator/notify-advisors",
          icon: Bell,
        },
        {
          title: "Notify Evaluators",
          href: "/dashboard/coordinator/notify-evaluators",
          icon: Send,
        },
      ],
    },
    {
      title: "Announcements",
      href: "/dashboard/coordinator/announcement",
      icon: Megaphone,
    },
    {
      title: "Reports",
      href: "/dashboard/coordinator/reports",
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
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ],
  advisor: [
    {
      title: "Advisor",
      icon: Users,
      children: [
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
      ],
    },
    {
      title: "Evaluator",
      icon: ClipboardCheck,
      children: [
        {
          title: "Dashboard",
          href: "/dashboard/advisor/evaluator",
          icon: LayoutDashboard,
        },
        {
          title: "Pending evaluations",
          href: "/dashboard/advisor/evaluator/pending",
          icon: Clock,
        },
        {
          title: "Scheduled sessions",
          href: "/dashboard/advisor/evaluator/scheduled",
          icon: Calendar,
        },
        {
          title: "Completed",
          href: "/dashboard/advisor/evaluator/completed",
          icon: CheckSquare,
        },
        {
          title: "Projects",
          href: "/dashboard/advisor/evaluator/projects",
          icon: FolderKanban,
        },
        {
          title: "Rubric",
          href: "/dashboard/advisor/evaluator/rubric",
          icon: BookOpen,
        },
      ],
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
      icon: ClipboardCheck,
    },
    {
      title: "Defense Schedule",
      href: "/dashboard/evaluator/schedule",
      icon: Calendar,
    },
    {
      title: "Reports",
      href: "/dashboard/evaluator/reports",
      icon: BarChart,
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
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
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
}
