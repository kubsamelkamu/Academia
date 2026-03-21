import apiClient from "@/lib/api/client";
import { AdvisorDashboardOverview } from "@/lib/types/advisor";


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
 * Fetches the overview dashboard data for the currently authenticated advisor.
 */
export async function getAdvisorDashboardOverview(): Promise<AdvisorDashboardOverview> {
    try {
        const response = await apiClient.get<AdvisorDashboardOverview>("/advisor/dashboard/overview");
        return response.data;
    } catch (error) {
        console.warn("Failed to fetch real advisor overview data. Falling back to MOCK data.", error);
        return mockOverviewData;
    }
}
