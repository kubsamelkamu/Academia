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
  AdvisorMilestoneSubmissionFeedbackItem,
  AdvisorMilestoneStatusDto,
  AdvisorMilestoneReviewQueueItem,
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
import type {
  AdvisorAnnouncementItem,
  CreateAdvisorAnnouncementDto,
  UpdateAdvisorAnnouncementDto,
  ListAdvisorAnnouncementsData,
} from "@/types/announcements";

type QueryParams = Record<string, string | number | boolean | undefined | null>;

function cleanParams(params?: QueryParams) {
  if (!params) return undefined;

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function appendValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") return;

  if (Array.isArray(value)) {
    value.forEach((item) => appendValue(formData, key, item));
    return;
  }

  formData.append(key, String(value));
}

function buildDocumentFormData(dto: AdvisorUploadDocumentDto, file: File) {
  const formData = new FormData();
  Object.entries(dto).forEach(([key, value]) => appendValue(formData, key, value));
  formData.append("file", file);
  return formData;
}

function buildAnnouncementFormData(dto: AdvisorCreateAnnouncementDto, file?: File | null) {
  const formData = new FormData();
  Object.entries(dto).forEach(([key, value]) => appendValue(formData, key, value));
  if (file) {
    formData.append("file", file);
  }
  return formData;
}

export interface AdvisorSummaryMetrics {
  totalProjectsAdvising: number
  totalGroupsAdvising: number
  totalStudentsAdvising: number
  totalGroupsSupervising: number
  totalStudentsSupervising: number
  projectStatusCounts: {
    ACTIVE: number
    COMPLETED: number
    CANCELLED: number
  }
  totalProjectsAssigned: number
}

export interface AdvisorSummaryProject {
  id: string
  title: string
  status: string
  startedAt: string
  proposal: { id: string; title: string }
  group: {
    id: string
    name: string
    objectives: string
    technologies: string[]
    status: string
    leader: {
      id: string
      firstName: string
      lastName: string
      email: string
      avatarUrl: string | null
      student: {
        id: string
        bio: string
        githubUrl: string | null
        linkedinUrl: string | null
        portfolioUrl: string | null
        techStack: string[]
      } | null
    }
    members: {
      id: string
      firstName: string
      lastName: string
      email: string
      avatarUrl: string | null
      student: {
        id: string
        bio: string
        githubUrl: string | null
        linkedinUrl: string | null
        portfolioUrl: string | null
        techStack: string[]
      } | null
    }[]
    studentCount: number
  }
}

export interface AdvisorSummary {
  advisor: {
    id: string
    advisorProfileId: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    avatarUrl: string | null
  }
  metrics: AdvisorSummaryMetrics
  projects: AdvisorSummaryProject[]
}

// ── /projects/advisors/me/projects ──────────────────────────────────────────

interface ApiGroupMember {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  student: {
    id: string
    bio: string
    githubUrl: string | null
    linkedinUrl: string | null
    portfolioUrl: string | null
    techStack: string[]
  } | null
}

export interface ApiMilestoneDetail {
  id: string
  title: string
  description: string
  dueDate: string
  status: string
  submittedAt: string | null
}

export interface ApiAdvisorProject {
  id: string
  title: string
  status: string
  startedAt: string
  group: {
    id: string
    name: string
    objectives: string
    technologies: string[]
    status: string
    leader: ApiGroupMember
    members: ApiGroupMember[]
    studentCount: number
  }
  milestones: {
    total: number
    completed: number
    approved: number
    pending: number
    submitted: number
    rejected: number
    progressPercent: number
    details: ApiMilestoneDetail[]
  }
}

function isReviewQueueItemArray(value: unknown): value is AdvisorMilestoneReviewQueueItem[] {
  return Array.isArray(value)
}

function isReviewQueueEnvelope(
  value: unknown
): value is { items?: AdvisorMilestoneReviewQueueItem[] | null } {
  return typeof value === "object" && value !== null && "items" in value
}

function isMilestoneSubmissionFeedbackArray(
  value: unknown
): value is AdvisorMilestoneSubmissionFeedbackItem[] {
  return Array.isArray(value)
}

