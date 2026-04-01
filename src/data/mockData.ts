export interface Complaint {
  id: string
  studentName: string
  studentId: string
  targetType: 'grade' | 'evaluation' | 'assignment' | 'defense'
  targetName: string
  targetId: string
  reason: string
  status: 'open' | 'under_review' | 'resolved' | 'rejected'
  submittedAt: string
  updatedAt: string
}

export interface ProjectTitle {
  id: string
  title: string
  description: string
  groupId: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface Evaluation {
  id: string
  projectId: string
  evaluatorId: string
  evaluatorName: string
  status: 'pending' | 'submitted' | 'reviewed'
  submittedAt?: string
  score?: number
  comments?: string
}

export const mockComplaints: Complaint[] = [
  {
    id: 'c1',
    studentName: 'Alex Johnson',
    studentId: 'u7',
    targetType: 'grade',
    targetName: 'Final Project Grade',
    targetId: 'g1',
    reason: 'I believe the grading criteria was not applied consistently compared to other groups. My group completed all required deliverables but received lower marks in innovation category.',
    status: 'open',
    submittedAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'c2',
    studentName: 'Maria Garcia',
    studentId: 'u8',
    targetType: 'evaluation',
    targetName: 'Midterm Evaluation',
    targetId: 'e1',
    reason: 'The evaluator feedback contradicts the rubric scores given. Technical implementation was marked low despite positive comments about code quality.',
    status: 'under_review',
    submittedAt: '2024-01-12T14:20:00Z',
    updatedAt: '2024-01-14T09:15:00Z',
  },
  {
    id: 'c3',
    studentName: 'David Kim',
    studentId: 's2',
    targetType: 'defense',
    targetName: 'Defense Schedule',
    targetId: 'd1',
    reason: 'Defense time conflicts with another scheduled exam. Requesting rescheduling to accommodate both academic commitments.',
    status: 'resolved',
    submittedAt: '2024-01-10T16:45:00Z',
    updatedAt: '2024-01-11T11:30:00Z',
  },
  {
    id: 'c4',
    studentName: 'Samuel Lee',
    studentId: 'u10',
    targetType: 'assignment',
    targetName: 'Advisor Assignment',
    targetId: 'p2',
    reason: 'Current advisor has conflict of interest as they supervised competing group last semester. Request different advisor assignment.',
    status: 'open',
    submittedAt: '2024-01-08T09:15:00Z',
    updatedAt: '2024-01-08T09:15:00Z',
  },
]
export type UserRoleMock =
  | "department_admin"
  | "project_coordinator"
  | "dc_committee"
  | "advisor"
  | "evaluator"
  | "student"
  | "group_manager"

export type UserStatusMock = "active" | "inactive" | "pending"

export interface User {
  id: string
  name: string
  email: string
  role: UserRoleMock
  status: UserStatusMock
  departmentId: string
}

export interface Grade {
  id: string
  studentName: string
  finalScore: number
  grade: string
  status: "provisional" | "final" | "rejected"
  type: "project" | "internship"
  updatedAt: string
  evaluatorScores?: number[]
  advisorScore?: number
  documentationScore?: number
}

export type InternshipGrade = Grade

export interface GroupManagerApplication {
  id: string
  studentId: string
  studentName: string
  email: string
  currentRole: UserRoleMock
  requestedRole: "group_manager"
  motivation: string
  requestedAt: string
  status: "pending" | "approved" | "rejected"
  proposedGroupName?: string
}

export interface StudentGroupMember {
  id: string
  name: string
  email: string
  role: UserRoleMock
  isManager?: boolean
}

export interface StudentGroup {
  id: string
  name: string
  projectTitle: string
  managerId: string
  managerName: string
  managerEmail: string
  members: StudentGroupMember[]
  status: "active" | "completed" | "on_hold"
}

export interface ProjectSummary {
  id: string
  title: string
  status: string
  advisorName: string
  groupName?: string
  advisorId?: string
  evaluatorIds?: string[]
  progress?: number
}

// Alias ProjectSummary as Project for backward compatibility
export type Project = ProjectSummary

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Prof. Sarah Chen",
    email: "schen@stanford.edu",
    role: "department_admin",
    status: "active",
    departmentId: "dept1",
  },
  {
    id: "u2",
    name: "Dr. Michael Brown",
    email: "mbrown@stanford.edu",
    role: "project_coordinator",
    status: "active",
    departmentId: "dept1",
  },
  {
    id: "u3",
    name: "Prof. Emily Davis",
    email: "edavis@stanford.edu",
    role: "dc_committee",
    status: "active",
    departmentId: "dept1",
  },
  {
    id: "u4",
    name: "Dr. Robert Taylor",
    email: "rtaylor@stanford.edu",
    role: "dc_committee",
    status: "active",
    departmentId: "dept1",
  },
  {
    id: "u5",
    name: "Prof. Lisa Anderson",
    email: "landerson@stanford.edu",
    role: "advisor",
    status: "active",
    departmentId: "dept1",
  },
  {
    id: "u6",
    name: "Dr. David Martinez",
    email: "dmartinez@stanford.edu",
    role: "evaluator",
    status: "active",
    departmentId: "dept1",
  },
  {
    id: "u7",
    name: "Alex Johnson",
    email: "ajohnson@stanford.edu",
    role: "student",
    status: "active",
    departmentId: "dept1",
  },
  {
    id: "u8",
    name: "Maria Garcia",
    email: "mgarcia@stanford.edu",
    role: "group_manager",
    status: "active",
    departmentId: "dept1",
  },
  {
    id: "u9",
    name: "Prof. Anna Williams",
    email: "awilliams@stanford.edu",
    role: "dc_committee",
    status: "active",
    departmentId: "dept1",
  },
]

