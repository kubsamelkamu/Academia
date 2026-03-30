"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createProposalDraft,
  createProposalWithProposalPdf,
  listMyGroupProjectProposals,
  listMyProjectProposals,
  submitProposalForReview,
} from "@/lib/api/project-proposals"
import type { ProjectProposal } from "@/types/project-proposals"

export function useMyProjectProposals(enabled = true) {
  return useQuery<ProjectProposal[], Error>({
    queryKey: ["project-proposals", "me"],
    queryFn: () => listMyProjectProposals(),
    enabled,
    staleTime: 15_000,
  })
}

export function useMyGroupProjectProposals(enabled = true) {
  return useQuery<ProjectProposal[], Error>({
    queryKey: ["project-proposals", "group"],
    queryFn: () => listMyGroupProjectProposals(),
    enabled,
    staleTime: 15_000,
  })
}

export function useCreateProposalDraft() {
  const queryClient = useQueryClient()
  return useMutation<ProjectProposal, Error, {
    titles: [string, string, string]
    description?: string
  }>({
    mutationFn: (params) => createProposalDraft(params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project-proposals", "me"] })
      await queryClient.invalidateQueries({ queryKey: ["project-proposals", "group"] })
    },
  })
}

export function useCreateProposalWithPdf() {
  const queryClient = useQueryClient()
  return useMutation<ProjectProposal, Error, {
    titles: [string, string, string]
    description?: string
    proposalPdf: File
  }>({
    mutationFn: (params) => createProposalWithProposalPdf(params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project-proposals", "me"] })
      await queryClient.invalidateQueries({ queryKey: ["project-proposals", "group"] })
    },
  })
}

export function useSubmitProposalForReview() {
  const queryClient = useQueryClient()
  return useMutation<ProjectProposal, Error, { proposalId: string }>({
    mutationFn: ({ proposalId }) => submitProposalForReview(proposalId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project-proposals", "me"] })
      await queryClient.invalidateQueries({ queryKey: ["project-proposals", "group"] })
    },
  })
}
