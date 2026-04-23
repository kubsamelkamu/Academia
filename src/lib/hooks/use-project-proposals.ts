"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createProposalFeedback,
  createProposalRejectionReminder,
  createProposalDraft,
  createProposalWithProposalPdf,
  getProjectProposalById,
  getProjectProposalTitleVotes,
  listDepartmentProposals,
  listMyGroupProposals,
  listProposalFeedbacks,
  submitProposalForReview,
  updateProposalStatus,
  voteProjectProposalTitle,
} from "@/lib/api/project-proposals"
import type {
  CreateProjectProposalFeedbackDto,
  CreateProjectProposalRejectionReminderDto,
  DepartmentProjectProposalsResult,
  ProjectProposal,
  ProjectProposalFeedback,
  ProjectProposalRejectionReminder,
  ProjectProposalTitleVote,
  ProjectProposalTitleVotesResult,
  VoteProjectProposalTitleDto,
  UpdateProjectProposalStatusDto,
} from "@/types/project-proposals"

export function projectProposalKeys() {
  return {
    root: ["project-proposals"] as const,
    group: () => ["project-proposals", "group"] as const,
    department: (departmentId: string) => ["project-proposals", "department", departmentId] as const,
    details: (proposalId: string) => ["project-proposals", "details", proposalId] as const,
    feedback: (proposalId: string) => ["project-proposals", "feedback", proposalId] as const,
    titleVotes: (proposalId: string) => ["project-proposals", "title-votes", proposalId] as const,
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

export function useProjectProposalDetails(params: {
  proposalId: string | null | undefined
  enabled?: boolean
}) {
  const proposalId = params.proposalId?.trim() ? params.proposalId.trim() : null
  const enabled = (params.enabled ?? true) && Boolean(proposalId)

  return useQuery<ProjectProposal, Error>({
    queryKey: enabled
      ? projectProposalKeys().details(proposalId ?? "")
      : projectProposalKeys().root,
    queryFn: () => {
      if (!proposalId) {
        throw new Error("proposalId is required")
      }

      return getProjectProposalById(proposalId)
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
        queryKey: projectProposalKeys().details(variables.proposalId),
      })
      await queryClient.invalidateQueries({
        queryKey: projectProposalKeys().feedback(variables.proposalId),
      })
    },
  })
}

export function useCreateProjectProposalFeedback() {
  const queryClient = useQueryClient()

  return useMutation<ProjectProposalFeedback, Error, {
    proposalId: string
    dto: CreateProjectProposalFeedbackDto
  }>({
    mutationFn: ({ proposalId, dto }) => createProposalFeedback(proposalId, dto),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: projectProposalKeys().root })
      await queryClient.invalidateQueries({
        queryKey: projectProposalKeys().details(variables.proposalId),
      })
      await queryClient.invalidateQueries({
        queryKey: projectProposalKeys().feedback(variables.proposalId),
      })
    },
  })
}

export function useVoteProjectProposalTitle() {
  const queryClient = useQueryClient()

  return useMutation<ProjectProposalTitleVote, Error, {
    proposalId: string
    dto: VoteProjectProposalTitleDto
  }>({
    mutationFn: ({ proposalId, dto }) => voteProjectProposalTitle(proposalId, dto),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: projectProposalKeys().titleVotes(variables.proposalId),
      })
    },
  })
}

export function useProjectProposalTitleVotes(params: {
  proposalId: string | null | undefined
  enabled?: boolean
}) {
  const proposalId = params.proposalId?.trim() ? params.proposalId.trim() : null
  const enabled = (params.enabled ?? true) && Boolean(proposalId)

  return useQuery<ProjectProposalTitleVotesResult, Error>({
    queryKey: enabled
      ? projectProposalKeys().titleVotes(proposalId ?? "")
      : projectProposalKeys().root,
    queryFn: () => {
      if (!proposalId) {
        throw new Error("proposalId is required")
      }

      return getProjectProposalTitleVotes(proposalId)
    },
    enabled,
    staleTime: 10_000,
    retry: false,
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
