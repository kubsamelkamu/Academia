import apiClient from "@/lib/api/client"

export type CoordinatorEvaluationStage = "CAPSTONE_I" | "CAPSTONE_II"

export interface CoordinatorEvaluationWeightsUpdatedBy {
  userId: string
  fullName: string
}

export interface CoordinatorEvaluationWeights {
  stage: CoordinatorEvaluationStage
  departmentId: string
  isConfigured?: boolean
  advisorPercentage: number
  evaluatorPercentage: number
  updatedAt?: string
  updatedBy?: CoordinatorEvaluationWeightsUpdatedBy | null
}

export interface UpdateCoordinatorEvaluationWeightsDto {
  stage: CoordinatorEvaluationStage
  advisorPercentage: number
  evaluatorPercentage: number
}

export type CoordinatorAggregationStatus =
  | "WAITING_FOR_WEIGHTS"
  | "WAITING_FOR_ADVISOR"
  | "WAITING_FOR_EVALUATORS"
  | "READY_FOR_AGGREGATION"

export type CoordinatorFinalizationStatus =
  | "NOT_FINALIZED"
  | "FINALIZED_PENDING_DEPARTMENT_HEAD"
  | "APPROVED"
  | "REJECTED"

export type CoordinatorNextAction =
  | "CONFIGURE_WEIGHTS"
  | "WAIT_FOR_ADVISOR_SUBMISSION"
  | "WAIT_FOR_EVALUATOR_SUBMISSIONS"
  | "OPEN_PREVIEW"
  | "VIEW_FINALIZED_RESULT"
  | "VIEW_APPROVED_RESULT"
  | "REVIEW_REJECTED_RESULT"

export interface CoordinatorDashboardWeightsSummary {
  isConfigured: boolean
  advisorPercentage: number | null
  evaluatorPercentage: number | null
  updatedAt: string | null
}

export interface CoordinatorDashboardSummary {
  totalProjectGroups: number
  waitingForWeightsCount: number
  waitingForAdvisorCount: number
  waitingForEvaluatorsCount: number
  readyForAggregationCount: number
  finalizedPendingApprovalCount: number
  approvedCount: number
  rejectedCount: number
}

export interface CoordinatorDashboardProjectGroup {
  projectId: string
  projectTitle: string
  projectStatus: string
  group: {
    id: string
    name: string
    totalMembers: number
  } | null
  advisorEvaluation: {
    status: string
    submittedAt: string | null
  }
  evaluatorEvaluation: {
    totalAssignedEvaluators: number
    submittedEvaluators: number
    pendingEvaluators: number
    allSubmitted: boolean
  }
  aggregationStatus: CoordinatorAggregationStatus
  finalizationStatus: CoordinatorFinalizationStatus
  weights: {
    advisorPercentage: number | null
    evaluatorPercentage: number | null
  }
  finalizedBy: {
    userId: string
    fullName: string
  } | null
  finalizedAt: string | null
  approvedAt: string | null
  hasRejectionReason: boolean
  nextAction: CoordinatorNextAction
}

export interface CoordinatorEvaluationDashboard {
  stage: CoordinatorEvaluationStage
  weights: CoordinatorDashboardWeightsSummary
  summary: CoordinatorDashboardSummary
  projectGroups: CoordinatorDashboardProjectGroup[]
}

export interface CoordinatorEvaluationProjectMember {
  studentUserId: string
  fullName: string
  email: string
  advisorScore: {
    score: number | null
    comment: string | null
    status: string
  }
  evaluatorScores: {
    evaluatorUserId: string
    evaluatorName: string
    score: number | null
    comment: string | null
    status: string
  }[]
  evaluatorAverageScore: number | null
  isReadyForFinalCalculation: boolean
}

export interface CoordinatorEvaluationProjectDetail {
  stage: CoordinatorEvaluationStage
  project: {
    id: string
    title: string
    status: string
    createdAt: string
  }
  group: {
    id: string
    name: string
    status: string
    totalMembers: number
    leader: {
      userId: string
      fullName: string
      email: string
    } | null
  }
  weights: CoordinatorDashboardWeightsSummary
  advisorEvaluation: {
    status: string
    submittedAt: string | null
    studentsEvaluated: number
    studentsPendingEvaluation: number
  }
  evaluatorEvaluation: {
    totalAssignedEvaluators: number
    submittedEvaluators: number
    pendingEvaluators: number
    allSubmitted: boolean
    evaluators: {
      evaluatorUserId: string
      fullName: string
      status: string
      submittedAt: string | null
    }[]
  }
  students: CoordinatorEvaluationProjectMember[]
  aggregationStatus: CoordinatorAggregationStatus
  finalizationStatus: CoordinatorFinalizationStatus
  readyForPreview: boolean
}

