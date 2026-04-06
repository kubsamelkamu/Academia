"use client";

import {
  approveAdvisorDocument,
  clearAdvisorProject,
  createAdvisorAnnouncement,
  createAdvisorMeeting,
  createAdvisorMessageGroup,
  deleteAdvisorMeeting,
  getAdvisorAnnouncements,
  getAdvisorDashboardOverview,
  getAdvisorDocumentById,
  getAdvisorDocuments,
  getAdvisorSubmittedDocuments,
  getAdvisorEvaluationById,
  getAdvisorEvaluations,
  getAdvisorGroupMessages,
  getAdvisorMessageGroupById,
  getAdvisorMessageGroups,
  getAdvisorMyProjects,
  getAdvisorProjectById,
  getAdvisorSchedule,
  getAdvisorStudents,
  requestAdvisorDocumentRevision,
  requestAdvisorEvaluationRevision,
  requestProjectRevision,
  sendAdvisorGroupMessage,
  updateAdvisorEvaluation,
  updateAdvisorMeeting,
  updateAdvisorMilestoneStatus,
  uploadAdvisorDocument,
} from "@/lib/api/advisor";
import type {
  AdvisorCreateAnnouncementDto,
  AdvisorCreateMeetingDto,
  AdvisorCreateMessageDto,
  AdvisorCreateMessageGroupDto,
  AdvisorMilestoneStatusDto,
  AdvisorReviewDocumentDto,
  AdvisorRevisionRequestDto,
  AdvisorUpdateEvaluationDto,
  AdvisorUpdateMeetingDto,
  AdvisorUploadDocumentDto,
} from "@/lib/types/advisor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type AdvisorListParams = Record<string, string | number | boolean | undefined>;

export const advisorKeys = {
  all: () => ["advisor"] as const,
  overview: () => ["advisor", "overview"] as const,
  projects: (params?: AdvisorListParams) => ["advisor", "projects", params ?? {}] as const,
  project: (projectId?: string) => ["advisor", "project", projectId ?? ""] as const,
  students: (params?: AdvisorListParams) => ["advisor", "students", params ?? {}] as const,
  evaluations: (params?: AdvisorListParams) => ["advisor", "evaluations", params ?? {}] as const,
  evaluation: (evaluationId?: string) => ["advisor", "evaluation", evaluationId ?? ""] as const,
  documents: (params?: AdvisorListParams) => ["advisor", "documents", params ?? {}] as const,
  submittedDocuments: () => ["advisor", "submitted-documents"] as const,
  document: (documentId?: string) => ["advisor", "document", documentId ?? ""] as const,
  schedule: (params?: AdvisorListParams) => ["advisor", "schedule", params ?? {}] as const,
  announcements: (params?: AdvisorListParams) => ["advisor", "announcements", params ?? {}] as const,
  groups: (params?: AdvisorListParams) => ["advisor", "groups", params ?? {}] as const,
  group: (groupId?: string) => ["advisor", "group", groupId ?? ""] as const,
  groupMessages: (groupId?: string, limit = 100) => ["advisor", "group-messages", groupId ?? "", limit] as const,
};

function invalidateAdvisorQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: advisorKeys.all() });
}

