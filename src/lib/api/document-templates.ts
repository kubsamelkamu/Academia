import apiClient from "@/lib/api/client"
import type {
  AddDocumentTemplateFilesResult,
  CreateDocumentTemplateResult,
  DeleteDocumentTemplateResult,
  DeleteDocumentTemplateFileResult,
  DepartmentDocumentTemplate,
  DocumentTemplateType,
  DocumentTemplatesListData,
  ListDocumentTemplatesParams,
  ReplaceDocumentTemplateFilesResult,
  UpdateDocumentTemplateDto,
  UpdateDocumentTemplateResult,
} from "@/types/document-templates"

export async function listDocumentTemplates(
  departmentId: string,
  params: ListDocumentTemplatesParams
): Promise<DocumentTemplatesListData> {
  const response = await apiClient.get<DocumentTemplatesListData>(
    `/departments/${departmentId}/document-templates`,
    { params }
  )
  return response.data
}

export async function getDocumentTemplate(
  departmentId: string,
  templateId: string
): Promise<DepartmentDocumentTemplate> {
  const response = await apiClient.get<DepartmentDocumentTemplate>(
    `/departments/${departmentId}/document-templates/${templateId}`
  )
  return response.data
}

export interface CreateDocumentTemplateInput {
  type: DocumentTemplateType
  title: string
  description?: string
  isActive?: boolean
  files: File[]
}

export async function createDocumentTemplate(
  departmentId: string,
  input: CreateDocumentTemplateInput
): Promise<CreateDocumentTemplateResult> {
  const formData = new FormData()
  formData.append("type", input.type)
  formData.append("title", input.title)

  if (typeof input.description === "string" && input.description.trim().length) {
    formData.append("description", input.description.trim())
  }

  if (typeof input.isActive === "boolean") {
    formData.append("isActive", input.isActive ? "true" : "false")
  }

  for (const file of input.files) {
    formData.append("files", file)
  }

  const response = await apiClient.post<CreateDocumentTemplateResult>(
    `/departments/${departmentId}/document-templates`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data
}

export async function deleteDocumentTemplate(
  departmentId: string,
  templateId: string
): Promise<DeleteDocumentTemplateResult> {
  const response = await apiClient.delete<DeleteDocumentTemplateResult>(
    `/departments/${departmentId}/document-templates/${templateId}`
  )
  return response.data
}

export async function updateDocumentTemplate(
  departmentId: string,
  templateId: string,
  dto: UpdateDocumentTemplateDto
): Promise<UpdateDocumentTemplateResult> {
  const response = await apiClient.patch<UpdateDocumentTemplateResult>(
    `/departments/${departmentId}/document-templates/${templateId}`,
    dto
  )
  return response.data
}

export async function addDocumentTemplateFiles(
  departmentId: string,
  templateId: string,
  files: File[]
): Promise<AddDocumentTemplateFilesResult> {
  const formData = new FormData()
  for (const file of files) {
    formData.append("files", file)
  }

  const response = await apiClient.post<AddDocumentTemplateFilesResult>(
    `/departments/${departmentId}/document-templates/${templateId}/files`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data
}

export async function replaceDocumentTemplateFiles(
  departmentId: string,
  templateId: string,
  files: File[]
): Promise<ReplaceDocumentTemplateFilesResult> {
  const formData = new FormData()
  for (const file of files) {
    formData.append("files", file)
  }

  const response = await apiClient.put<ReplaceDocumentTemplateFilesResult>(
    `/departments/${departmentId}/document-templates/${templateId}/files`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data
}

export async function deleteDocumentTemplateFile(
  departmentId: string,
  templateId: string,
  fileId: string
): Promise<DeleteDocumentTemplateFileResult> {
  const response = await apiClient.delete<DeleteDocumentTemplateFileResult>(
    `/departments/${departmentId}/document-templates/${templateId}/files/${fileId}`
  )
  return response.data
}
