"use client"

import { useMutation, useQuery } from "@tanstack/react-query"

import {
  cancelAdvisorProjectGroupMeeting,
  createAdvisorProjectGroupMeeting,
  getAdvisorProjectGroupMeetingById,
  listAdvisorProjectGroupMeetings,
  updateAdvisorProjectGroupMeeting,
} from "@/lib/api/advisor"
import type {
  AdvisorCancelProjectGroupMeetingDto,
  AdvisorCreateProjectGroupMeetingDto,
  AdvisorMeetingFilter,
  AdvisorProjectGroupMeeting,
  AdvisorProjectGroupMeetingListResponse,
  AdvisorUpdateProjectGroupMeetingDto,
  ReminderWindowHours,
} from "@/lib/types/advisor"

type UseAdvisorProjectGroupMeetingsParams = {
  projectId?: string
  page: number
  limit: number
  filter?: AdvisorMeetingFilter
  reminderWindowHours?: ReminderWindowHours
}

export const advisorProjectGroupMeetingKeys = {
  root: ["advisor", "project-group-meetings"] as const,
  list: (params: {
    projectId: string
    page: number
    limit: number
    filter?: AdvisorMeetingFilter
    reminderWindowHours?: ReminderWindowHours
  }) => ["advisor", "project-group-meetings", params] as const,
  detail: (params: { meetingId: string; projectId: string }) =>
    ["advisor", "project-group-meeting-detail", params] as const,
}

export function useAdvisorProjectGroupMeetings(params: UseAdvisorProjectGroupMeetingsParams) {
  const projectId = params.projectId?.trim() ?? ""

  return useQuery<AdvisorProjectGroupMeetingListResponse, Error>({
    queryKey: advisorProjectGroupMeetingKeys.list({
      projectId,
      page: params.page,
      limit: params.limit,
      filter: params.filter,
      reminderWindowHours: params.reminderWindowHours,
    }),
    queryFn: () =>
      listAdvisorProjectGroupMeetings({
        projectId,
        page: params.page,
        limit: params.limit,
        filter: params.filter,
        reminderWindowHours: params.reminderWindowHours,
      }),
    enabled: Boolean(projectId),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    retry: 1,
  })
}

export function useAdvisorProjectGroupMeetingDetail(params: {
  meetingId?: string
  projectId?: string
}) {
  const meetingId = params.meetingId?.trim() ?? ""
  const projectId = params.projectId?.trim() ?? ""

  return useQuery<AdvisorProjectGroupMeeting, Error>({
    queryKey: advisorProjectGroupMeetingKeys.detail({
      meetingId,
      projectId,
    }),
    queryFn: () => getAdvisorProjectGroupMeetingById(meetingId, projectId),
    enabled: Boolean(meetingId) && Boolean(projectId),
    staleTime: 30_000,
    retry: 1,
  })
}

export function useCreateAdvisorProjectGroupMeeting() {
  return useMutation<AdvisorProjectGroupMeeting, Error, AdvisorCreateProjectGroupMeetingDto>({
    mutationFn: (dto) => createAdvisorProjectGroupMeeting(dto),
  })
}

export function useUpdateAdvisorProjectGroupMeeting() {
  return useMutation<
    AdvisorProjectGroupMeeting,
    Error,
    {
      meetingId: string
      projectId: string
      dto: AdvisorUpdateProjectGroupMeetingDto
    }
  >({
    mutationFn: ({ meetingId, projectId, dto }) =>
      updateAdvisorProjectGroupMeeting(meetingId, projectId, dto),
  })
}

export function useCancelAdvisorProjectGroupMeeting() {
  return useMutation<
    AdvisorProjectGroupMeeting,
    Error,
    {
      meetingId: string
      projectId: string
      dto?: AdvisorCancelProjectGroupMeetingDto
    }
  >({
    mutationFn: ({ meetingId, projectId, dto }) =>
      cancelAdvisorProjectGroupMeeting(meetingId, projectId, dto),
  })
}
