export type MilestoneStatus = "completed" | "in-progress" | "pending" | "overdue"

export interface EvaluatorProjectTeamMember {
  name: string
  role: string
  avatar?: string
  email: string
}

export interface EvaluatorProjectMilestone {
  name: string
  status: MilestoneStatus
  dueDate: string
  completedDate: string | null
  file?: {
    name: string
    url: string
    size?: string
    mimeType?: string
  } | null
}

export interface EvaluatorProjectDocument {
  id: string
  name: string
  type: "pdf" | "docx" | "image" | "zip" | "other"
  size: string
  uploadedAt: string
  status: "approved" | "pending_review" | "rejected"
  url?: string
  note?: string
}

export interface EvaluatorProjectEvaluationEntry {
  date: string
  evaluator: string
  type: string
  score: number
  /** Display scale for past rows (e.g. 100 for legacy); defaults to 100. */
  scoreMax?: number
  feedback: string
}

export interface EvaluatorProjectDetail {
  id: string
  title: string
  description: string
  group: string
  advisor: string
  status: string
  progress: number
  dueDate: string
  startDate: string
  category: string
  technologies: string[]
  teamMembers: EvaluatorProjectTeamMember[]
  milestones: EvaluatorProjectMilestone[]
  documents: EvaluatorProjectDocument[]
  evaluationHistory: EvaluatorProjectEvaluationEntry[]
  nextEvaluation: {
    date: string
    type: string
    evaluator: string
    venue: string
  }
  /** Session card in scheduled mock to deep-link “View session” */
  linkedSessionId: string
}

