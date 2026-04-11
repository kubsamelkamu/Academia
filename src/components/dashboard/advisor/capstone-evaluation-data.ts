export type CapstoneStage = "Capstone I" | "Capstone II"

export type EvaluationStatus = "Pending Review" | "Evaluated" | "Needs Revision"

export type CapstoneCriterion = {
  title: string
  description: string
  maxScore: number
}

export type CapstoneStudent = {
  id: string
  name: string
  studentId: string
  capstone1Status: EvaluationStatus
  capstone2Status: EvaluationStatus
  progress: number
  capstone1Score?: number
  capstone2Score?: number
  submittedDate: string
}

export type CapstoneMilestone = {
  id: string
  title: string
  status: "completed" | "in_progress" | "pending"
  progress: number
}

export type CapstoneGroup = {
  id: string
  groupName: string
  projectTitle: string
  stage: CapstoneStage
  progress: number
  pending: number
  evaluated: number
  dueLabel: string
  criteria: CapstoneCriterion[]
  students: CapstoneStudent[]
  milestones: CapstoneMilestone[]
}

export const CAPSTONE_GROUPS: CapstoneGroup[] = [
  {
    id: "grp-1",
    groupName: "AI Research Group",
    projectTitle: "Machine Learning applied to Smart Grids",
    stage: "Capstone I",
    progress: 74,
    pending: 2,
    evaluated: 1,
    dueLabel: "Due May 17",
    criteria: [
      { title: "Problem statement", description: "Clear articulation of the research problem.", maxScore: 10 },
      { title: "Proposal quality", description: "Scope, structure, and feasibility of the proposal.", maxScore: 10 },
      { title: "Methodology", description: "Planning, technical approach, and method selection.", maxScore: 10 },
      { title: "SDD readiness", description: "Design document readiness for first-semester approval.", maxScore: 10 },
    ],
    students: [
      { id: "stu-1", name: "Alex Mercer", studentId: "STU-2024-001", capstone1Status: "Pending Review", capstone2Status: "Pending Review", progress: 72, submittedDate: "2024-05-10" },
      { id: "stu-2", name: "Maria Garcia", studentId: "STU-2024-002", capstone1Status: "Evaluated", capstone2Status: "Pending Review", progress: 88, capstone1Score: 36, submittedDate: "2024-05-09" },
      { id: "stu-3", name: "Liam Johnson", studentId: "STU-2024-003", capstone1Status: "Pending Review", capstone2Status: "Pending Review", progress: 67, submittedDate: "2024-05-10" },
    ],
    milestones: [
      { id: "m1", title: "Proposal and problem definition", status: "completed", progress: 100 },
      { id: "m2", title: "SDD and architecture review", status: "in_progress", progress: 74 },
      { id: "m3", title: "Advisor final evaluation", status: "pending", progress: 20 },
    ],
  },
  {
    id: "grp-2",
    groupName: "Blockchain Team",
    projectTitle: "Blockchain for Supply Chain Transparency",
    stage: "Capstone II",
    progress: 96,
    pending: 0,
    evaluated: 3,
    dueLabel: "Published",
    criteria: [
      { title: "Implementation completeness", description: "Completeness of the system implementation.", maxScore: 10 },
      { title: "Testing evidence", description: "Verification, validation, and test coverage quality.", maxScore: 10 },
      { title: "Final results", description: "Measured outcomes, discussion, and conclusion quality.", maxScore: 10 },
      { title: "Defense readiness", description: "Preparedness for final defense presentation.", maxScore: 10 },
    ],
    students: [
      { id: "stu-4", name: "Sophia Chen", studentId: "STU-2024-004", capstone1Status: "Evaluated", capstone2Status: "Evaluated", progress: 95, capstone1Score: 37, capstone2Score: 38, submittedDate: "2024-05-08" },
      { id: "stu-5", name: "James Wilson", studentId: "STU-2024-005", capstone1Status: "Evaluated", capstone2Status: "Evaluated", progress: 92, capstone1Score: 34, capstone2Score: 35, submittedDate: "2024-05-08" },
      { id: "stu-6", name: "Noah Davis", studentId: "STU-2024-006", capstone1Status: "Evaluated", capstone2Status: "Evaluated", progress: 90, capstone1Score: 33, capstone2Score: 34, submittedDate: "2024-05-08" },
    ],
    milestones: [
      { id: "m1", title: "Implementation checkpoint", status: "completed", progress: 100 },
      { id: "m2", title: "Testing and validation", status: "completed", progress: 100 },
      { id: "m3", title: "Advisor final evaluation", status: "completed", progress: 100 },
    ],
  },
  {
    id: "grp-3",
    groupName: "IoT Builders",
    projectTitle: "IoT Home Automation Prototype",
    stage: "Capstone I",
    progress: 61,
    pending: 2,
    evaluated: 1,
    dueLabel: "Due May 19",
    criteria: [
      { title: "Scope definition", description: "Well-defined scope and problem boundaries.", maxScore: 10 },
      { title: "Architecture design", description: "System architecture and component planning.", maxScore: 10 },
      { title: "Feasibility", description: "Technical and timeline feasibility assessment.", maxScore: 10 },
      { title: "Advisor readiness", description: "Readiness for first-semester approval.", maxScore: 10 },
    ],
    students: [
      { id: "stu-7", name: "Olivia White", studentId: "STU-2024-007", capstone1Status: "Needs Revision", capstone2Status: "Pending Review", progress: 55, submittedDate: "2024-05-12" },
      { id: "stu-8", name: "Ethan Brown", studentId: "STU-2024-008", capstone1Status: "Pending Review", capstone2Status: "Pending Review", progress: 60, submittedDate: "2024-05-12" },
      { id: "stu-9", name: "Ava Clark", studentId: "STU-2024-009", capstone1Status: "Pending Review", capstone2Status: "Pending Review", progress: 58, submittedDate: "2024-05-12" },
      { id: "stu-10", name: "Mason Hall", studentId: "STU-2024-010", capstone1Status: "Evaluated", capstone2Status: "Pending Review", progress: 82, capstone1Score: 30, submittedDate: "2024-05-11" },
    ],
    milestones: [
      { id: "m1", title: "Proposal and scope alignment", status: "completed", progress: 100 },
      { id: "m2", title: "Technical architecture", status: "in_progress", progress: 62 },
      { id: "m3", title: "Advisor final evaluation", status: "pending", progress: 35 },
    ],
  },
  {
    id: "grp-4",
    groupName: "Cloud Scale Team",
    projectTitle: "Cloud-native Microservices Architecture",
    stage: "Capstone II",
    progress: 67,
    pending: 2,
    evaluated: 0,
    dueLabel: "Due May 22",
    criteria: [
      { title: "Deployment quality", description: "Reliable deployment and system integration.", maxScore: 10 },
      { title: "System tests", description: "Test coverage and evidence of validation.", maxScore: 10 },
      { title: "Performance results", description: "Benchmarking and final outcome quality.", maxScore: 10 },
      { title: "Final documentation", description: "Clear final documentation and defense prep.", maxScore: 10 },
    ],
    students: [
      { id: "stu-11", name: "Emma Walker", studentId: "STU-2024-011", capstone1Status: "Evaluated", capstone2Status: "Pending Review", progress: 65, capstone1Score: 32, submittedDate: "2024-05-15" },
      { id: "stu-12", name: "Logan Young", studentId: "STU-2024-012", capstone1Status: "Pending Review", capstone2Status: "Pending Review", progress: 63, submittedDate: "2024-05-15" },
    ],
    milestones: [
      { id: "m1", title: "Implementation planning", status: "completed", progress: 100 },
      { id: "m2", title: "System implementation", status: "in_progress", progress: 68 },
      { id: "m3", title: "Advisor final evaluation", status: "pending", progress: 25 },
    ],
  },
]

export function getStageGroups(stage: CapstoneStage) {
  return CAPSTONE_GROUPS.filter((group) => group.stage === stage)
}

export function getGroupById(id: string) {
  return CAPSTONE_GROUPS.find((group) => group.id === id) ?? null
}
