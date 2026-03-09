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
}

export type InternshipGrade = Grade

export interface ProjectSummary {
  id: string
  title: string
  status: string
  advisorName: string
}

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
    status: "active",
    advisorName: "Prof. Lisa Anderson",
  },
  {
    id: "p2",
    title: "Real‑Time Campus Analytics",
    status: "active",
    advisorName: "Dr. Michael Brown",
  },
  {
    id: "p3",
    title: "Secure Research Data Platform",
    status: "active",
    advisorName: "Prof. Emily Davis",
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
  },
  {
    id: "g2",
    studentName: "Maria Garcia",
    finalScore: 91.0,
    grade: "A",
    status: "provisional",
    type: "internship",
    updatedAt: "2024-01-11",
  },
  {
    id: "g3",
    studentName: "David Kim",
    finalScore: 76.5,
    grade: "B",
    status: "final",
    type: "project",
    updatedAt: "2023-12-20",
  },
]

export const mockInternshipGrades: InternshipGrade[] = mockGrades.filter(
  (g) => g.type === "internship",
)

