export interface Faculty {
  id: string
  name: string
  email: string
  role: string
  status: string
  department: string
  specialization?: string
  courses?: number
  students?: number
  phone?: string
  office?: string
}

export const mockFaculty: Faculty[] = [
  {
    id: "f1",
    name: "Dr. Sarah Johnson",
    email: "s.johnson@university.edu",
    role: "advisor",
    status: "active",
    department: "Computer Science",
    specialization: "Artificial Intelligence",
    courses: 3,
    students: 12,
    phone: "+1 (555) 123-4567",
    office: "Room 401, CS Building",
  },
  {
    id: "f2",
    name: "Prof. Michael Chen",
    email: "m.chen@university.edu",
    role: "advisor",
    status: "active",
    department: "Computer Science",
    specialization: "Software Engineering",
    courses: 2,
    students: 8,
    office: "Room 405, CS Building",
  },
  {
    id: "f3",
    name: "Dr. Emily Rodriguez",
    email: "e.rodriguez@university.edu",
    role: "evaluator",
    status: "active",
    department: "Computer Science",
    specialization: "Data Science",
    courses: 4,
    students: 15,
    office: "Room 410, CS Building",
  },
  {
    id: "f4",
    name: "Prof. David Kim",
    email: "d.kim@university.edu",
    role: "group_manager",
    status: "active",
    department: "Computer Science",
    specialization: "Project Management",
    courses: 2,
    students: 20,
    office: "Room 415, CS Building",
  },
  {
    id: "f5",
    name: "Dr. Lisa Thompson",
    email: "l.thompson@university.edu",
    role: "dc_committee",
    status: "active",
    department: "Computer Science",
    specialization: "Cybersecurity",
    courses: 2,
    students: 6,
    office: "Room 420, CS Building",
  },
]

export function getFacultyById(id: string): Faculty | undefined {
  return mockFaculty.find((f) => f.id === id)
}
