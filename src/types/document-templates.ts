export type DocumentTemplateType = "SRS" | "SDD" | "REPORT" | "OTHER"

export interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

export interface DocumentTemplateFile {
  fileId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  url: string
  createdAt: string
}

export interface DepartmentDocumentTemplate {
  templateId: string
  type: DocumentTemplateType
  title: string
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  files: DocumentTemplateFile[]
}

export interface ListDocumentTemplatesParams {
  page?: number
  limit?: number
  type?: DocumentTemplateType
  isActive?: boolean
  search?: string
}

export interface DocumentTemplatesListData {
  templates: DepartmentDocumentTemplate[]
  pagination: Pagination
}

export interface CreateDocumentTemplateResult {
  message: string
  templateId: string
  title: string
  type: DocumentTemplateType
  fileCount: number
  createdAt: string
}

export interface DeleteDocumentTemplateResult {
  message: string
}

export interface UpdateDocumentTemplateDto {
  title?: string
  type?: DocumentTemplateType
  isActive?: boolean
}

export interface UpdateDocumentTemplateResult {
  message: string
  templateId?: string
  updatedAt?: string
}

export interface AddDocumentTemplateFilesResult {
  message: string
  templateId?: string
  fileCount?: number
  updatedAt?: string
}

export interface ReplaceDocumentTemplateFilesResult {
  message: string
  templateId?: string
  fileCount?: number
  updatedAt?: string
}

export interface DeleteDocumentTemplateFileResult {
  message: string
  templateId?: string
  fileId?: string
  updatedAt?: string
}
