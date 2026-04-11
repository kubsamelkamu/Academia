import { RUBRIC_TOTAL_MAX_PERCENT } from "./advisor-evaluator-shared"

import type { AdvisorEvaluatorStage } from "./advisor-evaluator-stage-menu"

export { RUBRIC_TOTAL_MAX_PERCENT }

type StageEvaluationCriterion = {
  id: string
  label: string
  description: string
  maxPercent: number
}

const CRITERION_LINE_MAX = 4

export const CAPSTONE_I_DOCUMENTATION_CRITERIA: StageEvaluationCriterion[] = [
  {
    id: "c1_problem_definition",
    label: "Problem Definition",
    description: "Clear explanation of the problem, objectives, and motivation of the project.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c1_literature_review",
    label: "Literature Review",
    description: "Review of existing systems or research related to the project.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c1_srs",
    label: "Software Requirement Specification (SRS)",
    description: "Completeness and clarity of the requirements document including functional and non-functional requirements.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c1_sdd",
    label: "System Design Document (SDD)",
    description: "Quality of architecture design, modules, and system structure.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c1_use_case",
    label: "Use Case Diagram",
    description: "Correct identification of actors and interactions with the system.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c1_class_diagram",
    label: "Class Diagram",
    description: "Proper modeling of system classes, attributes, and relationships.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c1_er_diagram",
    label: "ER Diagram",
    description: "Accurate modeling of entities, relationships, and constraints.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c1_database_design",
    label: "Database Design",
    description: "Proper normalization, schema structure, and data integrity.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c1_project_planning",
    label: "Project Planning",
    description: "Timeline, milestones, and project management strategy.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c1_documentation_quality",
    label: "Documentation Quality",
    description: "Organization, clarity, formatting, references, and professionalism of the documents.",
    maxPercent: CRITERION_LINE_MAX,
  },
]

export const CAPSTONE_II_IMPLEMENTATION_CRITERIA: StageEvaluationCriterion[] = [
  {
    id: "c2_technical_implementation",
    label: "Technical Implementation",
    description: "Correct implementation of system features and architecture.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c2_code_quality",
    label: "Code Quality",
    description: "Clean, readable, maintainable, and well-structured code.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c2_system_functionality",
    label: "System Functionality",
    description: "The system performs all required tasks correctly.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c2_ui_ux",
    label: "UI/UX Design",
    description: "User interface clarity, usability, responsiveness, and accessibility.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c2_security",
    label: "Security",
    description: "Authentication, authorization, data protection, and secure coding practices.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c2_database_integration",
    label: "Database Integration",
    description: "Correct database operations, queries, and data management.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c2_testing",
    label: "Testing",
    description: "Unit testing, integration testing, and system testing evidence.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c2_performance",
    label: "Performance",
    description: "System speed, scalability, and efficient resource usage.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c2_deployment",
    label: "Deployment",
    description: "System successfully deployed and accessible (web/mobile/server).",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "c2_innovation",
    label: "Innovation",
    description: "Creativity, originality, and added value of the solution.",
    maxPercent: CRITERION_LINE_MAX,
  },
]

export const COMMON_PRESENTATION_CRITERIA: StageEvaluationCriterion[] = [
  {
    id: "common_presentation_skills",
    label: "Presentation Skills",
    description: "Clarity and organization of the presentation.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "common_communication_skills",
    label: "Communication Skills",
    description: "Ability to explain technical concepts clearly.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "common_confidence",
    label: "Confidence",
    description: "Confidence while presenting and answering questions.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "common_team_collaboration",
    label: "Team Collaboration",
    description: "Cooperation and teamwork among group members.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "common_individual_contribution",
    label: "Individual Contribution",
    description: "Each student's role and contribution to the project.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "common_time_management",
    label: "Time Management",
    description: "Ability to complete tasks on schedule.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "common_professionalism",
    label: "Professionalism",
    description: "Professional behavior and responsibility.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "common_dress_style",
    label: "Dress / Wearing Style",
    description: "Appropriate formal presentation appearance.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "common_problem_solving",
    label: "Problem Solving",
    description: "Ability to answer questions and address technical issues.",
    maxPercent: CRITERION_LINE_MAX,
  },
  {
    id: "common_project_understanding",
    label: "Project Understanding",
    description: "Depth of understanding of the system and technologies used.",
    maxPercent: CRITERION_LINE_MAX,
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
