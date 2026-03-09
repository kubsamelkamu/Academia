export type AnnouncementPriority = "high" | "medium" | "low"
export type AnnouncementStatus = "draft" | "published" | "archived"
export type AnnouncementAudience = "all" | "students" | "advisors"

export interface Announcement {
  id: string
  title: string
  content: string
  priority: AnnouncementPriority
  status: AnnouncementStatus
  audience: AnnouncementAudience
  createdAt: string
  updatedAt?: string
}

export const mockAnnouncements: Announcement[] = [
  {
    id: "a1",
    title: "Final Project Submission Deadline",
    content: "All final project submissions are due by August 30, 2024.",
    priority: "high",
    status: "published",
    audience: "all",
    createdAt: "2024-07-01",
  },
  {
    id: "a2",
    title: "Evaluation Schedule Released",
    content: "The evaluation schedule for this semester has been released.",
    priority: "medium",
    status: "published",
    audience: "students",
    createdAt: "2024-07-05",
  },
  {
    id: "a3",
    title: "Advisor Meeting - Mandatory",
    content: "All advisors are required to attend the meeting on July 15.",
    priority: "high",
    status: "published",
    audience: "advisors",
    createdAt: "2024-07-08",
  },
  {
    id: "a4",
    title: "New Grading Policy Update",
    content: "Please review the updated grading policy for the department.",
    priority: "low",
    status: "published",
    audience: "all",
    createdAt: "2024-07-10",
  },
]

export function getAnnouncementById(id: string): Announcement | undefined {
  return mockAnnouncements.find((a) => a.id === id)
}

export function formatAnnouncementDate(isoDate: string): string {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