export const mockProjects: ProjectSummary[] = [
  {
    id: "p1",
    title: "AI‑Driven Academic Assistant",
    status: "in_progress",
    advisorName: "Prof. Lisa Anderson",
    groupName: "AI Research Group",
    advisorId: "u5",
    evaluatorIds: ["u6", "u7", "u8"],
    progress: 75,
  },
  {
    id: "p2",
    title: "Real‑Time Campus Analytics",
    status: "in_progress",
    advisorName: "Dr. Michael Brown",
    groupName: "Data Analytics Team",
    advisorId: "u2",
    evaluatorIds: ["u6", "u9"],
    progress: 60,
  },
  {
    id: "p3",
    title: "Secure Research Data Platform",
    status: "in_progress",
    advisorName: "Prof. Emily Davis",
    groupName: "Security Systems",
    advisorId: "u3",
    evaluatorIds: ["u6", "u10"],
    progress: 45,
  },
  {
    id: "p4",
    title: "Smart Campus Navigation",
    status: "completed",
    advisorName: "Dr. Robert Taylor",
    groupName: "Mobile Dev Team",
    advisorId: "u4",
    evaluatorIds: ["u6", "u11"],
    progress: 100,
  },
]

export const mockGrades: Grade[] = [
  {
    id: "g1",
    studentName: "Alex Johnson",
    finalScore: 88.5,
    grade: "A-",
    status: "provisional",
    type: "project",
    updatedAt: "2024-01-10",
    evaluatorScores: [35, 36, 34],
    advisorScore: 26,
    documentationScore: 27.5,
  },
  {
    id: "g2",
    studentName: "Maria Garcia",
    finalScore: 91.0,
    grade: "A",
    status: "provisional",
    type: "internship",
    updatedAt: "2024-01-11",
    evaluatorScores: [37, 38, 36],
    advisorScore: 27,
    documentationScore: 27,
  },
  {
    id: "g3",
    studentName: "David Kim",
    finalScore: 76.5,
    grade: "B",
    status: "final",
    type: "project",
    updatedAt: "2023-12-20",
    evaluatorScores: [30, 31, 29],
    advisorScore: 23,
    documentationScore: 23.5,
  },
]

