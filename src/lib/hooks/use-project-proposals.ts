"use client"

import { useMutation } from "@tanstack/react-query"
import {
  createProposalDraft,
  createProposalWithProposalPdf,
  submitProposalForReview,
} from "@/lib/api/project-proposals"
import type { ProjectProposal } from "@/types/project-proposals"

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
