export type ScheduledSessionStatus = "upcoming" | "in-progress" | "completed" | "cancelled"

export type ScheduledSessionType = "virtual" | "in-person"

export interface ScheduledSessionTeamMember {
  name: string
  role: string
  avatar?: string
}

export interface ScheduledSessionDocument {
  name: string
  size: string
  uploadedAt: string
}

export interface ScheduledSessionCriterion {
  name: string
  weight: number
  description: string
}

export interface ScheduledSessionDetail {
  id: string
  project: string
  group: string
  date: string
  time: string
  venue: string
  type: ScheduledSessionType
  status: ScheduledSessionStatus
  duration: string
  evaluator: string
  description: string
  agenda: string[]
  teamMembers: ScheduledSessionTeamMember[]
  documents: ScheduledSessionDocument[]
  evaluationCriteria: ScheduledSessionCriterion[]
}

export const ADVISOR_SCHEDULED_SESSIONS: ScheduledSessionDetail[] = [
  {
    id: "1",
    project: "AI‑Powered Campus Navigation",
    group: "Team Alpha",
    date: "2026-04-25",
    time: "10:00 AM",
    venue: "Room 301",
    type: "in-person",
    status: "upcoming",
    duration: "2 hours",
    evaluator: "Dr. Sarah Johnson",
    description:
      "Final evaluation session for the AI‑powered campus navigation system. Students present their work and demonstrate the application.",
    agenda: [
      "Project overview (15 min)",
      "Technical demonstration (30 min)",
      "Q&A session (30 min)",
      "Evaluation and feedback (45 min)",
    ],
    teamMembers: [
      { name: "John Doe", role: "Team Lead", avatar: "" },
      { name: "Jane Smith", role: "Developer", avatar: "" },
      { name: "Mike Johnson", role: "Designer", avatar: "" },
    ],
    documents: [
      { name: "Project Proposal.pdf", size: "2.5 MB", uploadedAt: "2026-01-15" },
      { name: "Final Report.docx", size: "1.8 MB", uploadedAt: "2026-04-20" },
      { name: "Presentation Slides.pptx", size: "5.2 MB", uploadedAt: "2026-04-22" },
    ],
    evaluationCriteria: [
      { name: "Technical implementation", weight: 25, description: "Quality of code and technical solutions" },
      { name: "Innovation", weight: 20, description: "Creativity and novel approaches" },
      { name: "Presentation", weight: 20, description: "Clarity and effectiveness of presentation" },
      { name: "Documentation", weight: 15, description: "Completeness of project documentation" },
      { name: "Q&A performance", weight: 20, description: "Ability to answer questions effectively" },
    ],
  },
  {
    id: "2",
    project: "Real‑Time Campus Analytics",
    group: "Data Analytics Team",
    date: "2026-04-28",
    time: "2:30 PM",
    venue: "Zoom · link in calendar",
    type: "virtual",
    status: "upcoming",
    duration: "90 minutes",
    evaluator: "Dr. David Martinez",
    description:
      "Mid-term evaluation checkpoint: architecture review, data pipeline demo, and discussion of evaluation metrics.",
    agenda: [
      "Architecture recap (20 min)",
      "Live pipeline demo (25 min)",
      "Metrics & validation (20 min)",
      "Feedback (25 min)",
    ],
    teamMembers: [
      { name: "Alex Mercer", role: "Team Lead", avatar: "" },
      { name: "Maria Garcia", role: "Analyst", avatar: "" },
    ],
    documents: [
      { name: "Architecture.pdf", size: "1.2 MB", uploadedAt: "2026-04-10" },
      { name: "Dataset Samples.xlsx", size: "890 KB", uploadedAt: "2026-04-18" },
    ],
    evaluationCriteria: [
      { name: "Technical implementation", weight: 30, description: "System design and implementation quality" },
      { name: "Data & analysis", weight: 25, description: "Sound use of data and analytical methods" },
      { name: "Presentation", weight: 25, description: "Clarity of demo and slides" },
      { name: "Documentation", weight: 20, description: "Reproducibility and completeness" },
    ],
  },
  {
    id: "3",
    project: "Secure Research Data Platform",
    group: "Security Systems",
    date: "2026-05-02",
    time: "9:00 AM",
    venue: "Lab 2B",
    type: "in-person",
    status: "in-progress",
    duration: "2 hours",
    evaluator: "Prof. Anna Williams",
    description: "Security-focused evaluation: threat model walkthrough, access control demo, and compliance checklist.",
    agenda: [
      "Threat model (20 min)",
      "Access control demo (35 min)",
      "Compliance Q&A (30 min)",
      "Scoring & notes (35 min)",
    ],
    teamMembers: [
      { name: "Liam Johnson", role: "Team Lead", avatar: "" },
      { name: "Sophia Chen", role: "Security Engineer", avatar: "" },
      { name: "James Okonjo", role: "Backend", avatar: "" },
    ],
    documents: [
      { name: "Threat Model.pdf", size: "3.1 MB", uploadedAt: "2026-04-12" },
      { name: "Security Checklist.pdf", size: "400 KB", uploadedAt: "2026-04-24" },
    ],
    evaluationCriteria: [
      { name: "Security posture", weight: 35, description: "Controls, hardening, and threat coverage" },
      { name: "Implementation", weight: 25, description: "Code quality and architecture" },
      { name: "Documentation", weight: 20, description: "Policies and technical write-ups" },
      { name: "Presentation", weight: 20, description: "Clarity of security narrative" },
    ],
  },
]

export function getScheduledSessionById(id: string): ScheduledSessionDetail | undefined {
  return ADVISOR_SCHEDULED_SESSIONS.find((s) => s.id === id)
}
