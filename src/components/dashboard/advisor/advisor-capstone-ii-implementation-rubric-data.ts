/**
 * Capstone II — system implementation advisor rubric.
 * Twenty major criteria weights sum to {@link ADVISOR_CII_RUBRIC_TOTAL_PERCENT}.
 * Final implementation assessment block is reference-only (no weights).
 */

export const ADVISOR_CII_RUBRIC_TOTAL_PERCENT = 100 as const

export type CiiImplementationCriterion = {
  id: string
  number: number
  title: string
  intro: string
  maxPercent: number
  checkpoints: readonly string[]
}

function c(
  id: string,
  number: number,
  title: string,
  maxPercent: number,
  intro: string,
  checkpoints: readonly string[],
): CiiImplementationCriterion {
  return { id, number, title, maxPercent, intro, checkpoints }
}

/** Major scored rows (20 × weights → 100%). */
export const ADVISOR_CAPSTONE_II_IMPLEMENTATION_CRITERIA: readonly CiiImplementationCriterion[] = [
  c("cii-01-setup", 1, "System Setup and Configuration", 4, "Verify whether:", [
    "Development environment configured correctly",
    "Required software/tools installed",
    "Dependencies configured properly",
    "Database server configured",
    "Framework setup completed",
    "Application runs successfully",
    "Configuration files organized properly",
  ]),
  c("cii-02-modules", 2, "Module Implementation Evaluation", 6, "Check whether:", [
    "All modules implemented",
    "Modules function independently",
    "Module interactions work correctly",
    "Business logic implemented correctly",
    "Features match system requirements",
    "No missing functionalities",
    "Modules properly integrated",
  ]),
  c("cii-03-frontend", 3, "Frontend Implementation Evaluation", 5, "Verify whether:", [
    "User interfaces implemented correctly",
    "Navigation menus functional",
    "Forms designed properly",
    "Input validation implemented",
    "Error messages displayed correctly",
    "Responsive design implemented",
    "UI consistency maintained",
    "Accessibility considered",
  ]),
  c("cii-04-backend", 4, "Backend Implementation Evaluation", 5, "Check whether:", [
    "Server-side logic implemented correctly",
    "APIs developed correctly",
    "Authentication implemented",
    "Authorization implemented",
    "Session management works",
    "Business rules enforced",
    "Data processing correct",
    "Exception handling implemented",
  ]),
  c("cii-05-database", 5, "Database Implementation Evaluation", 5, "Verify whether:", [
    "Database connected successfully",
    "Tables created correctly",
    "Relationships implemented properly",
    "CRUD operations functional",
    "Constraints enforced",
    "Queries optimized",
    "Data consistency maintained",
    "Backup mechanisms available",
  ]),
  c("cii-06-functional", 6, "Functional Requirement Implementation Review", 5, "Check whether:", [
    "All functional requirements implemented",
    "System outputs correct",
    "Inputs validated properly",
    "Use cases implemented",
    "User roles functioning correctly",
    "Reports generated correctly",
    "Search/filter functionality works",
    "Notifications implemented if required",
  ]),
  c("cii-07-nonfunctional", 7, "Non-Functional Requirement Implementation Review", 5, "Verify whether:", [
    "Performance acceptable",
    "Security mechanisms implemented",
    "System reliability maintained",
    "Availability considered",
    "Scalability supported",
    "Maintainability supported",
    "Portability supported",
    "Usability achieved",
  ]),
  c("cii-08-security", 8, "Security Implementation Review", 6, "Check whether:", [
    "User authentication secure",
    "Password encryption implemented",
    "Authorization roles enforced",
    "SQL injection prevented",
    "XSS attacks prevented",
    "CSRF protection implemented",
    "Sensitive data protected",
    "Input sanitization implemented",
  ]),
  c("cii-09-api", 9, "API and Integration Evaluation", 5, "Verify whether:", [
    "APIs work correctly",
    "Endpoints tested",
    "API responses correct",
    "Frontend-backend communication successful",
    "Third-party APIs integrated properly",
    "Data exchange secure",
    "Error handling implemented for APIs",
  ]),
  c("cii-10-errors", 10, "Error Handling and Validation Review", 4, "Check whether:", [
    "Form validation implemented",
    "System handles invalid input",
    "Error messages meaningful",
    "Exceptions handled correctly",
    "Application crashes prevented",
    "Logging mechanism implemented",
  ]),
  c("cii-11-code-quality", 11, "Code Quality Evaluation", 5, "Verify whether:", [
    "Code readable",
    "Naming conventions followed",
    "Code modularized properly",
    "Functions reusable",
    "Comments/documentation included",
    "Dead code removed",
    "Best practices followed",
  ]),
  c("cii-12-vcs", 12, "Version Control Evaluation", 3, "Check whether:", [
    "Git/GitHub used properly",
    "Commits meaningful",
    "Branches managed correctly",
    "Repository organized",
    "Collaboration visible in commits",
    "Code backup maintained",
  ]),
  c("cii-13-performance", 13, "System Performance Evaluation", 5, "Verify whether:", [
    "System response time acceptable",
    "Resource utilization optimized",
    "Large data handled properly",
    "Concurrent users supported",
    "Performance bottlenecks minimized",
    "Loading speed acceptable",
  ]),
  c("cii-14-testing", 14, "Testing During Implementation", 6, "Check whether:", [
    "Unit testing performed",
    "Integration testing performed",
    "System testing conducted",
    "Test cases documented",
    "Bugs identified and fixed",
    "Retesting performed after fixes",
  ]),
  c("cii-15-deployment", 15, "Deployment Evaluation", 5, "Verify whether:", [
    "System deployed successfully",
    "Hosting/server configured",
    "Application accessible online/offline",
    "Deployment errors resolved",
    "Environment variables configured",
    "Production environment stable",
  ]),
  c("cii-16-ux", 16, "User Experience (UX) Evaluation", 5, "Check whether:", [
    "System easy to use",
    "Navigation intuitive",
    "User workflow smooth",
    "Feedback messages clear",
    "System visually attractive",
    "User satisfaction considered",
  ]),
  c("cii-17-innovation", 17, "Innovation and Creativity Evaluation", 4, "Verify whether:", [
    "Innovative features included",
    "Modern technologies used",
    "Creative problem-solving applied",
    "Unique functionalities developed",
    "System adds practical value",
  ]),
  c("cii-18-docs", 18, "Documentation During Implementation", 5, "Check whether:", [
    "Source code documented",
    "API documentation provided",
    "Installation guide available",
    "User manual prepared",
    "Technical documentation complete",
    "Configuration guide included",
  ]),
  c("cii-19-team", 19, "Team Contribution Evaluation (For Group Projects)", 4, "Verify whether:", [
    "Tasks shared fairly",
    "Team collaboration effective",
    "Communication maintained",
    "Individual contributions clear",
    "Conflicts managed properly",
    "Responsibilities completed",
  ]),
  c("cii-20-readiness", 20, "Final System Readiness Evaluation", 8, "Check whether:", [
    "System fully functional",
    "Ready for deployment/use",
    "Major bugs resolved",
    "Requirements satisfied",
    "Performance acceptable",
    "Security acceptable",
    "Documentation complete",
  ]),
]

