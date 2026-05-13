import type { AdvisorEvaluatorStage } from "./advisor-evaluator-stage-menu"

/** Re-export workspace cap; must match stage + common {@link maxPercent} sums on the evaluate form. */
export { RUBRIC_TOTAL_MAX_PERCENT } from "./advisor-evaluator-shared"

/** Capstone I / II documentation or implementation lines share this pool (points sum → share of final 0–100). */
export const EVALUATE_STAGE_WEIGHT_SUM = 70

/** Presentation & professionalism lines share this pool; with stage pool totals {@link RUBRIC_TOTAL_MAX_PERCENT}%. */
export const EVALUATE_COMMON_WEIGHT_SUM = 30

type StageEvaluationCriterion = {
  id: string
  label: string
  description: string
  maxPercent: number
}

/** Capstone I — documentation & design (weights sum to {@link EVALUATE_STAGE_WEIGHT_SUM}). */
export const CAPSTONE_I_DOCUMENTATION_CRITERIA: StageEvaluationCriterion[] = [
  {
    id: "c1_problem_definition",
    label: "Problem Definition",
    description: "Clear explanation of the problem, objectives, and motivation of the project.",
    maxPercent: 6,
  },
  {
    id: "c1_literature_review",
    label: "Literature Review",
    description: "Review of existing systems or research related to the project.",
    maxPercent: 6,
  },
  {
    id: "c1_srs",
    label: "Software Requirement Specification (SRS)",
    description: "Completeness and clarity of the requirements document including functional and non-functional requirements.",
    maxPercent: 10,
  },
  {
    id: "c1_sdd",
    label: "System Design Document (SDD)",
    description: "Quality of architecture design, modules, and system structure.",
    maxPercent: 9,
  },
  {
    id: "c1_use_case",
    label: "Use Case Diagram",
    description: "Correct identification of actors and interactions with the system.",
    maxPercent: 5,
  },
  {
    id: "c1_class_diagram",
    label: "Class Diagram",
    description: "Proper modeling of system classes, attributes, and relationships.",
    maxPercent: 7,
  },
  {
    id: "c1_er_diagram",
    label: "ER Diagram",
    description: "Accurate modeling of entities, relationships, and constraints.",
    maxPercent: 5,
  },
  {
    id: "c1_database_design",
    label: "Database Design",
    description: "Proper normalization, schema structure, and data integrity.",
    maxPercent: 6,
  },
  {
    id: "c1_project_planning",
    label: "Project Planning",
    description: "Timeline, milestones, and project management strategy.",
    maxPercent: 8,
  },
  {
    id: "c1_documentation_quality",
    label: "Documentation Quality",
    description: "Organization, clarity, formatting, references, and professionalism of the documents.",
    maxPercent: 8,
  },
]

/** Capstone II — implementation & delivery (weights sum to {@link EVALUATE_STAGE_WEIGHT_SUM}). */
export const CAPSTONE_II_IMPLEMENTATION_CRITERIA: StageEvaluationCriterion[] = [
  {
    id: "c2_technical_implementation",
    label: "Technical Implementation",
    description: "Correct implementation of system features and architecture.",
    maxPercent: 10,
  },
  {
    id: "c2_code_quality",
    label: "Code Quality",
    description: "Clean, readable, maintainable, and well-structured code.",
    maxPercent: 8,
  },
  {
    id: "c2_system_functionality",
    label: "System Functionality",
    description: "The system performs all required tasks correctly.",
    maxPercent: 10,
  },
  {
    id: "c2_ui_ux",
    label: "UI/UX Design",
    description: "User interface clarity, usability, responsiveness, and accessibility.",
    maxPercent: 8,
  },
  {
    id: "c2_security",
    label: "Security",
    description: "Authentication, authorization, data protection, and secure coding practices.",
    maxPercent: 7,
  },
  {
    id: "c2_database_integration",
    label: "Database Integration",
    description: "Correct database operations, queries, and data management.",
    maxPercent: 6,
  },
  {
    id: "c2_testing",
    label: "Testing",
    description: "Unit testing, integration testing, and system testing evidence.",
    maxPercent: 7,
  },
  {
    id: "c2_performance",
    label: "Performance",
    description: "System speed, scalability, and efficient resource usage.",
    maxPercent: 5,
  },
  {
    id: "c2_deployment",
    label: "Deployment",
    description: "System successfully deployed and accessible (web/mobile/server).",
    maxPercent: 5,
  },
  {
    id: "c2_innovation",
    label: "Innovation",
    description: "Creativity, originality, and added value of the solution.",
    maxPercent: 4,
  },
]

/** Shared for Capstone I and II (weights sum to {@link EVALUATE_COMMON_WEIGHT_SUM}). */
export const COMMON_PRESENTATION_CRITERIA: StageEvaluationCriterion[] = [
  {
    id: "common_presentation_skills",
    label: "Presentation Skills",
    description: "Clarity and organization of the presentation.",
    maxPercent: 4,
  },
  {
    id: "common_communication_skills",
    label: "Communication Skills",
    description: "Ability to explain technical concepts clearly.",
    maxPercent: 4,
  },
  {
    id: "common_confidence",
    label: "Confidence",
    description: "Confidence while presenting and answering questions.",
    maxPercent: 3,
  },
  {
    id: "common_team_collaboration",
    label: "Team Collaboration",
    description: "Cooperation and teamwork among group members.",
    maxPercent: 4,
  },
  {
    id: "common_individual_contribution",
    label: "Individual Contribution",
    description: "Each student's role and contribution to the project.",
    maxPercent: 5,
  },
  {
    id: "common_time_management",
    label: "Time Management",
    description: "Ability to complete tasks on schedule.",
    maxPercent: 2,
  },
  {
    id: "common_professionalism",
    label: "Professionalism",
    description: "Professional behavior and responsibility.",
    maxPercent: 3,
  },
  {
    id: "common_dress_style",
    label: "Dress / Wearing Style",
    description: "Appropriate formal presentation appearance.",
    maxPercent: 1,
  },
  {
    id: "common_problem_solving",
    label: "Problem Solving",
    description: "Ability to answer questions and address technical issues.",
    maxPercent: 2,
  },
  {
    id: "common_project_understanding",
    label: "Project Understanding",
    description: "Depth of understanding of the system and technologies used.",
    maxPercent: 2,
  },
]

export function getEvaluateCriteriaByStage(stage?: AdvisorEvaluatorStage | null): {
  stageSpecificCriteria: StageEvaluationCriterion[]
  commonCriteria: StageEvaluationCriterion[]
} {
  if (stage === "capstone-i") {
    return {
      stageSpecificCriteria: CAPSTONE_I_DOCUMENTATION_CRITERIA,
      commonCriteria: COMMON_PRESENTATION_CRITERIA,
    }
  }

  if (stage === "capstone-ii") {
    return {
      stageSpecificCriteria: CAPSTONE_II_IMPLEMENTATION_CRITERIA,
      commonCriteria: COMMON_PRESENTATION_CRITERIA,
    }
  }

  return { stageSpecificCriteria: [], commonCriteria: [] }
}

export type EvaluationCriterion = StageEvaluationCriterion

export const EVALUATE_REASON_CODES = [
  { code: "E001", label: "Excellent implementation" },
  { code: "E002", label: "Good technical quality" },
  { code: "E003", label: "Satisfactory performance" },
  { code: "E004", label: "Needs improvement" },
  { code: "E005", label: "Incomplete submission" },
] as const
