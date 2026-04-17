import apiClient from "@/lib/api/client"

export type StudentFinalGradeStage = "CAPSTONE_I"

export type StudentFinalGradeStatus =
  | "NOT_AVAILABLE"
  | "FINALIZED_PENDING_DEPARTMENT_HEAD"
  | "REJECTED"
  | "APPROVED"

export interface StudentFinalGradeProjectSummary {
  id: string
  title: string
  status: string
}

export interface StudentFinalGradeGroupSummary {
  id: string
  name: string
  status: string
  totalMembers: number
}

export interface StudentFinalGradeScaleEntry {
  min: number
  max: number
}

export interface StudentFinalGradeNotAvailableResponse {
  stage: StudentFinalGradeStage
  isPublished: false
  status: "NOT_AVAILABLE"
  message: string
}

export interface StudentFinalGradePendingResponse {
  stage: StudentFinalGradeStage
  isPublished: false
  status: "FINALIZED_PENDING_DEPARTMENT_HEAD" | "REJECTED"
  project: StudentFinalGradeProjectSummary
  group: StudentFinalGradeGroupSummary | null
  message: string
}

export interface StudentFinalGradePublishedResponse {
  stage: StudentFinalGradeStage
  isPublished: true
  status: "APPROVED"
  project: StudentFinalGradeProjectSummary
  group: StudentFinalGradeGroupSummary | null
  weights: {
    advisorPercentage: number
    evaluatorPercentage: number
  }
  scores: {
    advisorScore: number
    evaluatorAverageScore: number
    finalGrade: number
    letterGrade: string
  }
  finalizedAt: string
  publishedAt: string | null
  roundedToDecimalPlaces: number
  gradeScale: Record<string, StudentFinalGradeScaleEntry>
}

export type StudentFinalGradeResponse =
  | StudentFinalGradeNotAvailableResponse
  | StudentFinalGradePendingResponse
  | StudentFinalGradePublishedResponse

const STUDENT_FINAL_GRADE_PATH = "/project-evaluations/students/me/final-grade"

export async function getStudentFinalGrade(stage: StudentFinalGradeStage = "CAPSTONE_I") {
  const response = await apiClient.get<StudentFinalGradeResponse>(STUDENT_FINAL_GRADE_PATH, {
    params: { stage },
  })

  return response.data
}