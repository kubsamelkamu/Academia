export type GradesStage = "CAPSTONE_I" | "CAPSTONE_II"

export type GradesAggregationStatus =
  | "WAITING_FOR_WEIGHTS"
  | "WAITING_FOR_ADVISOR"
  | "WAITING_FOR_EVALUATORS"
  | "READY_FOR_AGGREGATION"

export type ProjectFinalizationStatus =
  | "NOT_FINALIZED"
  | "FINALIZED_PENDING_DEPARTMENT_HEAD"
  | "APPROVED"
  | "REJECTED"
   
export type StudentFinalizationStatus =
  | "FINALIZED_PENDING_DEPARTMENT_HEAD"
  | "APPROVED"
  | "REJECTED"

export type GradesProjectStatus = "ACTIVE" | "COMPLETED" | "CANCELLED"

export type GradesReportFormat = "csv" | "excel" | "pdf"

export type GradesReportScope = "projects" | "students"

export interface GradesOverviewParams {
  stage: GradesStage
  departmentId?: string | null
}

export interface GradesProjectAnalyticsParams {
  stage: GradesStage
  departmentId?: string | null
  search?: string
  projectStatus?: GradesProjectStatus | null
  aggregationStatus?: GradesAggregationStatus | null
  finalizationStatus?: ProjectFinalizationStatus | null
  page?: number
  limit?: number
}

export interface GradesStudentAnalyticsParams {
  stage: GradesStage
  departmentId?: string | null
  search?: string
  finalizationStatus?: StudentFinalizationStatus | null
  letterGrade?: string | null
  minFinalGrade?: number | null
  maxFinalGrade?: number | null
  page?: number
  limit?: number
}

export interface GradesOverviewWeights {
  isConfigured: boolean
  advisorPercentage: number
  evaluatorPercentage: number
  updatedAt: string | null
}

export interface GradesOverviewPipeline {
  totalProjectGroups: number
  waitingForWeightsCount: number
  waitingForAdvisorCount: number
  waitingForEvaluatorsCount: number
  readyForAggregationCount: number
  finalizedPendingApprovalCount: number
  approvedCount: number
  rejectedCount: number
}

export interface GradesOverviewReview {
  pendingReviewCount: number
  approvedCount: number
  rejectedCount: number
  approvalRatePercent: number
}

export interface GradesOverviewSummary {
  totalFinalizedStudents: number
  totalPublishedStudents: number
  averageFinalGrade: number | null
  highestFinalGrade: number | null
  lowestFinalGrade: number | null
}

export interface ScoreBandDistribution {
  label: string
  count: number
}

export interface GradesOverviewResponse {
  stage: GradesStage
  departmentId: string
  generatedAt: string
  weights: GradesOverviewWeights
  pipeline: GradesOverviewPipeline
  review: GradesOverviewReview
  grades: GradesOverviewSummary
  distributions: {
    letterGrades: Record<string, number>
    scoreBands: ScoreBandDistribution[]
  }
}

export interface GradesAnalyticsAdvisor {
  userId: string
  fullName: string
  email: string
}

export interface GradesAnalyticsGroup {
  id: string
  name: string
  status: string
  totalMembers?: number
}

export interface GradesProjectAnalyticsItem {
  projectId: string
  projectTitle: string
  projectStatus: GradesProjectStatus | string
  createdAt: string
  advisor: GradesAnalyticsAdvisor | null
  group: GradesAnalyticsGroup | null
  aggregationStatus: GradesAggregationStatus | string
  finalizationStatus: ProjectFinalizationStatus | string
  progress: {
    advisorSubmitted: boolean
    assignedEvaluatorsCount: number
    submittedEvaluatorsCount: number
  }
  finalResult: Record<string, unknown> | null
}

export interface GradesProjectAnalyticsResponse {
  stage: GradesStage
  departmentId: string
  generatedAt: string
  weights: GradesOverviewWeights
  summary: {
    totalProjectGroups: number
    waitingForWeightsCount: number
    waitingForAdvisorCount: number
    waitingForEvaluatorsCount: number
    readyForAggregationCount: number
    notFinalizedCount: number
    finalizedPendingApprovalCount: number
    approvedCount: number
    rejectedCount: number
  }
  pagination: GradesPagination
  filters: {
    search: string | null
    projectStatus: GradesProjectStatus | null
    aggregationStatus: GradesAggregationStatus | null
    finalizationStatus: ProjectFinalizationStatus | null
  }
  items: GradesProjectAnalyticsItem[]
}

export interface GradesStudentAnalyticsItem {
  finalResultScoreId: string
  finalResultId: string
  student: {
    userId: string
    fullName: string
    email: string
    status: string
  }
  project: {
    id: string
    title: string
    status: string
  }
  group: GradesAnalyticsGroup | null
  finalizationStatus: StudentFinalizationStatus | string
  isPublished: boolean
  weights: {
    advisorPercentage: number
    evaluatorPercentage: number
  }
  scores: {
    advisorScore: number | null
    evaluatorAverageScore: number | null
    finalGrade: number | null
    letterGrade: string | null
  }
  finalizedAt: string | null
  publishedAt: string | null
  rejectedAt: string | null
}

export interface GradesStudentAnalyticsResponse {
  stage: GradesStage
  departmentId: string
  generatedAt: string
  summary: {
    approvedCount: number
    pendingApprovalCount: number
    rejectedCount: number
    totalStudents: number
    averageFinalGrade: number | null
    highestFinalGrade: number | null
    lowestFinalGrade: number | null
    letterGradeCounts: Record<string, number>
  }
  pagination: GradesPagination
  filters: {
    search: string | null
    finalizationStatus: StudentFinalizationStatus | null
    letterGrade: string | null
    minFinalGrade: number | null
    maxFinalGrade: number | null
  }
  items: GradesStudentAnalyticsItem[]
}

export interface GradesPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface DownloadGradesReportParams {
  format: GradesReportFormat
  stage: GradesStage
  scope?: GradesReportScope
  departmentId?: string | null
  search?: string
  projectStatus?: GradesProjectStatus | null
  aggregationStatus?: GradesAggregationStatus | null
  finalizationStatus?: ProjectFinalizationStatus | StudentFinalizationStatus | null
  letterGrade?: string | null
  minFinalGrade?: number | null
  maxFinalGrade?: number | null
}

export interface DownloadGradesReportResult {
  blob: Blob
  fileName: string
  contentType: string | null
}