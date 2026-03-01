import apiClient from "@/lib/api/client"
import type {
  CreateMilestoneTemplateDto,
  CreateMilestoneTemplateResult,
  DeleteMilestoneTemplateResult,
  ListMilestoneTemplatesParams,
  MilestoneTemplatesListData,
  UpdateMilestoneTemplateDto,
  UpdateMilestoneTemplateResult,
} from "@/types/milestone-templates"

export async function listMilestoneTemplates(
  departmentId: string,
  params: ListMilestoneTemplatesParams
): Promise<MilestoneTemplatesListData> {
  const response = await apiClient.get<MilestoneTemplatesListData>(
    `/departments/${departmentId}/milestone-templates`,
    {
      params,
    }
  )
  return response.data
}

export async function createMilestoneTemplate(
  departmentId: string,
  dto: CreateMilestoneTemplateDto
): Promise<CreateMilestoneTemplateResult> {
  const response = await apiClient.post<CreateMilestoneTemplateResult>(
    `/departments/${departmentId}/milestone-templates`,
    dto
  )
  return response.data
}

export async function updateMilestoneTemplate(
  departmentId: string,
  templateId: string,
  dto: UpdateMilestoneTemplateDto
): Promise<UpdateMilestoneTemplateResult> {
  const response = await apiClient.put<UpdateMilestoneTemplateResult>(
    `/departments/${departmentId}/milestone-templates/${templateId}`,
    dto
  )
  return response.data
}

export async function deleteMilestoneTemplate(
  departmentId: string,
  templateId: string
): Promise<DeleteMilestoneTemplateResult> {
  const response = await apiClient.delete<DeleteMilestoneTemplateResult>(
    `/departments/${departmentId}/milestone-templates/${templateId}`
  )
  return response.data
}
