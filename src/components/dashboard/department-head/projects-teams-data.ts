export interface TeamGroup {
  id: string
  groupName: string
  projectTitle: string
  managerName: string
  advisorName: string
  semester: string
  status: "active" | "submitted" | "on-hold"
  members: string[]
  lastActivity: string
}

export const mockTeams: TeamGroup[] = [
  {
    id: "team-alpha",
    groupName: "Group Alpha",
    projectTitle: "AI-Powered Student Assistant",
    managerName: "John Doe",
    advisorName: "Dr. Sarah Johnson",
    semester: "Spring 2024",
    status: "active",
    members: ["John Doe", "Jane Smith", "Bob Wilson"],
    lastActivity: "2024-03-15",
  },
  {
    id: "team-beta",
    groupName: "Group Beta",
    projectTitle: "Blockchain-Based Voting System",
    managerName: "Alice Brown",
    advisorName: "Prof. Michael Chen",
    semester: "Spring 2024",
    status: "submitted",
    members: ["Alice Brown", "Charlie Davis"],
    lastActivity: "2024-03-14",
  },
  {
    id: "team-gamma",
    groupName: "Group Gamma",
    projectTitle: "Smart Campus IoT Platform",
    managerName: "Eva Green",
    advisorName: "Dr. Emily Rodriguez",
    semester: "Spring 2024",
    status: "active",
    members: ["Eva Green", "Frank White", "Grace Lee"],
    lastActivity: "2024-03-16",
  },
  {
    id: "team-delta",
    groupName: "Group Delta",
    projectTitle: "Virtual Reality Lab Simulator",
    managerName: "Henry Ford",
    advisorName: "Prof. David Kim",
    semester: "Spring 2024",
    status: "on-hold",
    members: ["Henry Ford", "Ivy Chen"],
    lastActivity: "2024-03-10",
  },
]

