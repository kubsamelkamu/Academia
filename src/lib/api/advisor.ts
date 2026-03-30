import apiClient from "@/lib/api/client";
import type {
  AdvisorAnnouncement,
  AdvisorAnnouncementsResponse,
  AdvisorCreateAnnouncementDto,
  AdvisorCreateMeetingDto,
  AdvisorCreateMessageDto,
  AdvisorCreateMessageGroupDto,
  AdvisorDashboardOverview,
  AdvisorDocumentDetail,
  AdvisorDocumentsResponse,
  AdvisorEvaluationDetail,
  AdvisorEvaluationsResponse,
  AdvisorGroupMessagesResponse,
  AdvisorMeeting,
  AdvisorMessage,
  AdvisorMessageGroup,
  AdvisorMessageGroupsResponse,
  AdvisorMilestoneStatusDto,
  AdvisorProjectDetail,
  AdvisorProjectsResponse,
  AdvisorReviewDocumentDto,
  AdvisorRevisionRequestDto,
  AdvisorScheduleResponse,
  AdvisorStudentsResponse,
  AdvisorUpdateEvaluationDto,
  AdvisorUpdateMeetingDto,
  AdvisorUploadDocumentDto,
} from "@/lib/types/advisor";

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

function cleanParams(params?: QueryParams) {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function buildDocumentFormData(dto: AdvisorUploadDocumentDto, file: File) {
  const formData = new FormData();
  formData.append("projectId", dto.projectId);
  if (dto.milestoneId) {
    formData.append("milestoneId", dto.milestoneId);
  }
  if (dto.description) {
    formData.append("description", dto.description);
  }
  formData.append("file", file);
  return formData;
}

function buildAnnouncementFormData(dto: AdvisorCreateAnnouncementDto, file?: File | null) {
  const formData = new FormData();
  formData.append("title", dto.title);
  formData.append("content", dto.content);
  if (dto.priority) {
    formData.append("priority", dto.priority);
  }
  if (dto.status) {
    formData.append("status", dto.status);
  }
  if (dto.audience) {
    formData.append("audience", dto.audience);
  }
  if (dto.deadlineAt) {
    formData.append("deadlineAt", dto.deadlineAt);
  }
  if (dto.targetProjectIds?.length) {
    formData.append("targetProjectIds", JSON.stringify(dto.targetProjectIds));
  }
  if (dto.attachmentUrl) {
    formData.append("attachmentUrl", dto.attachmentUrl);
  }
  if (file) {
    formData.append("file", file);
  }
  return formData;
}

export async function getAdvisorDashboardOverview(): Promise<AdvisorDashboardOverview> {
  const response = await apiClient.get<AdvisorDashboardOverview>("/advisor/dashboard/overview");
  return response.data;
}

export async function getAdvisorMyProjects(params?: QueryParams): Promise<AdvisorProjectsResponse> {
  const response = await apiClient.get<AdvisorProjectsResponse>("/advisor/my-projects", {
    params: cleanParams(params),
  });
  return response.data;
}

export async function getAdvisorProjectById(projectId: string): Promise<AdvisorProjectDetail> {
  const response = await apiClient.get(`/advisor/my-projects/${projectId}`);
  return response.data;
}

export async function getAdvisorStudents(params?: QueryParams): Promise<AdvisorStudentsResponse> {
  const response = await apiClient.get<AdvisorStudentsResponse>("/advisor/students", {
    params: cleanParams(params),
  });
  return response.data;
}

export async function clearAdvisorProject(projectId: string, dto: { notes?: string } = {}) {
  const response = await apiClient.post(`/advisor/students/${projectId}/clear`, dto);
  return response.data;
}

export async function requestProjectRevision(projectId: string, dto: AdvisorRevisionRequestDto) {
  const response = await apiClient.post(`/advisor/students/${projectId}/revision`, dto);
  return response.data;
}

export async function updateAdvisorMilestoneStatus(milestoneId: string, dto: AdvisorMilestoneStatusDto) {
  const response = await apiClient.put(`/projects/milestones/${milestoneId}/status`, dto);
  return response.data;
}

export async function getAdvisorEvaluations(params?: QueryParams): Promise<AdvisorEvaluationsResponse> {
  const response = await apiClient.get<AdvisorEvaluationsResponse>("/advisor/evaluations", {
    params: cleanParams(params),
  });
  return response.data;
}

export async function getAdvisorEvaluationById(evaluationId: string): Promise<AdvisorEvaluationDetail> {
  const response = await apiClient.get<AdvisorEvaluationDetail>(`/advisor/evaluations/${evaluationId}`);
  return response.data;
}

export async function updateAdvisorEvaluation(evaluationId: string, dto: AdvisorUpdateEvaluationDto) {
  const response = await apiClient.patch(`/advisor/evaluations/${evaluationId}`, dto);
  return response.data;
}

export async function requestAdvisorEvaluationRevision(evaluationId: string, dto: AdvisorRevisionRequestDto) {
  const response = await apiClient.post(`/advisor/evaluations/${evaluationId}/revision`, dto);
  return response.data;
}

export async function getAdvisorDocuments(params?: QueryParams): Promise<AdvisorDocumentsResponse> {
  const response = await apiClient.get<AdvisorDocumentsResponse>("/advisor/documents", {
    params: cleanParams(params),
  });
  return response.data;
}

export async function getAdvisorDocumentById(documentId: string): Promise<AdvisorDocumentDetail> {
  const response = await apiClient.get<AdvisorDocumentDetail>(`/advisor/documents/${documentId}`);
  return response.data;
}

export async function uploadAdvisorDocument(dto: AdvisorUploadDocumentDto, file: File) {
  const response = await apiClient.post("/advisor/documents", buildDocumentFormData(dto, file), {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function approveAdvisorDocument(documentId: string, dto: AdvisorReviewDocumentDto = {}) {
  const response = await apiClient.post(`/advisor/documents/${documentId}/approve`, dto);
  return response.data;
}

export async function requestAdvisorDocumentRevision(documentId: string, dto: AdvisorReviewDocumentDto) {
  const response = await apiClient.post(`/advisor/documents/${documentId}/revision`, dto);
  return response.data;
}

export async function getAdvisorSchedule(params?: QueryParams): Promise<AdvisorScheduleResponse> {
  const response = await apiClient.get<AdvisorScheduleResponse>("/advisor/schedule", {
    params: cleanParams(params),
  });
  return response.data;
}

export async function createAdvisorMeeting(dto: AdvisorCreateMeetingDto): Promise<AdvisorMeeting> {
  const response = await apiClient.post<AdvisorMeeting>("/advisor/schedule", dto);
  return response.data;
}

export async function updateAdvisorMeeting(meetingId: string, dto: AdvisorUpdateMeetingDto) {
  const response = await apiClient.patch(`/advisor/schedule/${meetingId}`, dto);
  return response.data;
}

export async function deleteAdvisorMeeting(meetingId: string) {
  const response = await apiClient.delete(`/advisor/schedule/${meetingId}`);
  return response.data;
}

export async function getAdvisorAnnouncements(params?: QueryParams): Promise<AdvisorAnnouncementsResponse> {
  const response = await apiClient.get<AdvisorAnnouncementsResponse>("/advisor/announcements", {
    params: cleanParams(params),
  });
  return response.data;
}

export async function createAdvisorAnnouncement(dto: AdvisorCreateAnnouncementDto, file?: File | null): Promise<AdvisorAnnouncement> {
  const response = await apiClient.post<AdvisorAnnouncement>(
    "/advisor/announcements",
    buildAnnouncementFormData(dto, file),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function getAdvisorMessageGroups(params?: QueryParams): Promise<AdvisorMessageGroupsResponse> {
  const response = await apiClient.get<AdvisorMessageGroupsResponse>("/advisor/messages/groups", {
    params: cleanParams(params),
  });
  return response.data;
}

export async function createAdvisorMessageGroup(dto: AdvisorCreateMessageGroupDto): Promise<AdvisorMessageGroup> {
  const response = await apiClient.post("/advisor/messages/groups", dto);
  return response.data;
}

export async function getAdvisorMessageGroupById(groupId: string): Promise<AdvisorMessageGroup> {
  const response = await apiClient.get(`/advisor/messages/groups/${groupId}`);
  return response.data;
}

export async function getAdvisorGroupMessages(groupId: string, params?: QueryParams): Promise<AdvisorGroupMessagesResponse> {
  const response = await apiClient.get<AdvisorGroupMessagesResponse>(`/advisor/messages/groups/${groupId}/messages`, {
    params: cleanParams(params),
  });
  return response.data;
}

export async function sendAdvisorGroupMessage(groupId: string, dto: AdvisorCreateMessageDto): Promise<AdvisorMessage> {
  const response = await apiClient.post<AdvisorMessage>(`/advisor/messages/groups/${groupId}/messages`, dto);
  return response.data;
}



