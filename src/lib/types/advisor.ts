/**
 * Types representing the Advisor Dashboard data domain.
 */

export interface AdvisorStats {
  totalAssignedStudents: number;
  totalActiveProjects: number;
  pendingProposalReviews: number;
  pendingMilestoneReviews: number;
}

export interface AdvisorStudent {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
  status: "Active" | "Graduated" | "On Leave";
  avatarUrl?: string;
}

export interface AdvisorProjectProposal {
  id: string;
  title: string;
  studentName: string;
  studentId: string;
  submittedAt: string;
  status: "Pending" | "Approved" | "Rejected" | "Needs Revision";
  documentUrl?: string;
}

export interface AdvisorMilestone {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  dueDate: string;
  submittedAt?: string;
  status: "Pending Review" | "Approved" | "Rejected" | "Upcoming";
  studentName: string;
  documentUrl?: string;
}

export interface AdvisorMilestoneReviewQueueProject {
  id: string;
  title: string;
  status?: string | null;
}

export interface AdvisorMilestoneReviewQueueGroup {
  id: string;
  name?: string | null;
  status?: string | null;
}

export interface AdvisorMilestoneReviewQueueMilestone {
  id: string;
  title?: string | null;
  status?: string | null;
  submittedAt?: string | null;
  dueDate?: string | null;
}

export interface AdvisorMilestoneReviewQueueSubmission {
  id: string;
  status?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  createdAt?: string | null;
}

export interface AdvisorMilestoneReviewQueueLatestFeedback {
  id: string;
  message?: string | null;
  attachmentUrl?: string | null;
  createdAt?: string | null;
}

export interface AdvisorMilestoneReviewQueueReview {
  feedbackCount: number;
  latestFeedback?: AdvisorMilestoneReviewQueueLatestFeedback | null;
}

export interface AdvisorMilestoneReviewQueueItem {
  project: AdvisorMilestoneReviewQueueProject;
  group: AdvisorMilestoneReviewQueueGroup;
  milestone: AdvisorMilestoneReviewQueueMilestone;
  latestSubmission: AdvisorMilestoneReviewQueueSubmission;
  review: AdvisorMilestoneReviewQueueReview;
}

export interface AdvisorMilestoneSubmissionFeedbackAuthor {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface AdvisorMilestoneSubmissionFeedbackItem {
  id: string;
  message?: string | null;
  authorRole?: string | null;
  createdAt?: string | null;
  attachmentFileName?: string | null;
  attachmentUrl?: string | null;
  author?: AdvisorMilestoneSubmissionFeedbackAuthor | null;
}

export interface AdvisorDashboardOverview {
  stats: AdvisorStats;
  recentProposals: AdvisorProjectProposal[];
  recentMilestones: AdvisorMilestone[];
  myStudents: AdvisorStudent[];
}

export interface AdvisorProjectMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  joinedAt: string;
  lastActive?: string;
}

export interface AdvisorProjectMilestone {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: "approved" | "submitted" | "overdue" | "completed" | "pending";
  completedDate?: string;
  priority?: string;
  deliverables: string[];
}