export const mockProjectTitles: ProjectTitle[] = [
  {
    id: "t1",
    title: "AI-Based Student Experience Analyzer",
    description: "Title proposal for a predictive student engagement system using NLP and behavior streams.",
    groupId: "g1",
    submittedAt: "2025-03-10",
    status: "pending",
  },
  {
    id: "t2",
    title: "Campus Energy Monitoring Dashboard",
    description: "A real-time dashboard to visualize campus energy consumption and drive sustainability.",
    groupId: "g2",
    submittedAt: "2025-03-09",
    status: "approved",
  },
  {
    id: "t3",
    title: "Secure Research Discussion Portal",
    description: "A collaborative platform for research teams with secure access controls and versioning.",
    groupId: "g3",
    submittedAt: "2025-03-08",
    status: "rejected",
  },
]

export const mockEvaluations: Evaluation[] = [
  {
    id: "e1",
    projectId: "p1",
    evaluatorId: "u6",
    evaluatorName: "Dr. David Martinez",
    status: "pending",
    submittedAt: undefined,
    score: undefined,
    comments: undefined,
  },
  {
    id: "e2",
    projectId: "p2",
    evaluatorId: "u6",
    evaluatorName: "Dr. David Martinez",
    status: "submitted",
    submittedAt: "2024-01-15T10:00:00Z",
    score: 85,
    comments: "Good technical implementation with room for improvement in documentation.",
  },
  {
    id: "e3",
    projectId: "p3",
    evaluatorId: "u9",
    evaluatorName: "Prof. Anna Williams",
    status: "reviewed",
    submittedAt: "2024-01-12T14:00:00Z",
    score: 78,
    comments: "Solid foundation but needs more security features.",
  },
]

export const mockGroupManagerApplications: GroupManagerApplication[] = [
  {
    id: "ga1",
    studentId: "u7",
    studentName: "Alex Johnson",
    email: "ajohnson@stanford.edu",
    currentRole: "student",
    requestedRole: "group_manager",
    motivation:
      "I have previous experience leading software projects and would like to coordinate our team deliverables.",
    requestedAt: "2024-01-15",
    status: "pending",
    proposedGroupName: "AI Research Group",
  },
  {
    id: "ga2",
    studentId: "u10",
    studentName: "Samuel Lee",
    email: "slee@stanford.edu",
    currentRole: "student",
    requestedRole: "group_manager",
    motivation:
      "I want to take responsibility for organizing meetings and ensuring our milestones are met on time.",
    requestedAt: "2024-01-18",
    status: "pending",
    proposedGroupName: "Blockchain Innovators",
  },
]

export const mockStudentGroups: StudentGroup[] = [
  {
    id: "g1",
    name: "AI‑Driven Academic Assistant",
    projectTitle: "AI‑Driven Academic Assistant",
    managerId: "u8",
    managerName: "Maria Garcia",
    managerEmail: "mgarcia@stanford.edu",
    status: "active",
    members: [
      {
        id: "u8",
        name: "Maria Garcia",
        email: "mgarcia@stanford.edu",
        role: "group_manager",
        isManager: true,
      },
      {
        id: "s1",
        name: "Alex Johnson",
        email: "ajohnson@stanford.edu",
        role: "student",
      },
      {
        id: "s2",
        name: "David Kim",
        email: "dkim@stanford.edu",
        role: "student",
      },
    ],
  },
  {
    id: "g2",
    name: "Blockchain Voting",
    projectTitle: "Blockchain‑Based Voting System",
    managerId: "u11",
    managerName: "Alice Brown",
    managerEmail: "abrown@stanford.edu",
    status: "active",
    members: [
      {
        id: "u11",
        name: "Alice Brown",
        email: "abrown@stanford.edu",
        role: "group_manager",
        isManager: true,
      },
      {
        id: "s3",
        name: "Charlie Davis",
        email: "cdavis@stanford.edu",
        role: "student",
      },
    ],
  },
]
