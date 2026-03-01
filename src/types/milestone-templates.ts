export interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

export interface MilestoneTemplateMilestone {
  sequence: number
  title: string
  description?: string | null
  defaultDurationDays: number
  hasDeliverable: boolean
  requiredDocuments?: string[]
  isRequired: boolean
}

export interface MilestoneTemplate {
  templateId: string
  name: string
  description?: string | null
  milestones: MilestoneTemplateMilestone[]
  isActive: boolean
  createdAt: string
  usageCount?: number
}

export interface ListMilestoneTemplatesParams {
  page?: number
  limit?: number
  isActive?: boolean
  search?: string
}

export interface MilestoneTemplatesListData {
  templates: MilestoneTemplate[]
  pagination: Pagination
}

export interface CreateMilestoneTemplateMilestoneDto {
  sequence: number
  title: string
  description?: string | null
  defaultDurationDays: number
  hasDeliverable: boolean
  requiredDocuments?: string[]
  isRequired: boolean
}

export interface CreateMilestoneTemplateDto {
  name: string
  description?: string
  isActive?: boolean
  milestones: CreateMilestoneTemplateMilestoneDto[]
}

export interface CreateMilestoneTemplateResult {
  message: string
  templateId: string
  name: string
  milestoneCount: number
  createdAt: string
}

export interface UpdateMilestoneTemplateDto {
  name?: string
  description?: string
  isActive?: boolean
  milestones?: CreateMilestoneTemplateMilestoneDto[]
}

export interface UpdateMilestoneTemplateResult {
  message: string
  templateId: string
  name: string
  milestoneCount: number
  updatedAt: string
}

export interface DeleteMilestoneTemplateResult {
  message: string
}
