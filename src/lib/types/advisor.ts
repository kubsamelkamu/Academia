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
    submittedAt: string; // ISO Date String
    status: "Pending" | "Approved" | "Rejected" | "Needs Revision";
    documentUrl?: string;
}

export interface AdvisorMilestone {
    id: string;
    projectId: string;
    projectName: string;
    title: string;
    dueDate: string; // ISO Date String
    submittedAt?: string; // ISO Date String
    status: "Pending Review" | "Approved" | "Rejected" | "Upcoming";
    studentName: string;
    documentUrl?: string;
}

export interface AdvisorDashboardOverview {
    stats: AdvisorStats;
    recentProposals: AdvisorProjectProposal[];
    recentMilestones: AdvisorMilestone[];
    myStudents: AdvisorStudent[];
}