export interface AdvisorProjectDocumentSummary {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface AdvisorProjectMeetingPreview {
  id: string;
  title: string;
  date: string;
  time: string;
  attendees: string[];
}

export interface AdvisorProjectMessagePreview {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface AdvisorProjectEvaluationCriterion {
  criteria: string;
  score: number;
  maxScore: number;
  comments: string;
}

export interface AdvisorProjectItem {
  id: string;
  title: string;
  description: string;
  groupName: string;
  groupId: string;
  advisorId: string;
  startDate: string;
  dueDate: string;
  status: "active" | "in-progress" | "pending-review" | "on-hold" | "completed" | "cleared";
  progress: number;
  members: AdvisorProjectMember[];
  milestones: AdvisorProjectMilestone[];
  documents: AdvisorProjectDocumentSummary[];
  meetings: AdvisorProjectMeetingPreview[];
  messages: AdvisorProjectMessagePreview[];
  evaluation: AdvisorProjectEvaluationCriterion[];
  category: string;
  tags: string[];
  technologies: string[];
}

export interface AdvisorProjectsResponse {
  items: AdvisorProjectItem[];
  stats: {
    totalProjects: number;
    activeProjects: number;
    clearedProjects: number;
    completedProjects: number;
  };
}

export interface AdvisorProjectRevisionRequest {
  id: string;
  subject: string;
  feedback: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface AdvisorProjectDetail extends AdvisorProjectItem {
  revisionRequests: AdvisorProjectRevisionRequest[];
}

export interface AdvisorClearanceMilestone {
  id: string;
  name: string;
  status: "approved" | "submitted" | "revision";
  submittedAt: string;
}

export interface AdvisorClearanceMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface AdvisorEvaluationCriteriaSummary {
  technical: number;
  presentation: number;
  documentation: number;
  innovation: number;
}

export interface AdvisorClearanceProject {
  id: string;
  title: string;
  groupName: string;
  progress: number;
  status: "ready_for_clearance" | "cleared" | "revision_required";
  submittedAt: string;
  clearedAt?: string;
  milestones: AdvisorClearanceMilestone[];
  members: AdvisorClearanceMember[];
  evaluationCriteria: AdvisorEvaluationCriteriaSummary;
}

export interface AdvisorStudentsResponse {
  items: AdvisorClearanceProject[];
  stats: {
    readyForClearance: number;
    clearedProjects: number;
    revisionRequired: number;
    totalStudents: number;
  };
}

export interface AdvisorRubricItem {
  id: string;
  label: string;
  description?: string;
  max: number;
  score: number;
}

export interface AdvisorAttachmentLink {
  name: string;
  url: string;
}

export interface AdvisorEvaluationRow {
  id: string;
  studentName: string;
  studentId: string | null;
  projectTitle: string;
  projectType?: string;
  status: "Pending Review" | "Evaluated" | "Needs Revision";
  submittedDate: string;
  dueDate?: string;
  score?: number;
  maxScore?: number;
  priority?: string;
  feedbackCount: number;
}

export interface AdvisorEvaluationDetail extends AdvisorEvaluationRow {
  summary: string;
  rubric: AdvisorRubricItem[];
  attachments: AdvisorAttachmentLink[];
  feedback?: string;
  grade?: string;
}

export interface AdvisorEvaluationsResponse {
  items: AdvisorEvaluationRow[];
  stats: {
    totalEvaluations: number;
    pendingReview: number;
    evaluatedCount: number;
    needsRevision: number;
    overdueCount: number;
    completionRate: number;
  };
}

export interface AdvisorDocumentRow {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  project: string;
  group: string;
  status: "approved" | "pending_review" | "revision_required";
  description: string;
}

export interface AdvisorDocumentDetail extends AdvisorDocumentRow {
  fileUrl: string;
  filePublicId?: string;
  resourceType?: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedById: string;
  reviewedBy?: string;
  reviewedAt?: string;
  feedback?: string;
  milestoneId?: string;
  projectId: string;
}

export interface AdvisorDocumentsResponse {
  items: AdvisorDocumentRow[];
  stats: {
    totalDocuments: number;
    approvedCount: number;
    pendingReviewCount: number;
    revisionRequiredCount: number;
  };
}

export interface AdvisorMeetingAttendee {
  id: string;
  name: string;
  role: string;
  status: "confirmed" | "pending" | "declined";
  avatar?: string;
}

export interface AdvisorMeeting {
  id: string;
  projectId: string;
  title: string;
  project: string;
  date: string;
  time: string;
  durationMinutes: number;
  type: "virtual" | "in-person";
  location: string;
  attendees: AdvisorMeetingAttendee[];
  agenda: string;
  status: string;
}

export interface AdvisorScheduleResponse {
  items: AdvisorMeeting[];
  stats: {
    totalMeetings: number;
    virtualCount: number;
    inPersonCount: number;
    averageConfirmedAttendees: number;
  };
}

export interface AdvisorAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: string;
  status: string;
  audience: string;
  createdAt: string;
  updatedAt: string;
  deadlineAt: string | null;
  targetProjectIds: string[];
  attachmentUrl: string | null;
  attachmentFileName: string | null;
  attachmentMimeType: string | null;
  attachmentSizeBytes: number | null;
}

export interface AdvisorAnnouncementsResponse {
  items: AdvisorAnnouncement[];
  stats: {
    totalAnnouncements: number;
    publishedCount: number;
    draftCount: number;
    archivedCount: number;
  };
}

export interface AdvisorMessageGroupMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: string;
}

export interface AdvisorGroupLastMessage {
  sender: string;
  content: string;
  timestamp: string;
  unread: boolean;
}

export interface AdvisorMessageGroup {
  id: string;
  name: string;
  project: string;
  description: string;
  privacy: string;
  members: AdvisorMessageGroupMember[];
  lastMessage: AdvisorGroupLastMessage;
}

export interface AdvisorMessageAttachment {
  name: string;
  size?: string;
  type: "pdf" | "image" | "other";
}

export interface AdvisorMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: "text";
  isOwn: boolean;
  attachments?: AdvisorMessageAttachment[];
}

export interface AdvisorMessageGroupsResponse {
  items: AdvisorMessageGroup[];
  stats: {
    totalGroups: number;
    totalMembers: number;
    unreadGroups: number;
  };
}

export interface AdvisorGroupMessagesResponse {
  group: AdvisorMessageGroup;
  items: AdvisorMessage[];
}

export interface AdvisorRevisionRequestDto {
  subject?: string;
  feedback: string;
  milestoneId?: string;
  documentId?: string;
  evaluationId?: string;
}

export interface AdvisorUpdateEvaluationDto {
  summary?: string;
  feedback?: string;
  grade?: string;
  status?: "PENDING_REVIEW" | "EVALUATED" | "NEEDS_REVISION";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  projectType?: string;
}

export interface AdvisorReviewDocumentDto {
  feedback?: string;
}

export interface AdvisorUploadDocumentDto {
  projectId: string;
  milestoneId?: string;
  description?: string;
}

export interface AdvisorCreateMeetingDto {
  projectId: string;
  title: string;
  date: string;
  time: string;
  durationMinutes?: number;
  type?: "VIRTUAL" | "IN_PERSON";
  location?: string;
  agenda?: string;
}

export interface AdvisorUpdateMeetingDto {
  title?: string;
  date?: string;
  time?: string;
  durationMinutes?: number;
  type?: "VIRTUAL" | "IN_PERSON";
  status?: string;
  location?: string;
  agenda?: string;
}

export interface AdvisorCreateAnnouncementDto {
  title: string;
  content: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  audience?: "ALL" | "STUDENTS" | "ADVISORS";
  deadlineAt?: string;
  targetProjectIds?: string[];
  attachmentUrl?: string;
}

export interface AdvisorCreateMessageGroupDto {
  name: string;
  projectId?: string;
  description?: string;
  privacy?: "PRIVATE" | "PROJECT";
  memberUserIds?: string[];
}

export interface AdvisorCreateMessageDto {
  content: string;
  attachments?: unknown;
}

export interface AdvisorMilestoneStatusDto {
  status: "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";
  feedback?: string;
}

