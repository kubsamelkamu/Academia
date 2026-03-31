"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import {
  createProposalDraft,
  createProposalWithProposalPdf,
  listMyGroupProposals,
  submitProposalForReview,
} from "@/lib/api/project-proposals"
import type { ProjectProposal } from "@/types/project-proposals"

export function projectProposalKeys() {
  return {
    root: ["project-proposals"] as const,
    group: () => ["project-proposals", "group"] as const,
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
