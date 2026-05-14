/**
 * Complete advisor SRS + SDD read-only rubric.
 * All line weights sum to {@link ADVISOR_SRS_SDD_RUBRIC_TOTAL_PERCENT} (holistic advisor score cap).
 */

export const ADVISOR_SRS_SDD_RUBRIC_TOTAL_PERCENT = 100 as const

export type AdvisorRubricLine = {
  /** Display index within parent (1-based shown as 1.1, 1.2, …). */
  index: number
  label: string
  /** Share of the 100% total (integer points). */
  weightPercent: number
}

export type AdvisorRubricCriterion = {
  id: string
  /** Major heading number under the section (1–5). */
  number: number
  title: string
  intro?: string
  lines: AdvisorRubricLine[]
}

export type AdvisorRubricSection = {
  id: "SRS" | "SDD"
  letter: "A" | "B"
  title: string
  subtitle: string
  /** Sum of all line weights in this section. */
  sectionMaxPercent: number
  criteria: AdvisorRubricCriterion[]
}

/** Section A — SRS (50% of total checklist weight). */
export const ADVISOR_SRS_SECTION: AdvisorRubricSection = {
  id: "SRS",
  letter: "A",
  title: "Software Requirements Specification (SRS)",
  subtitle: "SRS advisor technical checklist",
  sectionMaxPercent: 50,
  criteria: [
    {
      id: "srs-intro",
      number: 1,
      title: "Introduction Section",
      intro: "Check whether the document includes:",
      lines: [
        { index: 1, label: "Purpose of the system", weightPercent: 2 },
        { index: 2, label: "Scope of the project", weightPercent: 2 },
        { index: 3, label: "Definitions and abbreviations", weightPercent: 2 },
        { index: 4, label: "References", weightPercent: 2 },
        { index: 5, label: "Intended users", weightPercent: 1 },
      ],
    },
    {
      id: "srs-functional",
      number: 2,
      title: "Functional Requirement Evaluation",
      intro: "Verify whether:",
      lines: [
        { index: 1, label: "Requirements are complete", weightPercent: 2 },
        { index: 2, label: "Requirements are testable", weightPercent: 2 },
        { index: 3, label: "Requirements are measurable", weightPercent: 2 },
        { index: 4, label: "Requirements are non-ambiguous", weightPercent: 2 },
        { index: 5, label: "Requirements avoid duplication", weightPercent: 2 },
      ],
    },
    {
      id: "srs-nonfunctional",
      number: 3,
      title: "Non-Functional Requirement Evaluation",
      intro: "Verify whether:",
      lines: [
        { index: 1, label: "Performance requirements specified", weightPercent: 3 },
        { index: 2, label: "Security requirements included", weightPercent: 2 },
        { index: 3, label: "Reliability requirements included", weightPercent: 2 },
        { index: 4, label: "Availability requirements included", weightPercent: 2 },
        { index: 5, label: "Scalability requirements considered", weightPercent: 2 },
      ],
    },
    {
      id: "srs-usecase",
      number: 4,
      title: "Use Case Evaluation",
      intro: "Check:",
      lines: [
        { index: 1, label: "Actors identified correctly", weightPercent: 3 },
        { index: 2, label: "Use case relationships correct", weightPercent: 2 },
        { index: 3, label: "Main flow and alternative flow included", weightPercent: 2 },
        { index: 4, label: "Use case descriptions complete", weightPercent: 2 },
      ],
    },
    {
      id: "srs-quality",
      number: 5,
      title: "Requirement Quality Attributes",
      intro: "Requirements should be:",
      lines: [
        { index: 1, label: "Correct", weightPercent: 2 },
        { index: 2, label: "Complete", weightPercent: 2 },
        { index: 3, label: "Consistent", weightPercent: 2 },
        { index: 4, label: "Verifiable", weightPercent: 2 },
        { index: 5, label: "Feasible", weightPercent: 2 },
        { index: 6, label: "Traceable", weightPercent: 1 },
      ],
    },
  ],
}

/** Section B — SDD (50% of total checklist weight). */
export const ADVISOR_SDD_SECTION: AdvisorRubricSection = {
  id: "SDD",
  letter: "B",
  title: "Software Design Document (SDD)",
  subtitle: "SDD advisor technical checklist",
  sectionMaxPercent: 50,
  criteria: [
    {
      id: "sdd-architecture",
      number: 1,
      title: "Architecture Review",
      intro: "Verify whether:",
      lines: [
        { index: 1, label: "Appropriate architecture selected", weightPercent: 2 },
        { index: 2, label: "Layers / modules identified", weightPercent: 2 },
        { index: 3, label: "Scalability considered", weightPercent: 2 },
        { index: 4, label: "Reusability considered", weightPercent: 2 },
        { index: 5, label: "Technologies appropriate", weightPercent: 2 },
      ],
    },
    {
      id: "sdd-uml",
      number: 2,
      title: "UML Diagram Review",
      intro: "Required diagrams and quality checks:",
      lines: [
        { index: 1, label: "Use Case Diagram", weightPercent: 1 },
        { index: 2, label: "Class Diagram", weightPercent: 1 },
        { index: 3, label: "Sequence Diagram", weightPercent: 1 },
        { index: 4, label: "Activity Diagram", weightPercent: 1 },
        { index: 5, label: "ER Diagram", weightPercent: 1 },
        { index: 6, label: "Deployment Diagram", weightPercent: 1 },
        { index: 7, label: "Correct UML notation", weightPercent: 1 },
        { index: 8, label: "Readability", weightPercent: 1 },
        { index: 9, label: "Completeness", weightPercent: 1 },
        { index: 10, label: "Consistency", weightPercent: 1 },
        { index: 11, label: "Alignment with SRS", weightPercent: 2 },
      ],
    },
    {
      id: "sdd-database",
      number: 3,
      title: "Database Design Review",
      intro: "Check whether:",
      lines: [
        { index: 1, label: "Tables normalized", weightPercent: 2 },
        { index: 2, label: "Keys correctly assigned", weightPercent: 2 },
        { index: 3, label: "Relationships correct", weightPercent: 2 },
        { index: 4, label: "Constraints specified", weightPercent: 2 },
        { index: 5, label: "Data redundancy minimized", weightPercent: 2 },
      ],
    },
    {
      id: "sdd-ui",
      number: 4,
      title: "User Interface Design Review",
      intro: "Verify whether:",
      lines: [
        { index: 1, label: "Wireframes included", weightPercent: 2 },
        { index: 2, label: "Navigation clear", weightPercent: 2 },
        { index: 3, label: "UI consistency maintained", weightPercent: 2 },
        { index: 4, label: "Accessibility considered", weightPercent: 1 },
        { index: 5, label: "Responsive layout planned", weightPercent: 1 },
      ],
    },
    {
      id: "sdd-security",
      number: 5,
      title: "Security Design Review",
      intro: "Check for:",
      lines: [
        { index: 1, label: "Authentication design", weightPercent: 2 },
        { index: 2, label: "Authorization mechanism", weightPercent: 2 },
        { index: 3, label: "Input validation strategy", weightPercent: 2 },
        { index: 4, label: "Error handling", weightPercent: 2 },
        { index: 5, label: "Data protection", weightPercent: 2 },
      ],
    },
  ],
}

