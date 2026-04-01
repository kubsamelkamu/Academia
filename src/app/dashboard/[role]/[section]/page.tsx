import { type UserRole } from "@/config/navigation"
import { getDashboardRoleSlug, getRoleFromDashboardSlug } from "@/lib/auth/dashboard-role-paths"
import { AdvisorEvaluationsPage } from "@/components/dashboard/advisor/evaluations-page"
import { AdvisorMessagesPage } from "@/components/dashboard/advisor/messages-page"
import { AdvisorMyProjectsPage } from "@/components/dashboard/advisor/my-projects-page"
import { AdvisorSchedulePage } from "@/components/dashboard/advisor/schedule-page"
import { AdvisorStudentsPage } from "@/components/dashboard/advisor/students-page"
import { AdvisorAnnouncementsPage } from "@/components/dashboard/advisor/announcements-page"
import { CommitteeAssignedProjectsPage } from "@/components/dashboard/committee/assigned-projects-page"
import { CommitteeDefenseSchedulePage } from "@/components/dashboard/committee/defense-schedule-page"
import { CommitteeEvaluationsPage } from "@/components/dashboard/committee/evaluations-page"
import { CommitteeReportsPage } from "@/components/dashboard/committee/reports-page"
import { DepartmentHeadAnnouncementsPage } from "@/components/dashboard/department-head/announcements-page"
import { DepartmentHeadFacultyPage } from "@/components/dashboard/department-head/faculty-page"
import { DepartmentHeadGradesPage } from "@/components/dashboard/department-head/grades-page"
import { DepartmentHeadInvitationsPage } from "@/components/dashboard/department-head/invitations-page"
import DepartmentHeadProjectsPage from "@/components/dashboard/department-head/ProjectsOverview"
import DepartmentHeadReportsPage from "@/components/dashboard/department-head/Reports"
import { DepartmentHeadMessagesPage } from "@/components/dashboard/department-head/messages-page"
import { DepartmentHeadSettingsPage } from "@/components/dashboard/department-head/settings-page"
import { DepartmentHeadGroupLeaderRequestsPage } from "@/components/dashboard/department-head/group-leader-requests-page"
import { StudentAnnouncementsPage } from "@/components/dashboard/student/announcements-page"
import StudentDefensePage from "@/components/dashboard/student/defense-page"
import { StudentMessagesPage } from "@/components/dashboard/student/messages-page"
import { StudentMilestonesPage } from "@/components/dashboard/student/milestones-page"
import { StudentMyProjectPage } from "@/components/dashboard/student/my-project-page"
import { StudentSubmissionsPage } from "@/components/dashboard/student/submissions-page"
import { StudentTeamPage } from "@/components/dashboard/student/team-page"
import { StudentTimelinePage } from "@/components/dashboard/student/timeline-page"
import { StudentUploadDocumentsPage } from "@/components/dashboard/student/upload-documents-page"
import SettingsPage from "@/app/dashboard/settings/page"
import {
  CoordinatorAdvisorsPlaceholderPage,
  CoordinatorDefensesPlaceholderPage,
  CoordinatorEvaluationsPlaceholderPage,
  CoordinatorProjectsPlaceholderPage,
  CoordinatorReportsPlaceholderPage,
  CoordinatorStudentsPlaceholderPage,
} from "@/components/dashboard/coordinator/placeholder-pages"
import EvaluatorAssignedProjectsPage from "@/app/dashboard/evaluator/assigned-projects/page"
import EvaluatorEvaluationsPage from "@/app/dashboard/evaluator/evaluations/page"
import EvaluatorSchedulePage from "@/app/dashboard/evaluator/schedule/page"
import EvaluatorReportsPage from "@/app/dashboard/evaluator/reports/page"
import EvaluatorMessagesPage from "@/app/dashboard/evaluator/messages/page"
import { notFound, redirect } from "next/navigation"
import { type ComponentType } from "react"

interface RoleSectionDashboardPageProps {
  params: Promise<{
    role: string
    section: string
  }>
}

type SectionComponent = ComponentType

const roleSectionComponentMap: Record<UserRole, Record<string, SectionComponent>> = {
  department_head: {
    announcements: DepartmentHeadAnnouncementsPage,
    invitations: DepartmentHeadInvitationsPage,
    faculty: DepartmentHeadFacultyPage,
    review: DepartmentHeadGradesPage,
    projects: DepartmentHeadProjectsPage,
    reports: DepartmentHeadReportsPage,
    messages: DepartmentHeadMessagesPage,
    settings: DepartmentHeadSettingsPage,
    "group-leader-requests": DepartmentHeadGroupLeaderRequestsPage,
  },
  coordinator: {
    projects: CoordinatorProjectsPlaceholderPage,
    students: CoordinatorStudentsPlaceholderPage,
    advisors: CoordinatorAdvisorsPlaceholderPage,
    defenses: CoordinatorDefensesPlaceholderPage,
    evaluations: CoordinatorEvaluationsPlaceholderPage,
    reports: CoordinatorReportsPlaceholderPage,
    settings: SettingsPage,
  },
  advisor: {
    "my-projects": AdvisorMyProjectsPage,
    students: AdvisorStudentsPage,
    evaluations: AdvisorEvaluationsPage,
    schedule: AdvisorSchedulePage,
    announcements: AdvisorAnnouncementsPage,
    messages: AdvisorMessagesPage,
  },
  student: {
    "my-project": StudentMyProjectPage,
    team: StudentTeamPage,
    submissions: StudentSubmissionsPage,
    milestones: StudentMilestonesPage,
    "upload-documents": StudentUploadDocumentsPage,
    defense: StudentDefensePage,
    timeline: StudentTimelinePage,
    messages: StudentMessagesPage,
    announcements: StudentAnnouncementsPage,
  },
  department_committee: {
    "assigned-projects": CommitteeAssignedProjectsPage,
    evaluations: CommitteeEvaluationsPage,
    "defense-schedule": CommitteeDefenseSchedulePage,
    reports: CommitteeReportsPage,
  },
  evaluator: {
    "assigned-projects": EvaluatorAssignedProjectsPage,
    evaluations: EvaluatorEvaluationsPage,
    schedule: EvaluatorSchedulePage,
    reports: EvaluatorReportsPage,
    messages: EvaluatorMessagesPage,
  },
}

function getCanonicalSectionForRole(role: UserRole, section: string): string {
  if (role === "student" && section === "defenses") {
    return "defense"
  }

  if (role === "coordinator" && section === "defense") {
    return "defenses"
  }

  // Redirect old /grades URL to the canonical /review section
  if (role === "department_head" && section === "grades") {
    return "review"
  }

  return section
}

const allowedSectionsByRole: Record<UserRole, string[]> = {
  department_head: ["invitations", "faculty", "review", "projects", "reports", "announcements", "messages", "settings", "group-leader-requests"],
  coordinator: ["projects", "students", "advisors", "defenses", "evaluations", "reports", "settings"],
  advisor: ["my-projects", "students", "evaluations", "schedule", "announcements", "messages"],
  student: ["my-project", "team", "submissions", "milestones", "upload-documents", "defense", "timeline", "messages", "announcements"],
  department_committee: ["assigned-projects", "evaluations", "defense-schedule", "reports"],
  evaluator: ["assigned-projects", "evaluations", "schedule", "reports", "messages"],
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

  // Canonicalize settings under a single top-level route.
  if (canonicalSection === "settings") {
    redirect("/dashboard/settings")
  }

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