export interface CoordinatorPreviewGradeScaleEntry {
  min: number
  max: number
}

export interface CoordinatorEvaluationPreviewStudent {
  studentUserId: string
  fullName: string
  email: string
  advisorScore: {
    score: number | null
    comment: string | null
  }
  evaluatorScores: {
    evaluatorUserId: string
    evaluatorName: string
    score: number | null
    comment: string | null
  }[]
  evaluatorAverageScore: number | null
  finalGrade: number
  letterGrade: string
}

export interface CoordinatorEvaluationPreviewResult {
  stage: CoordinatorEvaluationStage
  project: {
    id: string
    title: string
    status: string
  }
  group: {
    id: string
    name: string
    totalMembers: number
  }
  weights: {
    advisorPercentage: number
    evaluatorPercentage: number
  }
  students: CoordinatorEvaluationPreviewStudent[]
  roundedToDecimalPlaces: number
  gradeScale: Record<string, CoordinatorPreviewGradeScaleEntry>
  aggregationStatus: CoordinatorAggregationStatus
  readyToFinalize: boolean
  previewGeneratedAt: string
}

export interface FinalizeCoordinatorEvaluationDto {
  note?: string
}

export interface FinalizeCoordinatorEvaluationResult {
  projectId: string
  stage: CoordinatorEvaluationStage
  status: CoordinatorFinalizationStatus
  weights: {
    advisorPercentage: number
    evaluatorPercentage: number
  }
  finalizedBy: {
    userId: string
    fullName: string
  }
  finalizedAt: string
  note: string | null
  students: {
    studentUserId: string
    fullName: string
    finalGrade: number
    letterGrade: string
  }[]
}

const COORDINATOR_EVALUATION_WEIGHTS_PATH = "/project-evaluations/coordinator/weights"
const COORDINATOR_EVALUATION_DASHBOARD_PATH = "/project-evaluations/coordinator/dashboard"
const COORDINATOR_EVALUATION_PROJECTS_PATH = "/project-evaluations/coordinator/projects"

export async function getCoordinatorEvaluationWeights(stage: CoordinatorEvaluationStage) {
  const response = await apiClient.get<CoordinatorEvaluationWeights>(COORDINATOR_EVALUATION_WEIGHTS_PATH, {
    params: { stage },
  })

  return response.data
}

export async function updateCoordinatorEvaluationWeights(dto: UpdateCoordinatorEvaluationWeightsDto) {
  const response = await apiClient.put<CoordinatorEvaluationWeights>(COORDINATOR_EVALUATION_WEIGHTS_PATH, dto)

  return response.data
}

export async function getCoordinatorEvaluationDashboard(stage: CoordinatorEvaluationStage) {
  const response = await apiClient.get<CoordinatorEvaluationDashboard>(COORDINATOR_EVALUATION_DASHBOARD_PATH, {
    params: { stage },
  })

  return response.data
}

export async function getCoordinatorEvaluationProjectDetail(projectId: string, stage: CoordinatorEvaluationStage) {
  const response = await apiClient.get<CoordinatorEvaluationProjectDetail>(
    `${COORDINATOR_EVALUATION_PROJECTS_PATH}/${projectId}`,
    {
      params: { stage },
    }
  )

  return response.data
}

export async function previewCoordinatorEvaluationProject(projectId: string, stage: CoordinatorEvaluationStage) {
  const response = await apiClient.post<CoordinatorEvaluationPreviewResult>(
    `${COORDINATOR_EVALUATION_PROJECTS_PATH}/${projectId}/preview`,
    undefined,
    {
      params: { stage },
    }
  )

  return response.data
}

export async function finalizeCoordinatorEvaluationProject(
  projectId: string,
  stage: CoordinatorEvaluationStage,
  dto: FinalizeCoordinatorEvaluationDto = {}
) {
  const response = await apiClient.post<FinalizeCoordinatorEvaluationResult>(
    `${COORDINATOR_EVALUATION_PROJECTS_PATH}/${projectId}/finalize`,
    dto,
    {
      params: { stage },
    }
  )

  return response.data
}