export const ADVISOR_SRS_SDD_SECTIONS: readonly AdvisorRubricSection[] = [ADVISOR_SRS_SECTION, ADVISOR_SDD_SECTION]

export function sumCriterionWeights(c: AdvisorRubricCriterion): number {
  return c.lines.reduce((s, l) => s + l.weightPercent, 0)
}

/** One scored row per SRS/SDD major criterion (Capstone I sheet); max percents sum to 100. */
export type AdvisorMajorCriterionMeta = {
  id: string
  sectionLetter: "A" | "B"
  sectionShort: string
  number: number
  title: string
  maxPercent: number
}

export const ADVISOR_CAPSTONE_I_MAJOR_CRITERIA: readonly AdvisorMajorCriterionMeta[] = [
  ...ADVISOR_SRS_SECTION.criteria.map((c) => ({
    id: c.id,
    sectionLetter: "A" as const,
    sectionShort: "SRS",
    number: c.number,
    title: c.title,
    maxPercent: sumCriterionWeights(c),
  })),
  ...ADVISOR_SDD_SECTION.criteria.map((c) => ({
    id: c.id,
    sectionLetter: "B" as const,
    sectionShort: "SDD",
    number: c.number,
    title: c.title,
    maxPercent: sumCriterionWeights(c),
  })),
]

export const ADVISOR_CAPSTONE_I_MAJOR_MAX_SUM = ADVISOR_CAPSTONE_I_MAJOR_CRITERIA.reduce((s, c) => s + c.maxPercent, 0)

export function sumCapstoneIMajorScores(scores: Record<string, number>): number {
  return ADVISOR_CAPSTONE_I_MAJOR_CRITERIA.reduce((s, c) => s + (scores[c.id] ?? 0), 0)
}

/** Spread a saved holistic 0–100 into per-major rows for editing (proportional to each row max). */
export function initialCapstoneIMajorScoresFromHolistic(holistic: number | null | undefined): Record<string, number> {
  const maxSum = ADVISOR_CAPSTONE_I_MAJOR_MAX_SUM
  if (holistic == null || Number.isNaN(Number(holistic))) {
    return Object.fromEntries(ADVISOR_CAPSTONE_I_MAJOR_CRITERIA.map((c) => [c.id, 0]))
  }
  const n = Math.min(ADVISOR_SRS_SDD_RUBRIC_TOTAL_PERCENT, Math.max(0, Number(holistic)))
  return Object.fromEntries(
    ADVISOR_CAPSTONE_I_MAJOR_CRITERIA.map((c) => {
      const raw = maxSum > 0 ? (c.maxPercent / maxSum) * n : 0
      return [c.id, Math.round(raw * 10) / 10] as const
    }),
  )
}

function sumSectionWeights(s: AdvisorRubricSection): number {
  return s.criteria.reduce((sum, c) => sum + sumCriterionWeights(c), 0)
}

/** Dev-only guard: totals must match cap. */
export function assertAdvisorSrsSddRubricTotals(): void {
  if (process.env.NODE_ENV === "production") return
  const total = ADVISOR_SRS_SDD_SECTIONS.reduce((s, sec) => s + sumSectionWeights(sec), 0)
  if (total !== ADVISOR_SRS_SDD_RUBRIC_TOTAL_PERCENT) {
    console.warn(
      `[advisor rubric] Line weights sum to ${total}, expected ${ADVISOR_SRS_SDD_RUBRIC_TOTAL_PERCENT}.`,
    )
  }
  for (const sec of ADVISOR_SRS_SDD_SECTIONS) {
    const w = sumSectionWeights(sec)
    if (w !== sec.sectionMaxPercent) {
      console.warn(`[advisor rubric] Section ${sec.id} weights sum to ${w}, expected ${sec.sectionMaxPercent}.`)
    }
  }
  if (ADVISOR_CAPSTONE_I_MAJOR_MAX_SUM !== ADVISOR_SRS_SDD_RUBRIC_TOTAL_PERCENT) {
    console.warn(
      `[advisor rubric] Major criterion max sum is ${ADVISOR_CAPSTONE_I_MAJOR_MAX_SUM}, expected ${ADVISOR_SRS_SDD_RUBRIC_TOTAL_PERCENT}.`,
    )
  }
}
