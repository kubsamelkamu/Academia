export interface TimelineAlert {
  id: string
  title: string
  message: string
  severity: 'low' | 'high' | 'critical'
  isRead: boolean
  projectId?: string
  createdAt: string
}

export interface ProjectTimeline {
  projectId: string
  milestones: {
    id: string
    title: string
    dueDate: string
    status: 'completed' | 'in_progress' | 'overdue' | 'upcoming'
    progress: number
  }[]
  overallProgress: number
  daysRemaining: number
  status: 'on_track' | 'at_risk' | 'overdue'
}

export const mockTimelineAlerts: TimelineAlert[] = [
  {
    id: 'a1',
    title: 'Milestone Due Soon',
    message: 'Project proposal milestone due in 2 days',
    severity: 'high',
    isRead: false,
    projectId: 'p1',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'a2',
    title: 'Overdue Submission',
    message: 'Final report submission is 3 days overdue',
    severity: 'critical',
    isRead: false,
    projectId: 'p2',
    createdAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 'a3',
    title: 'Evaluation Pending',
    message: 'Midterm evaluation needs advisor review',
    severity: 'high',
    isRead: true,
    projectId: 'p3',
    createdAt: '2024-01-13T14:00:00Z',
  },
]

export const mockProjectTimelines: ProjectTimeline[] = [
  {
    projectId: 'p1',
    milestones: [
      { id: 'm1', title: 'Project Proposal', dueDate: '2024-01-20', status: 'in_progress', progress: 80 },
      { id: 'm2', title: 'Literature Review', dueDate: '2024-02-01', status: 'upcoming', progress: 0 },
      { id: 'm3', title: 'Implementation', dueDate: '2024-03-01', status: 'upcoming', progress: 0 },
    ],
    overallProgress: 25,
    daysRemaining: 15,
    status: 'on_track',
  },
  {
    projectId: 'p2',
    milestones: [
      { id: 'm4', title: 'Requirements Analysis', dueDate: '2024-01-10', status: 'completed', progress: 100 },
      { id: 'm5', title: 'Design Phase', dueDate: '2024-01-25', status: 'in_progress', progress: 60 },
      { id: 'm6', title: 'Testing', dueDate: '2024-02-10', status: 'upcoming', progress: 0 },
    ],
    overallProgress: 45,
    daysRemaining: 10,
    status: 'at_risk',
  },
  {
    projectId: 'p3',
    milestones: [
      { id: 'm7', title: 'Initial Setup', dueDate: '2024-01-05', status: 'completed', progress: 100 },
      { id: 'm8', title: 'Development', dueDate: '2024-01-30', status: 'in_progress', progress: 70 },
      { id: 'm9', title: 'Documentation', dueDate: '2024-02-15', status: 'upcoming', progress: 0 },
    ],
    overallProgress: 55,
    daysRemaining: 5,
    status: 'on_track',
  },
  {
    projectId: 'p4',
    milestones: [
      { id: 'm10', title: 'Planning', dueDate: '2024-01-08', status: 'completed', progress: 100 },
      { id: 'm11', title: 'Execution', dueDate: '2024-01-18', status: 'overdue', progress: 40 },
      { id: 'm12', title: 'Review', dueDate: '2024-02-01', status: 'upcoming', progress: 0 },
    ],
    overallProgress: 35,
    daysRemaining: -3,
    status: 'overdue',
  },
]