"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  addDocumentTemplateFiles,
  createDocumentTemplate,
  deleteDocumentTemplateFile,
  deleteDocumentTemplate,
  getDocumentTemplate,
  listDocumentTemplates,
  replaceDocumentTemplateFiles,
  updateDocumentTemplate,
} from "@/lib/api/document-templates"
import type {
  AddDocumentTemplateFilesResult,
  CreateDocumentTemplateResult,
  DeleteDocumentTemplateResult,
  DeleteDocumentTemplateFileResult,
  DepartmentDocumentTemplate,
  DocumentTemplatesListData,
  ListDocumentTemplatesParams,
  ReplaceDocumentTemplateFilesResult,
  UpdateDocumentTemplateDto,
  UpdateDocumentTemplateResult,
} from "@/types/document-templates"

export function documentTemplatesKeys() {
  return {
    root: ["departments", "document-templates"] as const,
    department: (departmentId: string) => ["departments", "document-templates", departmentId] as const,
    list: (departmentId: string, params: ListDocumentTemplatesParams) =>
      ["departments", "document-templates", departmentId, params] as const,
  }
}

export function useDocumentTemplatesList(
  departmentId: string | null | undefined,
  params: ListDocumentTemplatesParams
) {
  return useQuery<DocumentTemplatesListData, Error>({
    queryKey: departmentId ? documentTemplatesKeys().list(departmentId, params) : documentTemplatesKeys().root,
    queryFn: async () => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }
      return listDocumentTemplates(departmentId, params)
    },
    enabled: Boolean(departmentId),
  })
}

export function useDocumentTemplate(
  departmentId: string | null | undefined,
  templateId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = Boolean(departmentId && templateId) && (options?.enabled ?? true)

  return useQuery<DepartmentDocumentTemplate, Error>({
    queryKey:
      departmentId && templateId
        ? (["departments", "document-templates", departmentId, "detail", templateId] as const)
        : documentTemplatesKeys().root,
    queryFn: async () => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }
      if (!templateId) {
        throw new Error("templateId is required")
      }
      return getDocumentTemplate(departmentId, templateId)
    },
    enabled,
  })
}

export function useCreateDocumentTemplate(departmentId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation<
    CreateDocumentTemplateResult,
    Error,
    Parameters<typeof createDocumentTemplate>[1]
  >({
    mutationFn: async (input) => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }
      return createDocumentTemplate(departmentId, input)
    },
    onSuccess: async () => {
      if (departmentId) {
        await queryClient.invalidateQueries({
          queryKey: documentTemplatesKeys().department(departmentId),
        })
      }
    },
  })
}

export function useDeleteDocumentTemplate(departmentId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation<DeleteDocumentTemplateResult, Error, { templateId: string }>({
    mutationFn: async ({ templateId }) => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }
      return deleteDocumentTemplate(departmentId, templateId)
    },
    onSuccess: async () => {
      if (departmentId) {
        await queryClient.invalidateQueries({
          queryKey: documentTemplatesKeys().department(departmentId),
        })
      }
    },
  })
}

export function useUpdateDocumentTemplate(departmentId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateDocumentTemplateResult,
    Error,
    { templateId: string; dto: UpdateDocumentTemplateDto }
  >({
    mutationFn: async ({ templateId, dto }) => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }
      return updateDocumentTemplate(departmentId, templateId, dto)
    },
    onSuccess: async () => {
      if (departmentId) {
        await queryClient.invalidateQueries({
          queryKey: documentTemplatesKeys().department(departmentId),
        })
      }
    },
  })
}

export function useAddDocumentTemplateFiles(departmentId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation<
    AddDocumentTemplateFilesResult,
    Error,
    { templateId: string; files: File[] }
  >({
    mutationFn: async ({ templateId, files }) => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }
      return addDocumentTemplateFiles(departmentId, templateId, files)
    },
    onSuccess: async () => {
      if (departmentId) {
        await queryClient.invalidateQueries({
          queryKey: documentTemplatesKeys().department(departmentId),
        })
      }
    },
  })
}

export function useReplaceDocumentTemplateFiles(departmentId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation<
    ReplaceDocumentTemplateFilesResult,
    Error,
    { templateId: string; files: File[] }
  >({
    mutationFn: async ({ templateId, files }) => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }
      return replaceDocumentTemplateFiles(departmentId, templateId, files)
    },
    onSuccess: async () => {
      if (departmentId) {
        await queryClient.invalidateQueries({
          queryKey: documentTemplatesKeys().department(departmentId),
        })
      }
    },
  })
}

export function useDeleteDocumentTemplateFile(departmentId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation<
    DeleteDocumentTemplateFileResult,
    Error,
    { templateId: string; fileId: string }
  >({
    mutationFn: async ({ templateId, fileId }) => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }
      return deleteDocumentTemplateFile(departmentId, templateId, fileId)
    },
    onSuccess: async () => {
      if (departmentId) {
        await queryClient.invalidateQueries({
          queryKey: documentTemplatesKeys().department(departmentId),
        })
      }
    },
  })
}
