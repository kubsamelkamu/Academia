import apiClient from "@/lib/api/client"

export type DepartmentHeadEvaluationStage = "CAPSTONE_I" | "CAPSTONE_II"

export type DepartmentHeadFinalizationStatus =
  | "FINALIZED_PENDING_DEPARTMENT_HEAD"
  | "APPROVED"
  | "REJECTED"

export type DepartmentHeadNextAction =
  | "REVIEW_FINALIZED_RESULT"
  | "VIEW_APPROVED_RESULT"
  | "REVIEW_REJECTED_RESULT"

export interface DepartmentHeadDashboardWeightsSummary {
  isConfigured: boolean
  advisorPercentage: number | null
  evaluatorPercentage: number | null
  updatedAt: string | null
}

export interface DepartmentHeadDashboardSummary {
  totalFinalizedProjectGroups: number
  pendingReviewCount: number
  approvedCount: number
  rejectedCount: number
}

export interface DepartmentHeadDashboardProjectGroup {
  finalResultId: string
  projectId: string
  projectTitle: string
  group: {
    id: string
    name: string
    totalMembers: number
  } | null
  finalizationStatus: DepartmentHeadFinalizationStatus
  weights: {
    advisorPercentage: number
    evaluatorPercentage: number
  }
  finalizedBy: {
    userId: string
    fullName: string
  }
  finalizedAt: string
  approvedAt: string | null
  rejectedAt: string | null
  reviewedBy: {
    userId: string
    fullName: string
  } | null
  hasApprovalNote: boolean
  hasRejectionReason: boolean
  nextAction: DepartmentHeadNextAction
}

export interface DepartmentHeadEvaluationDashboard {
  stage: DepartmentHeadEvaluationStage
  weights: DepartmentHeadDashboardWeightsSummary
  summary: DepartmentHeadDashboardSummary
  projectGroups: DepartmentHeadDashboardProjectGroup[]
}

export interface DepartmentHeadProjectDetailStudent {
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
    status: string
  }[]
  evaluatorAverageScore: number | null
  finalGrade: number
  letterGrade: string
  finalizedEvaluatorScores: {
    evaluatorUserId: string
    evaluatorName: string
    score: number | null
    comment: string | null
  }[]
}

export interface DepartmentHeadReviewHistoryItem {
  action: string
  status: DepartmentHeadFinalizationStatus
  actedBy: {
    userId: string
    fullName: string
  }
  actedAt: string
  note: string | null
}

export interface DepartmentHeadGradeScaleEntry {
  min: number
  max: number
}

export interface DepartmentHeadEvaluationProjectDetail {
  stage: DepartmentHeadEvaluationStage
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
  finalResult: {
    id: string
    status: DepartmentHeadFinalizationStatus
    weights: {
      advisorPercentage: number
      evaluatorPercentage: number
    }
    finalizedBy: {
      userId: string
      fullName: string
    }
    finalizedAt: string
    finalizationNote: string | null
    approvedAt: string | null
    approvalNote: string | null
    rejectedAt: string | null
    rejectionReason: string | null
  }
  advisorEvaluation: {
    status: string
    submittedAt: string | null
  }
  evaluatorEvaluation: {
    totalAssignedEvaluators: number
    submittedEvaluators: number
    evaluators: {
      evaluatorUserId: string
      fullName: string
      email: string
      status: string
      submittedAt: string | null
    }[]
  }
  students: DepartmentHeadProjectDetailStudent[]
  reviewHistory: DepartmentHeadReviewHistoryItem[]
  roundedToDecimalPlaces: number
  gradeScale: Record<string, DepartmentHeadGradeScaleEntry>
}

export interface ApproveDepartmentHeadEvaluationDto {
  note?: string
}

export interface RejectDepartmentHeadEvaluationDto {
  reason: string
}

export interface ApproveDepartmentHeadEvaluationResult {
  finalResultId: string
  projectId: string
  stage: DepartmentHeadEvaluationStage
  status: "APPROVED"
  finalizedBy: {
    userId: string
    fullName: string
  }
  finalizedAt: string
  approvedBy: {
    userId: string
    fullName: string
  }
  approvedAt: string
  note: string | null
}

export interface RejectDepartmentHeadEvaluationResult {
  finalResultId: string
  projectId: string
  stage: DepartmentHeadEvaluationStage
  status: "REJECTED"
  finalizedBy: {
    userId: string
    fullName: string
  }
  finalizedAt: string
  rejectedBy: {
    userId: string
    fullName: string
  }
  rejectedAt: string
  reason: string
}

const DEPARTMENT_HEAD_EVALUATION_DASHBOARD_PATH = "/project-evaluations/department-head/dashboard"
const DEPARTMENT_HEAD_EVALUATION_PROJECTS_PATH = "/project-evaluations/department-head/projects"

export async function getDepartmentHeadEvaluationDashboard(stage: DepartmentHeadEvaluationStage) {
  const response = await apiClient.get<DepartmentHeadEvaluationDashboard>(DEPARTMENT_HEAD_EVALUATION_DASHBOARD_PATH, {
    params: { stage },
  })

  return response.data
}

export async function getDepartmentHeadEvaluationProjectDetail(
  projectId: string,
  stage: DepartmentHeadEvaluationStage
) {
  const response = await apiClient.get<DepartmentHeadEvaluationProjectDetail>(
    `${DEPARTMENT_HEAD_EVALUATION_PROJECTS_PATH}/${projectId}`,
    {
      params: { stage },
    }
  )

  return response.data
}

export async function approveDepartmentHeadEvaluationProject(
  projectId: string,
  stage: DepartmentHeadEvaluationStage,
  dto: ApproveDepartmentHeadEvaluationDto = {}
) {
  const response = await apiClient.post<ApproveDepartmentHeadEvaluationResult>(
    `${DEPARTMENT_HEAD_EVALUATION_PROJECTS_PATH}/${projectId}/approve`,
    dto,
    {
      params: { stage },
    }
  )

  return response.data
}

export async function rejectDepartmentHeadEvaluationProject(
  projectId: string,
  stage: DepartmentHeadEvaluationStage,
  dto: RejectDepartmentHeadEvaluationDto
) {
  const response = await apiClient.post<RejectDepartmentHeadEvaluationResult>(
    `${DEPARTMENT_HEAD_EVALUATION_PROJECTS_PATH}/${projectId}/reject`,
    dto,
    {
      params: { stage },
    }
  )

  return response.data
}