import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Calendar,
  Clock,
  LayoutDashboard,
} from "lucide-react"

export type AdvisorEvaluatorView = "dashboard" | "pending" | "scheduled"

/** Keys for hub quick links (sidebar + dashboard tiles); section switcher uses {@link AdvisorEvaluatorView} only. */
export type AdvisorEvaluatorHubKey =
  | AdvisorEvaluatorView
  | "rubric"

export type AdvisorEvaluatorNavItem = {
  key: AdvisorEvaluatorHubKey
  title: string
  href: string
  description: string
  icon: LucideIcon
}

export const ADVISOR_EVALUATOR_LINKS: AdvisorEvaluatorNavItem[] = [
  {
    key: "dashboard",
    title: "Dashboard",
    href: "/dashboard/advisor/evaluator",
    description: "Overview of your evaluator workload",
    icon: LayoutDashboard,
  },
  {
    key: "pending",
    title: "Pending evaluations",
    href: "/dashboard/advisor/evaluator/pending",
    description: "Submissions awaiting your review",
    icon: Clock,
  },
  {
    key: "scheduled",
    title: "Scheduled sessions",
    href: "/dashboard/advisor/evaluator/scheduled",
    description: "Upcoming evaluation meetings",
    icon: Calendar,
  },
  {
    key: "rubric",
    title: "Rubric",
    href: "/dashboard/advisor/evaluator/rubric",
    description: "Scoring criteria reference",
    icon: BookOpen,
  },
]

/** Rubric cap for the advisor evaluator workspace; criterion {@link EVALUATION_CRITERIA} maxPercent values sum to this. */
export const RUBRIC_TOTAL_MAX_PERCENT = 80

export const EVALUATION_CRITERIA = [
  { id: "technical", label: "Technical implementation", description: "Code quality, algorithms, and technical soundness", maxPercent: 7 },
  { id: "code_quality", label: "Code quality", description: "Structure, readability, and best practices", maxPercent: 7 },
  { id: "functionality", label: "Functionality", description: "Features implemented and working correctly", maxPercent: 7 },
  { id: "documentation", label: "Documentation", description: "Completeness and clarity", maxPercent: 5 },
  { id: "innovation", label: "Innovation", description: "Creativity and novel approaches", maxPercent: 5 },
  { id: "ui_ux", label: "UI / UX", description: "Design, usability, and experience", maxPercent: 6 },
  { id: "testing", label: "Testing", description: "Coverage and quality assurance", maxPercent: 5 },
  { id: "performance", label: "Performance", description: "Efficiency and optimization", maxPercent: 5 },
  { id: "security", label: "Security", description: "Measures and data protection", maxPercent: 6 },
  { id: "scalability", label: "Scalability", description: "Growth and load handling", maxPercent: 4 },
  { id: "presentation", label: "Presentation", description: "Demo and communication quality", maxPercent: 6 },
  { id: "project_management", label: "Project management", description: "Planning and timeline", maxPercent: 5 },
  { id: "collaboration", label: "Collaboration", description: "Teamwork and communication", maxPercent: 5 },
  { id: "impact", label: "Overall impact", description: "Value and outcomes of the project", maxPercent: 7 },
] as const

export type EvaluationCriterion = (typeof EVALUATION_CRITERIA)[number]
