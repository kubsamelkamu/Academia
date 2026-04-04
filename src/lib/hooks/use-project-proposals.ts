"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createProposalRejectionReminder,
  createProposalDraft,
  createProposalWithProposalPdf,
  listDepartmentProposals,
  listMyGroupProposals,
  listProposalFeedbacks,
  submitProposalForReview,
  updateProposalStatus,
} from "@/lib/api/project-proposals"
import type {
  CreateProjectProposalRejectionReminderDto,
  DepartmentProjectProposalsResult,
  ProjectProposal,
  ProjectProposalFeedback,
  ProjectProposalRejectionReminder,
  UpdateProjectProposalStatusDto,
} from "@/types/project-proposals"

export function projectProposalKeys() {
  return {
    root: ["project-proposals"] as const,
    group: () => ["project-proposals", "group"] as const,
    department: (departmentId: string) => ["project-proposals", "department", departmentId] as const,
    feedback: (proposalId: string) => ["project-proposals", "feedback", proposalId] as const,
  }
}

export function useMyGroupProposals(enabled = true) {
  return useQuery<ProjectProposal[], Error>({
    queryKey: enabled ? projectProposalKeys().group() : projectProposalKeys().root,
    queryFn: () => listMyGroupProposals(),
    enabled,
    staleTime: 30_000,
  })
}

export function useDepartmentProjectProposals(params: {
  departmentId: string | null | undefined
  enabled?: boolean
}) {
  const departmentId = params.departmentId?.trim() ? params.departmentId.trim() : null
  const enabled = (params.enabled ?? true) && Boolean(departmentId)

  return useQuery<DepartmentProjectProposalsResult, Error>({
    queryKey: enabled
      ? projectProposalKeys().department(departmentId ?? "")
      : projectProposalKeys().root,
    queryFn: () => {
      if (!departmentId) {
        throw new Error("departmentId is required")
      }

      return listDepartmentProposals(departmentId)
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useProjectProposalFeedbacks(params: {
  proposalId: string | null | undefined
  enabled?: boolean
}) {
  const proposalId = params.proposalId?.trim() ? params.proposalId.trim() : null
  const enabled = (params.enabled ?? true) && Boolean(proposalId)

  return useQuery<ProjectProposalFeedback[], Error>({
    queryKey: enabled
      ? projectProposalKeys().feedback(proposalId ?? "")
      : projectProposalKeys().root,
    queryFn: () => {
      if (!proposalId) {
        throw new Error("proposalId is required")
      }

      return listProposalFeedbacks(proposalId)
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useCreateProposalDraft() {
  return useMutation<ProjectProposal, Error, {
    titles: [string, string, string]
    description?: string
  }>({
    mutationFn: (params) => createProposalDraft(params),
  })
}

export function useCreateProposalWithPdf() {
  return useMutation<ProjectProposal, Error, {
    titles: [string, string, string]
    description?: string
    proposalPdf: File
  }>({
    mutationFn: (params) => createProposalWithProposalPdf(params),
  })
}

export function useSubmitProposalForReview() {
  return useMutation<ProjectProposal, Error, { proposalId: string }>({
    mutationFn: ({ proposalId }) => submitProposalForReview(proposalId),
  })
}

export function useUpdateProjectProposalStatus() {
  const queryClient = useQueryClient()

  return useMutation<ProjectProposal, Error, {
    proposalId: string
    dto: UpdateProjectProposalStatusDto
  }>({
    mutationFn: ({ proposalId, dto }) => updateProposalStatus(proposalId, dto),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: projectProposalKeys().root })
      await queryClient.invalidateQueries({
        queryKey: projectProposalKeys().feedback(variables.proposalId),
      })
    },
  })
}

export function useCreateProposalRejectionReminder() {
  const queryClient = useQueryClient()

  return useMutation<ProjectProposalRejectionReminder, Error, {
    proposalId: string
    dto: CreateProjectProposalRejectionReminderDto
  }>({
    mutationFn: ({ proposalId, dto }) => createProposalRejectionReminder(proposalId, dto),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: projectProposalKeys().root })
      await queryClient.invalidateQueries({ queryKey: ["project-groups"] })
      await queryClient.invalidateQueries({
        queryKey: projectProposalKeys().feedback(variables.proposalId),
      })
    },
  })
}