function isMilestoneSubmissionFeedbackEnvelope(
  value: unknown
): value is { items?: AdvisorMilestoneSubmissionFeedbackItem[] | null } {
  return typeof value === "object" && value !== null && "items" in value
}

/**
 * Fetches the full project list for the currently authenticated advisor.
 */
export async function getAdvisorProjects(): Promise<ApiAdvisorProject[]> {
  const response = await apiClient.get<ApiAdvisorProject[]>("/projects/advisors/me/projects")
  return response.data
}

/**
 * Fetches milestone submissions currently waiting for review by the authenticated advisor.
 */
export async function getAdvisorMilestoneReviewQueue(): Promise<AdvisorMilestoneReviewQueueItem[]> {
  const response = await apiClient.get<AdvisorMilestoneReviewQueueItem[] | { items?: AdvisorMilestoneReviewQueueItem[] }>(
    "/projects/advisors/me/milestone-review-queue"
  )

  if (isReviewQueueItemArray(response.data)) {
    return response.data
  }

  if (isReviewQueueEnvelope(response.data)) {
    return response.data.items ?? []
  }

  return []
}

export async function listAdvisorMilestoneSubmissionFeedbacks(
  milestoneId: string,
  submissionId: string
): Promise<AdvisorMilestoneSubmissionFeedbackItem[]> {
  const trimmedMilestoneId = milestoneId.trim()
  const trimmedSubmissionId = submissionId.trim()

  if (!trimmedMilestoneId) {
    throw new Error("milestoneId is required")
  }

  if (!trimmedSubmissionId) {
    throw new Error("submissionId is required")
  }

  const response = await apiClient.get<
    AdvisorMilestoneSubmissionFeedbackItem[] | { items?: AdvisorMilestoneSubmissionFeedbackItem[] }
  >(
    `/projects/milestones/${encodeURIComponent(trimmedMilestoneId)}/submissions/${encodeURIComponent(trimmedSubmissionId)}/feedbacks`
  )

  if (isMilestoneSubmissionFeedbackArray(response.data)) {
    return response.data
  }

  if (isMilestoneSubmissionFeedbackEnvelope(response.data)) {
    return response.data.items ?? []
  }

  return []
}

