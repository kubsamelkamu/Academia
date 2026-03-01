"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createMilestoneTemplate,
  deleteMilestoneTemplate,
  listMilestoneTemplates,
  updateMilestoneTemplate,
} from "@/lib/api/milestone-templates"
import type {
  CreateMilestoneTemplateDto,
  CreateMilestoneTemplateResult,
  DeleteMilestoneTemplateResult,
  ListMilestoneTemplatesParams,
  MilestoneTemplatesListData,
  UpdateMilestoneTemplateDto,
  UpdateMilestoneTemplateResult,
} from "@/types/milestone-templates"

export function milestoneTemplatesKeys() {
  return {
    root: ["departments", "milestone-templates"] as const,
    department: (departmentId: string) =>
      ["departments", "milestone-templates", departmentId] as const,
    list: (departmentId: string, params: ListMilestoneTemplatesParams) =>
      ["departments", "milestone-templates", departmentId, params] as const,
  }
}

export function useMilestoneTemplatesList(
  departmentId: string | null | undefined,
  params: ListMilestoneTemplatesParams
) {
  return useQuery<MilestoneTemplatesListData, Error>({
    queryKey: departmentId
      ? milestoneTemplatesKeys().list(departmentId, params)
      : milestoneTemplatesKeys().root,
    queryFn: async () => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }
      return listMilestoneTemplates(departmentId, params)
    },
    enabled: Boolean(departmentId),
  })
}

export function useCreateMilestoneTemplate(departmentId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation<CreateMilestoneTemplateResult, Error, CreateMilestoneTemplateDto>({
    mutationFn: async (dto) => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }
      return createMilestoneTemplate(departmentId, dto)
    },
    onSuccess: async () => {
      if (departmentId) {
        await queryClient.invalidateQueries({
          queryKey: milestoneTemplatesKeys().department(departmentId),
        })
      }
    },
  })
}

export function useUpdateMilestoneTemplate(departmentId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateMilestoneTemplateResult,
    Error,
    { templateId: string; dto: UpdateMilestoneTemplateDto }
  >({
    mutationFn: async ({ templateId, dto }) => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }
      return updateMilestoneTemplate(departmentId, templateId, dto)
    },
    onSuccess: async () => {
      if (departmentId) {
        await queryClient.invalidateQueries({
          queryKey: milestoneTemplatesKeys().department(departmentId),
        })
      }
    },
  })
}

export function useDeleteMilestoneTemplate(departmentId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation<DeleteMilestoneTemplateResult, Error, { templateId: string }>({
    mutationFn: async ({ templateId }) => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }
      return deleteMilestoneTemplate(departmentId, templateId)
    },
    onSuccess: async () => {
      if (departmentId) {
        await queryClient.invalidateQueries({
          queryKey: milestoneTemplatesKeys().department(departmentId),
        })
      }
    },
  })
}


