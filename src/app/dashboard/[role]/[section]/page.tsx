import { type UserRole } from "@/config/navigation"
import { getDashboardRoleSlug, getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { AdvisorEvaluationsPage } from "@/components/dashboard/advisor/evaluations-page"
import { AdvisorMessagesPage } from "@/components/dashboard/advisor/messages-page"
import { AdvisorMyProjectsPage } from "@/components/dashboard/advisor/my-projects-page"
import { AdvisorSchedulePage } from "@/components/dashboard/advisor/schedule-page"
import { AdvisorStudentsPage } from "@/components/dashboard/advisor/students-page"
import { CommitteeAssignedProjectsPage } from "@/components/dashboard/committee/assigned-projects-page"
import { CommitteeDefenseSchedulePage } from "@/components/dashboard/committee/defense-schedule-page"
import { CommitteeEvaluationsPage } from "@/components/dashboard/committee/evaluations-page"
import { CommitteeReportsPage } from "@/components/dashboard/committee/reports-page"
import { DepartmentHeadSettingsPage } from "@/components/dashboard/department-head/settings-page"
import { StudentDefensePage } from "@/components/dashboard/student/defense-page"
import { StudentMessagesPage } from "@/components/dashboard/student/messages-page"
import { StudentMyProjectPage } from "@/components/dashboard/student/my-project-page"
import { StudentSubmissionsPage } from "@/components/dashboard/student/submissions-page"
import { StudentTeamPage } from "@/components/dashboard/student/team-page"
import { StudentTimelinePage } from "@/components/dashboard/student/timeline-page"
import AdvisorsPage from "@/app/dashboard/advisors/page"
import CoordinatorsPage from "@/app/dashboard/coordinators/page"
import DefensesPage from "@/app/dashboard/defenses/page"
import EvaluationsPage from "@/app/dashboard/evaluations/page"
import FacultyPage from "@/app/dashboard/faculty/page"
import ProjectsOverviewPage from "@/app/dashboard/projects/page"
import ReportsPage from "@/app/dashboard/reports/page"
import SettingsPage from "@/app/dashboard/settings/page"
import StudentsPage from "@/app/dashboard/students/page"
import { notFound, redirect } from "next/navigation"
import { type ReactElement } from "react"

interface RoleSectionDashboardPageProps {
  params: Promise<{
    role: string
    section: string
  }>
}

type SectionComponent = () => ReactElement

const roleSectionComponentMap: Record<UserRole, Record<string, SectionComponent>> = {
  department_head: {
    coordinators: CoordinatorsPage,
    faculty: FacultyPage,
    projects: ProjectsOverviewPage,
    reports: ReportsPage,
    settings: DepartmentHeadSettingsPage,
  },
  coordinator: {
    projects: ProjectsOverviewPage,
    students: StudentsPage,
    advisors: AdvisorsPage,
    defenses: DefensesPage,
    evaluations: EvaluationsPage,
    reports: ReportsPage,
    settings: SettingsPage,
  },
  advisor: {
    "my-projects": AdvisorMyProjectsPage,
    students: AdvisorStudentsPage,
    evaluations: AdvisorEvaluationsPage,
    schedule: AdvisorSchedulePage,
    messages: AdvisorMessagesPage,
  },
  student: {
    "my-project": StudentMyProjectPage,
    team: StudentTeamPage,
    submissions: StudentSubmissionsPage,
    defense: StudentDefensePage,
    timeline: StudentTimelinePage,
    messages: StudentMessagesPage,
  },
  department_committee: {
    "assigned-projects": CommitteeAssignedProjectsPage,
    evaluations: CommitteeEvaluationsPage,
    "defense-schedule": CommitteeDefenseSchedulePage,
    reports: CommitteeReportsPage,
  },
}

const sectionAliasToCanonical: Record<string, string> = {
  coordinator: "coordinators",
}

function getCanonicalSectionForRole(role: UserRole, section: string): string {
  if (role === "student" && section === "defenses") {
    return "defense"
  }

  if (role === "coordinator" && section === "defense") {
    return "defenses"
  }

  if (role === "student" && section === "defense") {
    return "defense"
  }

  return sectionAliasToCanonical[section] ?? section
}

const allowedSectionsByRole: Record<UserRole, string[]> = {
  department_head: ["coordinators", "faculty", "projects", "reports", "settings"],
  coordinator: ["projects", "students", "advisors", "defenses", "evaluations", "reports", "settings"],
  advisor: ["my-projects", "students", "evaluations", "schedule", "messages"],
  student: ["my-project", "team", "submissions", "defense", "timeline", "messages"],
  department_committee: ["assigned-projects", "evaluations", "defense-schedule", "reports"],
}

function normalizeSection(section: string): string {
  return section.toLowerCase().trim()
}

export default async function RoleSectionDashboardPage({ params }: RoleSectionDashboardPageProps) {
  const { role: roleSlugInput, section: sectionInput } = await params
  const role = getRoleFromDashboardSlug(roleSlugInput)

  if (!role) {
    notFound()
  }

  const canonicalRoleSlug = getDashboardRoleSlug(role)
  const normalizedSection = normalizeSection(sectionInput)
  const canonicalSection = getCanonicalSectionForRole(role, normalizedSection)
  const isSectionAlias = canonicalSection !== normalizedSection

  if (roleSlugInput.toLowerCase() !== canonicalRoleSlug || isSectionAlias) {
    redirect(`/dashboard/${canonicalRoleSlug}/${canonicalSection}`)
  }

  const allowedSections = allowedSectionsByRole[role]

  if (!allowedSections.includes(canonicalSection)) {
    notFound()
  }

  const SectionPage = roleSectionComponentMap[role][canonicalSection]

  if (!SectionPage) {
    notFound()
  }

  return <SectionPage />
}
