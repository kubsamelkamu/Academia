import axios from "axios"

import apiClient from "@/lib/api/client"
import { getErrorMessage } from "@/lib/api/errors"
import type {
  DownloadGradesReportParams,
  DownloadGradesReportResult,
  GradesOverviewParams,
  GradesOverviewResponse,
  GradesProjectAnalyticsParams,
  GradesProjectAnalyticsResponse,
  GradesReportFormat,
  GradesReportScope,
  GradesStudentAnalyticsParams,
  GradesStudentAnalyticsResponse,
} from "@/types/grades-reports"

function cleanParams(params: Record<string, string | number | null | undefined>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  )
}

function fallbackFileName(scope: GradesReportScope, format: GradesReportFormat) {
  const extension = format === "excel" ? "xlsx" : format
  return `grades-${scope}-report.${extension}`
}

function parseFileName(contentDisposition: string | undefined, scope: GradesReportScope, format: GradesReportFormat) {
  if (!contentDisposition) {
    return fallbackFileName(scope, format)
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (asciiMatch?.[1]) {
    return asciiMatch[1]
  }

  return fallbackFileName(scope, format)
}

async function parseBlobError(blob: Blob, fallback: string) {
  try {
    const text = await blob.text()
    const parsed = JSON.parse(text) as { message?: string | string[] }
    const message = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message
    return message || fallback
  } catch {
    return fallback
  }
}

export async function getGradesOverview(
  params: GradesOverviewParams
): Promise<GradesOverviewResponse> {
  const response = await apiClient.get<GradesOverviewResponse>("/analytics/grades/overview", {
    params: cleanParams({
      stage: params.stage,
      departmentId: params.departmentId ?? undefined,
    }),
  })

  return response.data
}

export async function getGradesProjects(
  params: GradesProjectAnalyticsParams
): Promise<GradesProjectAnalyticsResponse> {
  const response = await apiClient.get<GradesProjectAnalyticsResponse>("/analytics/grades/projects", {
    params: cleanParams({
      stage: params.stage,
      departmentId: params.departmentId ?? undefined,
      search: params.search,
      projectStatus: params.projectStatus ?? undefined,
      aggregationStatus: params.aggregationStatus ?? undefined,
      finalizationStatus: params.finalizationStatus ?? undefined,
      page: params.page,
      limit: params.limit,
    }),
  })

  return response.data
}

export async function getGradesStudents(
  params: GradesStudentAnalyticsParams
): Promise<GradesStudentAnalyticsResponse> {
  const response = await apiClient.get<GradesStudentAnalyticsResponse>("/analytics/grades/students", {
    params: cleanParams({
      stage: params.stage,
      departmentId: params.departmentId ?? undefined,
      search: params.search,
      finalizationStatus: params.finalizationStatus ?? undefined,
      letterGrade: params.letterGrade ?? undefined,
      minFinalGrade: params.minFinalGrade ?? undefined,
      maxFinalGrade: params.maxFinalGrade ?? undefined,
      page: params.page,
      limit: params.limit,
    }),
  })

  return response.data
}

export async function downloadGradesReport(
  params: DownloadGradesReportParams
): Promise<DownloadGradesReportResult> {
  const scope = params.scope ?? "projects"

  try {
    const response = await apiClient.get<Blob>(`/reports/grades/${params.format}`, {
      params: cleanParams({
        format: params.format,
        stage: params.stage,
        scope,
        departmentId: params.departmentId ?? undefined,
        search: params.search,
        projectStatus: params.projectStatus ?? undefined,
        aggregationStatus: params.aggregationStatus ?? undefined,
        finalizationStatus: params.finalizationStatus ?? undefined,
        letterGrade: params.letterGrade ?? undefined,
        minFinalGrade: params.minFinalGrade ?? undefined,
        maxFinalGrade: params.maxFinalGrade ?? undefined,
      }),
      responseType: "blob",
    })

    return {
      blob: response.data,
      fileName: parseFileName(response.headers["content-disposition"], scope, params.format),
      contentType: response.headers["content-type"] ?? null,
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      throw new Error(
        await parseBlobError(error.response.data, `Failed to download ${params.format.toUpperCase()} report.`)
      )
    }

    throw new Error(getErrorMessage(error, `Failed to download ${params.format.toUpperCase()} report.`))
  }
}