function teamFrom(names: string[], roles: string[]): EvaluatorProjectTeamMember[] {
  return names.map((name, i) => ({
    name,
    role: roles[i] ?? "Member",
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@university.edu`,
  }))
}

export const ADVISOR_EVALUATOR_PROJECT_DETAILS: Record<string, EvaluatorProjectDetail> = {
  p1: {
    id: "p1",
    title: "AI‑Driven Academic Assistant",
    description:
      "An intelligent assistant for coursework and campus resources, combining NLP with structured university data to answer student questions and surface deadlines.",
    group: "AI Research Group",
    advisor: "Prof. Lisa Anderson",
    status: "in_progress",
    progress: 75,
    dueDate: "2026-08-30",
    startDate: "2026-01-15",
    category: "AI / Education",
    technologies: ["React", "Node.js", "PostgreSQL", "OpenAI API", "TypeScript"],
    teamMembers: teamFrom(
      ["John Doe", "Jane Smith", "Mike Johnson", "Alex Brown"],
      ["Team Lead", "Developer", "Designer", "ML Engineer"],
    ),
    milestones: [
      { name: "Project planning", status: "completed", dueDate: "2026-02-01", completedDate: "2026-01-28" },
      { name: "UI/UX design", status: "completed", dueDate: "2026-03-15", completedDate: "2026-03-10" },
      { name: "Backend development", status: "in-progress", dueDate: "2026-06-01", completedDate: null },
      { name: "Model integration", status: "in-progress", dueDate: "2026-07-15", completedDate: null },
      { name: "Testing & deployment", status: "pending", dueDate: "2026-08-15", completedDate: null },
      { name: "Final presentation", status: "pending", dueDate: "2026-08-30", completedDate: null },
    ],
    documents: [
      { id: "d1", name: "Project Proposal.pdf", type: "pdf", size: "2.5 MB", uploadedAt: "2026-01-15", status: "approved" },
      { id: "d2", name: "UI Wireframes.zip", type: "zip", size: "15.2 MB", uploadedAt: "2026-01-14", status: "approved" },
      { id: "d3", name: "Architecture.png", type: "image", size: "1.8 MB", uploadedAt: "2026-01-13", status: "approved" },
      { id: "d4", name: "API Notes.docx", type: "docx", size: "890 KB", uploadedAt: "2026-01-12", status: "approved" },
      { id: "d5", name: "Progress Report.pdf", type: "pdf", size: "1.2 MB", uploadedAt: "2026-06-15", status: "pending_review" },
    ],
    evaluationHistory: [
      {
        date: "2026-03-15",
        evaluator: "Prof. Lisa Anderson",
        type: "Mid-term review",
        score: 85,
        feedback: "Strong UI direction; tighten API contracts and error handling before scale.",
      },
      {
        date: "2026-05-20",
        evaluator: "Dr. David Martinez",
        type: "Technical review",
        score: 78,
        feedback: "Model integration on track; document training data assumptions clearly.",
      },
    ],
    nextEvaluation: {
      date: "2026-04-25",
      type: "Final evaluation",
      evaluator: "Dr. Sarah Johnson",
      venue: "Room 301",
    },
    linkedSessionId: "1",
  },
  p2: {
    id: "p2",
    title: "Real‑Time Campus Analytics",
    description:
      "Streaming analytics dashboard for foot traffic, energy use, and lab utilization with role-based views for faculty and admins.",
    group: "Data Analytics Team",
    advisor: "Dr. Michael Brown",
    status: "in_progress",
    progress: 60,
    dueDate: "2026-09-10",
    startDate: "2026-02-01",
    category: "Data / Analytics",
    technologies: ["Next.js", "Python", "Kafka", "ClickHouse", "D3.js"],
    teamMembers: teamFrom(
      ["Alex Mercer", "Maria Garcia", "Sam Wilson", "Priya Patel"],
      ["Team Lead", "Analyst", "Engineer", "DevOps"],
    ),
    milestones: [
      { name: "Requirements", status: "completed", dueDate: "2026-02-20", completedDate: "2026-02-18" },
      { name: "Pipeline MVP", status: "completed", dueDate: "2026-04-01", completedDate: "2026-03-28" },
      { name: "Dashboard v1", status: "in-progress", dueDate: "2026-06-15", completedDate: null },
      { name: "Load testing", status: "pending", dueDate: "2026-08-01", completedDate: null },
      { name: "Handoff", status: "pending", dueDate: "2026-09-10", completedDate: null },
    ],
    documents: [
      { id: "d1", name: "Data Model.pdf", type: "pdf", size: "1.1 MB", uploadedAt: "2026-02-10", status: "approved" },
      { id: "d2", name: "Sample Extracts.zip", type: "zip", size: "8 MB", uploadedAt: "2026-03-05", status: "approved" },
    ],
    evaluationHistory: [
      {
        date: "2026-04-10",
        evaluator: "Dr. Michael Brown",
        type: "Checkpoint",
        score: 82,
        feedback: "Solid pipeline design; validate retention policies with IT.",
      },
    ],
    nextEvaluation: {
      date: "2026-04-28",
      type: "Mid-term evaluation",
      evaluator: "Dr. David Martinez",
      venue: "Zoom · link in calendar",
    },
    linkedSessionId: "2",
  },
  p3: {
    id: "p3",
    title: "Secure Research Data Platform",
    description:
      "Zero-trust style access layer for sensitive research datasets with audit trails and department-scoped sharing.",
    group: "Security Systems",
    advisor: "Prof. Emily Davis",
    status: "in_progress",
    progress: 45,
    dueDate: "2026-10-01",
    startDate: "2026-01-20",
    category: "Security / Platform",
    technologies: ["Go", "Kubernetes", "Vault", "PostgreSQL", "OIDC"],
    teamMembers: teamFrom(
      ["Liam Johnson", "Sophia Chen", "James Okonjo"],
      ["Team Lead", "Security Engineer", "Backend"],
    ),
    milestones: [
      { name: "Threat model", status: "completed", dueDate: "2026-02-15", completedDate: "2026-02-12" },
      { name: "Auth MVP", status: "in-progress", dueDate: "2026-05-01", completedDate: null },
      { name: "Audit logging", status: "in-progress", dueDate: "2026-07-01", completedDate: null },
      { name: "Pen test prep", status: "pending", dueDate: "2026-09-01", completedDate: null },
    ],
    documents: [
      { id: "d1", name: "Threat Model.pdf", type: "pdf", size: "3.1 MB", uploadedAt: "2026-02-01", status: "approved" },
      { id: "d2", name: "Access Matrix.xlsx", type: "other", size: "420 KB", uploadedAt: "2026-03-20", status: "pending_review" },
    ],
    evaluationHistory: [
      {
        date: "2026-03-22",
        evaluator: "Prof. Anna Williams",
        type: "Security review",
        score: 76,
        feedback: "Good threat framing; expand key rotation and break-glass flows.",
      },
    ],
    nextEvaluation: {
      date: "2026-05-02",
      type: "Security evaluation",
      evaluator: "Prof. Anna Williams",
      venue: "Lab 2B",
    },
    linkedSessionId: "3",
  },
  p4: {
    id: "p4",
    title: "Smart Campus Navigation",
    description:
      "Mobile-first navigation with accessibility routes, indoor wayfinding, and optional crowd hints during peak hours.",
    group: "Mobile Dev Team",
    advisor: "Dr. Robert Taylor",
    status: "completed",
    progress: 100,
    dueDate: "2026-07-01",
    startDate: "2025-09-01",
    category: "Mobile Application",
    technologies: ["React Native", "Node.js", "MongoDB", "TensorFlow"],
    teamMembers: teamFrom(
      ["John Doe", "Jane Smith", "Mike Johnson", "Alex Brown"],
      ["Team Lead", "Developer", "Designer", "Data Scientist"],
    ),
    milestones: [
      { name: "Project planning", status: "completed", dueDate: "2026-02-01", completedDate: "2026-01-28" },
      { name: "UI/UX design", status: "completed", dueDate: "2026-03-15", completedDate: "2026-03-10" },
      { name: "Backend development", status: "completed", dueDate: "2026-06-01", completedDate: "2026-05-28" },
      { name: "AI model training", status: "completed", dueDate: "2026-07-15", completedDate: "2026-07-01" },
      { name: "Testing & deployment", status: "completed", dueDate: "2026-08-15", completedDate: "2026-08-10" },
      { name: "Final presentation", status: "completed", dueDate: "2026-08-30", completedDate: "2026-08-28" },
    ],
    documents: [
      { id: "d1", name: "Project Proposal.pdf", type: "pdf", size: "2.5 MB", uploadedAt: "2026-01-15", status: "approved" },
      { id: "d2", name: "Final Report.pdf", type: "pdf", size: "4.2 MB", uploadedAt: "2026-08-20", status: "approved" },
    ],
    evaluationHistory: [
      {
        date: "2026-06-01",
        evaluator: "Dr. Robert Taylor",
        type: "Final review",
        score: 92,
        feedback: "Polished delivery; excellent accessibility testing evidence.",
      },
    ],
    nextEvaluation: {
      date: "2026-09-01",
      type: "Archive review",
      evaluator: "Department committee",
      venue: "N/A",
    },
    linkedSessionId: "1",
  },
}

export function getEvaluatorProjectDetail(projectId: string): EvaluatorProjectDetail | undefined {
  return ADVISOR_EVALUATOR_PROJECT_DETAILS[projectId]
}
