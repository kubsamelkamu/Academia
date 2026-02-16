export const overviewStats = {
  totalProjects: 24,
  totalAdvisors: 8,
  totalCoordinators: 3,
  totalStudents: 120,
  totalDefenses: 6,
};

export const coordinators = [
  {
    id: 'c1',
    name: 'Dr. Selamawit T.',
    email: 'selamawit@university.edu',
    department: 'Computer Science',
    assignedProjects: 5,
  },
  {
    id: 'c2',
    name: 'Dr. Dawit M.',
    email: 'dawit@university.edu',
    department: 'Information Systems',
    assignedProjects: 3,
  },
];

export const advisors = [
  {
    id: 'a1',
    name: 'Prof. Abebe K.',
    email: 'abebe@university.edu',
    department: 'Computer Science',
    students: 12,
  },
  {
    id: 'a2',
    name: 'Prof. Hana G.',
    email: 'hana@university.edu',
    department: 'Information Systems',
    students: 8,
  },
];

export const projects = [
  {
    id: 'p1',
    title: 'AI for Education',
    status: 'in-progress',
    coordinator: 'c1',
    advisor: 'a1',
    students: ['s1', 's2'],
  },
  {
    id: 'p2',
    title: 'Blockchain Voting',
    status: 'completed',
    coordinator: 'c2',
    advisor: 'a2',
    students: ['s3'],
  },
];

export const defenses = [
  {
    id: 'd1',
    project: 'AI for Education',
    date: '2026-03-10',
    status: 'upcoming',
    committee: ['Prof. Abebe K.', 'Prof. Hana G.'],
  },
  {
    id: 'd2',
    project: 'Blockchain Voting',
    date: '2026-01-20',
    status: 'completed',
    committee: ['Prof. Hana G.'],
  },
];

export const notifications = [
  {
    id: 'n1',
    message: 'New project submitted for review.',
    date: '2026-02-14',
    type: 'alert',
    read: false,
  },
  {
    id: 'n2',
    message: 'Defense scheduled for AI for Education.',
    date: '2026-02-13',
    type: 'reminder',
    read: true,
  },
];

export const departmentSettings = {
  name: 'Computer Science',
  head: 'Dr. Selamawit T.',
  email: 'selamawit@university.edu',
  roles: ['Head', 'Coordinator', 'Advisor'],
};