export async function addAdvisorMilestoneSubmissionFeedback(
  milestoneId: string,
  submissionId: string,
  message: string,
  file?: File | null
) {
  const trimmedMilestoneId = milestoneId.trim()
  const trimmedSubmissionId = submissionId.trim()
  const trimmedMessage = message.trim()

  if (!trimmedMilestoneId) {
    throw new Error("milestoneId is required")
  }

  if (!trimmedSubmissionId) {
    throw new Error("submissionId is required")
  }

  if (!trimmedMessage) {
    throw new Error("message is required")
  }

  const formData = new FormData()
  formData.append("message", trimmedMessage)
  if (file) {
    formData.append("file", file)
  }

  const response = await apiClient.post(
    `/projects/milestones/${encodeURIComponent(trimmedMilestoneId)}/submissions/${encodeURIComponent(trimmedSubmissionId)}/feedbacks`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data
}

export async function approveAdvisorMilestoneSubmission(
  milestoneId: string,
  submissionId: string
) {
  const trimmedMilestoneId = milestoneId.trim()
  const trimmedSubmissionId = submissionId.trim()

  if (!trimmedMilestoneId) {
    throw new Error("milestoneId is required")
  }

  if (!trimmedSubmissionId) {
    throw new Error("submissionId is required")
  }

  const response = await apiClient.put(
    `/projects/milestones/${encodeURIComponent(trimmedMilestoneId)}/submissions/${encodeURIComponent(trimmedSubmissionId)}/approve`
  )

  return response.data
}


/**
 * Mock data fallback when API is unreachable or we are in active UI development.
 */
const mockOverviewData: AdvisorDashboardOverview = {
    stats: {
        totalAssignedStudents: 12,
        totalActiveProjects: 4,
        pendingProposalReviews: 2,
        pendingMilestoneReviews: 3,
    },
    recentProposals: [
        {
            id: "prop-1",
            title: "Machine Learning applied to Smart Grids",
            studentName: "Alex Mercer",
            studentId: "STU-001",
            submittedAt: new Date(Date.now() - 86400000).toISOString(),
            status: "Pending",
        },
        {
            id: "prop-2",
            title: "Blockchain for Supply Chain Transparency",
            studentName: "Maria Garcia",
            studentId: "STU-002",
            submittedAt: new Date(Date.now() - 172800000).toISOString(),
            status: "Pending",
        }
    ],
    recentMilestones: [
        {
            id: "mil-1",
            projectId: "proj-1",
            projectName: "ML Smart Grids",
            title: "Chapter 1: Literature Review",
            studentName: "Alex Mercer",
            dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
            submittedAt: new Date(Date.now() - 3600000).toISOString(),
            status: "Pending Review",
        },
        {
            id: "mil-2",
            projectId: "proj-2",
            projectName: "IoT Home Automation",
            title: "Hardware Prototype Demo",
            studentName: "Liam Johnson",
            dueDate: new Date(Date.now() - 86400000 * 2).toISOString(),
            submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            status: "Pending Review",
        }
    ],
    myStudents: [
        { id: "STU-001", name: "Alex Mercer", projectId: "proj-1", projectName: "ML Smart Grids", status: "Active" },
        { id: "STU-002", name: "Maria Garcia", projectId: "proj-3", status: "Active" },
        { id: "STU-003", name: "Liam Johnson", projectId: "proj-2", projectName: "IoT Home Automation", status: "Active" }
    ]
};

/**
 * Fetches the summary data for the currently authenticated advisor,
 * including metrics and projects list.
 */
export async function getAdvisorSummary(): Promise<AdvisorSummary> {
  const response = await apiClient.get<AdvisorSummary>("/projects/advisors/me/summary")
  return response.data
}

// ── /project-groups/advisors/me/announcements ────────────────────────────────

const ADVISOR_ANNOUNCEMENTS_BASE = "/project-groups/advisors/me/announcements"

export async function listAdvisorProjectAnnouncements(params: {
  projectId: string
  page?: number
  limit?: number
}): Promise<ListAdvisorAnnouncementsData> {
  const response = await apiClient.get<ListAdvisorAnnouncementsData>(ADVISOR_ANNOUNCEMENTS_BASE, {
    params: {
      projectId: params.projectId,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  })
  return response.data
}

export async function createAdvisorProjectAnnouncement(
  dto: CreateAdvisorAnnouncementDto
): Promise<AdvisorAnnouncementItem> {
  const response = await apiClient.post<AdvisorAnnouncementItem>(ADVISOR_ANNOUNCEMENTS_BASE, dto)
  return response.data
}

export async function getAdvisorProjectAnnouncementById(
  announcementId: string,
  projectId: string
): Promise<AdvisorAnnouncementItem> {
  const response = await apiClient.get<AdvisorAnnouncementItem>(
    `${ADVISOR_ANNOUNCEMENTS_BASE}/${encodeURIComponent(announcementId)}`,
    { params: { projectId } }
  )
  return response.data
}

export async function updateAdvisorProjectAnnouncement(
  announcementId: string,
  projectId: string,
  dto: UpdateAdvisorAnnouncementDto
): Promise<AdvisorAnnouncementItem> {
  const response = await apiClient.patch<AdvisorAnnouncementItem>(
    `${ADVISOR_ANNOUNCEMENTS_BASE}/${encodeURIComponent(announcementId)}`,
    dto,
    { params: { projectId } }
  )
  return response.data
}

export async function deleteAdvisorProjectAnnouncement(
  announcementId: string,
  projectId: string
): Promise<{ deleted: boolean }> {
  const response = await apiClient.delete<{ deleted: boolean }>(
    `${ADVISOR_ANNOUNCEMENTS_BASE}/${encodeURIComponent(announcementId)}`,
    { params: { projectId } }
  )
  return response.data
}

/**
 * Fetches the overview dashboard data for the currently authenticated advisor.
 */
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