export function useAdvisorOverview() {
  return useQuery({
    queryKey: advisorKeys.overview(),
    queryFn: getAdvisorDashboardOverview,
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorProjects(params?: AdvisorListParams) {
  return useQuery({
    queryKey: advisorKeys.projects(params),
    queryFn: () => getAdvisorMyProjects(params),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorProject(projectId?: string) {
  return useQuery({
    queryKey: advisorKeys.project(projectId),
    queryFn: () => getAdvisorProjectById(projectId as string),
    enabled: Boolean(projectId),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorStudents(params?: AdvisorListParams) {
  return useQuery({
    queryKey: advisorKeys.students(params),
    queryFn: () => getAdvisorStudents(params),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorEvaluations(params?: AdvisorListParams) {
  return useQuery({
    queryKey: advisorKeys.evaluations(params),
    queryFn: () => getAdvisorEvaluations(params),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorEvaluation(evaluationId?: string) {
  return useQuery({
    queryKey: advisorKeys.evaluation(evaluationId),
    queryFn: () => getAdvisorEvaluationById(evaluationId as string),
    enabled: Boolean(evaluationId),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorDocuments(params?: AdvisorListParams) {
  return useQuery({
    queryKey: advisorKeys.documents(params),
    queryFn: () => getAdvisorDocuments(params),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorSubmittedDocuments() {
  return useQuery({
    queryKey: advisorKeys.submittedDocuments(),
    queryFn: getAdvisorSubmittedDocuments,
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorDocument(documentId?: string) {
  return useQuery({
    queryKey: advisorKeys.document(documentId),
    queryFn: () => getAdvisorDocumentById(documentId as string),
    enabled: Boolean(documentId),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorSchedule(params?: AdvisorListParams) {
  return useQuery({
    queryKey: advisorKeys.schedule(params),
    queryFn: () => getAdvisorSchedule(params),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorAnnouncements(params?: AdvisorListParams) {
  return useQuery({
    queryKey: advisorKeys.announcements(params),
    queryFn: () => getAdvisorAnnouncements(params),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorMessageGroups(params?: AdvisorListParams) {
  return useQuery({
    queryKey: advisorKeys.groups(params),
    queryFn: () => getAdvisorMessageGroups(params),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorMessageGroup(groupId?: string) {
  return useQuery({
    queryKey: advisorKeys.group(groupId),
    queryFn: () => getAdvisorMessageGroupById(groupId as string),
    enabled: Boolean(groupId),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAdvisorGroupMessages(groupId?: string, limit = 100) {
  return useQuery({
    queryKey: advisorKeys.groupMessages(groupId, limit),
    queryFn: () => getAdvisorGroupMessages(groupId as string, { limit }),
    enabled: Boolean(groupId),
    staleTime: 1000 * 10,
    retry: 1,
  });
}

export function useApproveMilestoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, dto }: { milestoneId: string; dto: AdvisorMilestoneStatusDto }) =>
      updateAdvisorMilestoneStatus(milestoneId, dto),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useClearProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, notes }: { projectId: string; notes?: string }) =>
      clearAdvisorProject(projectId, { notes }),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useRequestRevisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, dto }: { projectId: string; dto: AdvisorRevisionRequestDto }) =>
      requestProjectRevision(projectId, dto),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useUpdateEvaluationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ evaluationId, dto }: { evaluationId: string; dto: AdvisorUpdateEvaluationDto }) =>
      updateAdvisorEvaluation(evaluationId, dto),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useRequestEvaluationRevisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ evaluationId, dto }: { evaluationId: string; dto: AdvisorRevisionRequestDto }) =>
      requestAdvisorEvaluationRevision(evaluationId, dto),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dto, file }: { dto: AdvisorUploadDocumentDto; file: File }) => uploadAdvisorDocument(dto, file),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useApproveDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, dto }: { documentId: string; dto?: AdvisorReviewDocumentDto }) =>
      approveAdvisorDocument(documentId, dto),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useRequestDocumentRevisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, dto }: { documentId: string; dto: AdvisorReviewDocumentDto }) =>
      requestAdvisorDocumentRevision(documentId, dto),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useCreateMeetingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AdvisorCreateMeetingDto) => createAdvisorMeeting(dto),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useUpdateMeetingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, dto }: { meetingId: string; dto: AdvisorUpdateMeetingDto }) =>
      updateAdvisorMeeting(meetingId, dto),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useDeleteMeetingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => deleteAdvisorMeeting(meetingId),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useCreateAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dto, file }: { dto: AdvisorCreateAnnouncementDto; file?: File | null }) =>
      createAdvisorAnnouncement(dto, file),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useCreateMessageGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AdvisorCreateMessageGroupDto) => createAdvisorMessageGroup(dto),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}

export function useSendGroupMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, dto }: { groupId: string; dto: AdvisorCreateMessageDto }) =>
      sendAdvisorGroupMessage(groupId, dto),
    onSuccess: () => invalidateAdvisorQueries(queryClient),
  });
}