export type AdvisorCapstoneIIMajorCriterionMeta = {
  id: string
  number: number
  title: string
  maxPercent: number
  sectionShort: string
}

export const ADVISOR_CAPSTONE_II_MAJOR_CRITERIA: readonly AdvisorCapstoneIIMajorCriterionMeta[] =
  ADVISOR_CAPSTONE_II_IMPLEMENTATION_CRITERIA.map((row) => ({
    id: row.id,
    number: row.number,
    title: row.title,
    maxPercent: row.maxPercent,
    sectionShort: "Impl",
  }))

export const ADVISOR_CAPSTONE_II_MAJOR_MAX_SUM = ADVISOR_CAPSTONE_II_MAJOR_CRITERIA.reduce((s, r) => s + r.maxPercent, 0)

export function sumCapstoneIIMajorScores(scores: Record<string, number>): number {
  return ADVISOR_CAPSTONE_II_MAJOR_CRITERIA.reduce((s, r) => s + (scores[r.id] ?? 0), 0)
}

export function initialCapstoneIIMajorScoresFromHolistic(holistic: number | null | undefined): Record<string, number> {
  const maxSum = ADVISOR_CAPSTONE_II_MAJOR_MAX_SUM
  if (holistic == null || Number.isNaN(Number(holistic))) {
    return Object.fromEntries(ADVISOR_CAPSTONE_II_MAJOR_CRITERIA.map((r) => [r.id, 0]))
  }
  const n = Math.min(ADVISOR_CII_RUBRIC_TOTAL_PERCENT, Math.max(0, Number(holistic)))
  return Object.fromEntries(
    ADVISOR_CAPSTONE_II_MAJOR_CRITERIA.map((r) => {
      const raw = maxSum > 0 ? (r.maxPercent / maxSum) * n : 0
      return [r.id, Math.round(raw * 10) / 10] as [string, number]
    }),
  )
}

export type CiiFinalAssessmentArea = {
  title: string
  items: readonly string[]
}

/** Reference-only closing checklist (weights live in the 20 implementation rows above). */
export const ADVISOR_CAPSTONE_II_FINAL_ASSESSMENT: readonly CiiFinalAssessmentArea[] = [
  {
    title: "Technical Implementation",
    items: [
      "Frontend implementation",
      "Backend implementation",
      "Database implementation",
      "API integration",
      "Security implementation",
    ],
  },
  {
    title: "Software Quality",
    items: ["Code quality", "Maintainability", "Scalability", "Performance", "Reliability"],
  },
  {
    title: "Testing Quality",
    items: ["Unit testing", "Integration testing", "Bug fixing", "Validation"],
  },
  {
    title: "Documentation Quality",
    items: ["Technical documentation", "User manual", "API documentation"],
  },
  {
    title: "Professional Skills",
    items: ["Teamwork", "Communication", "Time management", "Problem solving"],
  },
]

export function assertAdvisorCapstoneIiRubricTotals(): void {
  if (process.env.NODE_ENV === "production") return
  if (ADVISOR_CAPSTONE_II_MAJOR_MAX_SUM !== ADVISOR_CII_RUBRIC_TOTAL_PERCENT) {
    console.warn(
      `[CII rubric] Major weights sum to ${ADVISOR_CAPSTONE_II_MAJOR_MAX_SUM}, expected ${ADVISOR_CII_RUBRIC_TOTAL_PERCENT}.`,
    )
  }
}
