import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Calendar,
  Clock,
  LayoutDashboard,
} from "lucide-react"

export type AdvisorEvaluatorView = "dashboard" | "pending" | "scheduled"

/** Keys for hub quick links (sidebar + dashboard tiles); section switcher uses {@link AdvisorEvaluatorView} only. */
export type AdvisorEvaluatorHubKey =
  | AdvisorEvaluatorView
  | "rubric"

export type AdvisorEvaluatorNavItem = {
  key: AdvisorEvaluatorHubKey
  title: string
  href: string
  description: string
  icon: LucideIcon
}

export const ADVISOR_EVALUATOR_LINKS: AdvisorEvaluatorNavItem[] = [
  {
    key: "dashboard",
    title: "Dashboard",
    href: "/dashboard/advisor/evaluator",
    description: "Overview of your evaluator workload",
    icon: LayoutDashboard,
  },
  {
    key: "pending",
    title: "Pending evaluations",
    href: "/dashboard/advisor/evaluator/pending",
    description: "Submissions awaiting your review",
    icon: Clock,
  },
  {
    key: "scheduled",
    title: "Scheduled sessions",
    href: "/dashboard/advisor/evaluator/scheduled",
    description: "Upcoming evaluation meetings",
    icon: Calendar,
  },
  {
    key: "rubric",
    title: "Rubric",
    href: "/dashboard/advisor/evaluator/rubric",
    description: "Scoring criteria reference",
    icon: BookOpen,
  },
]

/** Rubric cap for the advisor evaluator workspace; criterion {@link EVALUATION_CRITERIA} maxPercent values sum to this. */
export const RUBRIC_TOTAL_MAX_PERCENT = 100

export const EVALUATION_CRITERIA = [
  { id: "technical", label: "Technical implementation", description: "Code quality, algorithms, and technical soundness", maxPercent: 9 },
  { id: "code_quality", label: "Code quality", description: "Structure, readability, and best practices", maxPercent: 9 },
  { id: "functionality", label: "Functionality", description: "Features implemented and working correctly", maxPercent: 9 },
  { id: "documentation", label: "Documentation", description: "Completeness and clarity", maxPercent: 6 },
  { id: "innovation", label: "Innovation", description: "Creativity and novel approaches", maxPercent: 6 },
  { id: "ui_ux", label: "UI / UX", description: "Design, usability, and experience", maxPercent: 8 },
  { id: "testing", label: "Testing", description: "Coverage and quality assurance", maxPercent: 6 },
  { id: "performance", label: "Performance", description: "Efficiency and optimization", maxPercent: 6 },
  { id: "security", label: "Security", description: "Measures and data protection", maxPercent: 8 },
  { id: "scalability", label: "Scalability", description: "Growth and load handling", maxPercent: 5 },
  { id: "presentation", label: "Presentation", description: "Demo and communication quality", maxPercent: 8 },
  { id: "project_management", label: "Project management", description: "Planning and timeline", maxPercent: 6 },
  { id: "collaboration", label: "Collaboration", description: "Teamwork and communication", maxPercent: 6 },
  { id: "impact", label: "Overall impact", description: "Value and outcomes of the project", maxPercent: 8 },
] as const

export type EvaluationCriterion = (typeof EVALUATION_CRITERIA)[number]

export type RubricLineItem = {
  key: string
  label: string
  weightPercent: number
  points: readonly string[]
  /** Extra checklist blocks shown under the main points (e.g. “Specific checks”). */
  supplements?: readonly { title: string; items: readonly string[] }[]
  /** Two-column reference table (e.g. score ↔ description). */
  referenceTable?: {
    columns: readonly [string, string]
    rows: readonly { left: string; right: string }[]
  }
}

export type RubricDefinition = {
  id: string
  title: string
  totalMaxPercent: number
  criteria: readonly RubricLineItem[]
  /** When true, hides the percentage rollup (penalty / reference-only sheet). */
  referenceOnly?: boolean
  /** Issue ↔ penalty reference table shown below criteria (or alone if criteria empty). */
  penaltyTable?: {
    columns: readonly [string, string]
    rows: readonly { left: string; right: string }[]
  }
}

export const CAPSTONE_I_RUBRICS: readonly RubricDefinition[] = [
  {
    id: "proposal",
    title: "Project Proposal Evaluation Rubric",
    totalMaxPercent: 100,
    criteria: [
      {
        key: "A",
        label: "Problem Identification",
        weightPercent: 10,
        points: [
          "Clarity of the problem statement",
          "Real-world relevance",
          "Evidence of the problem existence",
          "Scope definition",
          "Target users clearly identified",
        ],
      },
      {
        key: "B",
        label: "Project Objectives",
        weightPercent: 10,
        points: [
          "Objectives are clear and measurable",
          "Objectives align with the problem",
          "Feasibility of objectives",
          "SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound)",
        ],
      },
      {
        key: "C",
        label: "Literature Review / Background Study",
        weightPercent: 10,
        points: [
          "Related works reviewed",
          "Proper comparison with existing systems",
          "Identification of research gap",
          "Use of credible references",
          "Proper citation style",
        ],
      },
      {
        key: "D",
        label: "Proposed Solution",
        weightPercent: 15,
        points: [
          "Innovation and originality",
          "Technical feasibility",
          "Completeness of proposed solution",
          "Suitability of technologies/tools",
          "Functional overview provided",
        ],
      },
      {
        key: "E",
        label: "Methodology",
        weightPercent: 10,
        points: [
          "Development methodology explained",
          "Data collection methods identified",
          "Tools and technologies specified",
          "Implementation approach clear",
          "Testing strategy mentioned",
        ],
      },
      {
        key: "F",
        label: "Scope and Limitation",
        weightPercent: 5,
        points: [
          "Scope clearly defined",
          "Project boundaries stated",
          "Assumptions identified",
          "Constraints mentioned",
        ],
      },
      {
        key: "G",
        label: "Work Plan / Schedule",
        weightPercent: 10,
        points: [
          "Gantt chart or timeline included",
          "Task distribution clear",
          "Milestones identified",
          "Realistic schedule",
        ],
      },
      {
        key: "H",
        label: "Budget and Resources",
        weightPercent: 5,
        points: [
          "Hardware/software requirements listed",
          "Budget estimation reasonable",
          "Resource availability considered",
        ],
      },
      {
        key: "I",
        label: "Documentation Quality",
        weightPercent: 10,
        points: [
          "Formatting consistency",
          "Grammar and spelling",
          "Professional writing style",
          "Proper organization",
          "Use of diagrams/tables where necessary",
        ],
      },
      {
        key: "J",
        label: "Presentation and Defense",
        weightPercent: 15,
        points: [
          "Clarity of oral presentation",
          "Understanding of project",
          "Ability to answer questions",
          "Confidence and communication skills",
          "Quality of presentation slides",
        ],
      },
    ],
  },
  {
    id: "srs",
    title: "Software Requirements Specification (SRS) Evaluation Rubric",
    totalMaxPercent: 100,
    criteria: [
      {
        key: "A",
        label: "Introduction Section",
        weightPercent: 10,
        points: [
          "Purpose clearly stated",
          "Scope clearly defined",
          "Definitions/acronyms included",
          "Intended audience identified",
          "References provided",
        ],
      },
      {
        key: "B",
        label: "Overall Description",
        weightPercent: 10,
        points: [
          "Product perspective explained",
          "Product functions summarized",
          "User characteristics identified",
          "Constraints documented",
          "Assumptions and dependencies included",
        ],
      },
      {
        key: "C",
        label: "Functional Requirements",
        weightPercent: 25,
        points: [
          "Requirements are complete",
          "Requirements are clear and unambiguous",
          "Use cases properly defined",
          "Inputs, outputs, and processes specified",
          "Traceability maintained",
        ],
      },
      {
        key: "D",
        label: "Non-Functional Requirements",
        weightPercent: 15,
        points: [
          "Performance requirements",
          "Security requirements",
          "Reliability requirements",
          "Usability requirements",
          "Scalability and maintainability",
        ],
      },
      {
        key: "E",
        label: "Use Case Modeling",
        weightPercent: 10,
        points: [
          "Use case diagrams included",
          "Actors correctly identified",
          "Use case descriptions complete",
          "Relationships properly modeled",
        ],
      },
      {
        key: "F",
        label: "Data Requirements",
        weightPercent: 5,
        points: [
          "Data dictionary included",
          "Database requirements specified",
          "Data validation rules identified",
        ],
      },
      {
        key: "G",
        label: "Interface Requirements",
        weightPercent: 5,
        points: [
          "User interface requirements",
          "Hardware interfaces",
          "Software interfaces",
          "Communication interfaces",
        ],
      },
      {
        key: "H",
        label: "Requirement Quality Attributes",
        weightPercent: 10,
        points: [
          "Correctness",
          "Consistency",
          "Completeness",
          "Verifiability",
          "Feasibility",
        ],
      },
      {
        key: "I",
        label: "Documentation Quality",
        weightPercent: 10,
        points: [
          "Formatting and organization",
          "Proper numbering",
          "Grammar and clarity",
          "IEEE standard compliance",
          "Proper referencing",
        ],
      },
    ],
  },
  {
    id: "sdd",
    title: "Software Design Document (SDD) Evaluation Rubric",
    totalMaxPercent: 100,
    criteria: [
      {
        key: "A",
        label: "System Architecture Design",
        weightPercent: 20,
        points: [
          "Architecture clearly described",
          "Appropriate architectural pattern used",
          "Modular design demonstrated",
          "Components well organized",
          "Scalability considered",
        ],
      },
      {
        key: "B",
        label: "UML and Design Diagrams",
        weightPercent: 20,
        points: [
          "Class diagrams",
          "Sequence diagrams",
          "Activity diagrams",
          "ER diagrams",
          "Deployment diagrams",
          "Correctness",
          "Completeness",
          "Consistency",
          "Readability",
        ],
      },
      {
        key: "C",
        label: "Database Design",
        weightPercent: 10,
        points: [
          "Database schema quality",
          "Normalization applied",
          "Relationships correctly defined",
          "Constraints specified",
          "Data integrity maintained",
        ],
      },
      {
        key: "D",
        label: "User Interface Design",
        weightPercent: 10,
        points: [
          "Wireframes/mockups included",
          "Navigation structure clear",
          "Consistency of UI design",
          "User-friendliness",
          "Accessibility considerations",
        ],
      },
      {
        key: "E",
        label: "Component Design",
        weightPercent: 10,
        points: [
          "Modules clearly defined",
          "Responsibilities assigned",
          "Interfaces specified",
          "Reusability considered",
        ],
      },
      {
        key: "F",
        label: "Algorithm and Logic Design",
        weightPercent: 10,
        points: [
          "Algorithms explained",
          "Pseudocode/flowcharts included",
          "Efficiency considerations",
          "Error handling strategy",
        ],
      },
      {
        key: "G",
        label: "Security and Performance Design",
        weightPercent: 5,
        points: [
          "Authentication/authorization design",
          "Data protection mechanisms",
          "Performance optimization strategy",
          "Backup and recovery considerations",
        ],
      },
      {
        key: "H",
        label: "Testing Design",
        weightPercent: 5,
        points: [
          "Test strategy included",
          "Unit testing plan",
          "Integration testing plan",
          "Test cases outlined",
        ],
      },
      {
        key: "I",
        label: "Maintainability and Scalability",
        weightPercent: 5,
        points: [
          "Maintainable structure",
          "Future enhancement support",
          "Flexibility of design",
        ],
      },
      {
        key: "J",
        label: "Documentation Quality",
        weightPercent: 5,
        points: [
          "Formatting and consistency",
          "Professional presentation",
          "Proper labeling of diagrams",
          "Clarity of explanations",
        ],
      },
    ],
  },
] as const

/**
 * Capstone II — consolidated implementation weights sum to 100% across twelve categories (A–L).
 * (Your original doc listed functionality at 25% alongside other rows that already summed above 100%;
 * this grid matches the “100-mark” intent while keeping every category you listed.)
 */
export const CAPSTONE_II_RUBRICS: readonly RubricDefinition[] = [
  {
    id: "implementation",
    title: "Implementation evaluation rubric (100 marks)",
    totalMaxPercent: 100,
    criteria: [
      {
        key: "A",
        label: "System Functionality",
        weightPercent: 15,
        points: [
          "All core features implemented",
          "Functional requirements satisfied",
          "System behaves according to SRS",
          "User workflows completed successfully",
          "Business logic correctly implemented",
          "Error handling implemented properly",
          "Input validation performed",
          "Feature completeness",
        ],
        referenceTable: {
          columns: ["Score", "Description"],
          rows: [
            { left: "Excellent", right: "All functionalities fully implemented and working correctly" },
            { left: "Good", right: "Most functionalities implemented with minor issues" },
            { left: "Fair", right: "Partial implementation with noticeable missing features" },
            { left: "Poor", right: "Major functionalities missing or non-functional" },
          ],
        },
      },
      {
        key: "B",
        label: "Code Quality and Standards",
        weightPercent: 15,
        points: [
          "Clean and readable code",
          "Proper naming conventions",
          "Modular programming practices",
          "Reusability of components",
          "Proper comments/documentation",
          "Consistent coding standards",
          "Low code duplication",
          "Proper file/folder organization",
        ],
        supplements: [
          {
            title: "Specific checks",
            items: [
              "Function decomposition",
              "Object-oriented principles",
              "Separation of concerns",
              "Maintainability",
              "Scalability",
            ],
          },
        ],
      },
      {
        key: "C",
        label: "Database Implementation",
        weightPercent: 10,
        points: [
          "Database correctly implemented",
          "Tables normalized",
          "Relationships correctly defined",
          "CRUD operations functional",
          "Constraints properly applied",
          "Query optimization",
          "Data consistency maintained",
          "Backup/recovery consideration",
        ],
      },
      {
        key: "D",
        label: "User Interface and User Experience (UI/UX)",
        weightPercent: 10,
        points: [
          "Interface attractiveness",
          "Ease of navigation",
          "Responsive design",
          "Consistency of layouts",
          "Accessibility considerations",
          "User-friendly interactions",
          "Proper feedback/error messages",
          "Cross-platform compatibility",
        ],
      },
      {
        key: "E",
        label: "System Integration",
        weightPercent: 5,
        points: [
          "Frontend and backend integration",
          "Database integration",
          "API integration",
          "Third-party service integration",
          "Smooth communication between modules",
        ],
      },
      {
        key: "F",
        label: "Security Implementation",
        weightPercent: 10,
        points: [
          "Authentication implemented",
          "Authorization and role management",
          "Password security",
          "Input sanitization",
          "Protection against common attacks",
          "Secure session management",
          "Data encryption where necessary",
        ],
        supplements: [
          {
            title: "Security checks",
            items: [
              "SQL Injection prevention",
              "XSS prevention",
              "CSRF protection",
              "Secure API usage",
              "Access control",
            ],
          },
        ],
      },
      {
        key: "G",
        label: "Performance and Efficiency",
        weightPercent: 5,
        points: [
          "Fast response time",
          "Efficient resource usage",
          "Optimized database queries",
          "Efficient algorithms",
          "Scalability considerations",
          "Load handling capability",
        ],
      },
      {
        key: "H",
        label: "Testing and Debugging",
        weightPercent: 10,
        points: [
          "Unit testing performed",
          "Integration testing performed",
          "System testing conducted",
          "Bugs identified and fixed",
          "Test cases documented",
          "Error logs maintained",
          "User acceptance testing evidence",
        ],
        supplements: [
          {
            title: "Testing artifacts",
            items: ["Test plan", "Test cases", "Bug reports", "Testing results"],
          },
        ],
      },
      {
        key: "I",
        label: "Version Control and Collaboration",
        weightPercent: 5,
        points: [
          "Proper Git/GitHub usage",
          "Meaningful commit history",
          "Branch management",
          "Collaboration evidence",
          "Contribution balance among members",
        ],
        supplements: [
          {
            title: "Recommended tools",
            items: ["GitHub", "GitLab", "Bitbucket"],
          },
        ],
      },
      {
        key: "J",
        label: "Deployment and Configuration",
        weightPercent: 5,
        points: [
          "Successful deployment",
          "Hosting configuration",
          "Environment setup documentation",
          "Installation guide provided",
          "Deployment automation",
          "Application accessibility",
        ],
        supplements: [
          {
            title: "Deployment examples",
            items: ["Cloud hosting", "Local server deployment", "Docker containerization", "CI/CD pipeline setup"],
          },
        ],
      },
      {
        key: "K",
        label: "Documentation of Implementation",
        weightPercent: 5,
        points: [
          "Installation manual",
          "User manual",
          "API documentation",
          "Developer documentation",
          "Configuration instructions",
          "README quality",
        ],
      },
      {
        key: "L",
        label: "Innovation and Technical Complexity",
        weightPercent: 5,
        points: [
          "Creativity of solution",
          "Advanced features implemented",
          "Technical difficulty level",
          "Use of modern technologies",
          "Problem-solving capability",
        ],
      },
    ],
  },
  {
    id: "demonstration",
    title: "Practical demonstration evaluation rubric",
    totalMaxPercent: 100,
    criteria: [
      {
        key: "A",
        label: "System Demonstration",
        weightPercent: 40,
        points: [
          "Features demonstrated successfully",
          "Workflow execution",
          "Real-time functionality",
          "Stability during demo",
        ],
      },
      {
        key: "B",
        label: "Technical Understanding",
        weightPercent: 25,
        points: [
          "Understanding of implementation",
          "Ability to explain architecture",
          "Ability to explain algorithms",
          "Understanding of technologies used",
        ],
      },
      {
        key: "C",
        label: "Problem Solving",
        weightPercent: 15,
        points: [
          "Ability to troubleshoot issues",
          "Handling unexpected questions",
          "Debugging capability",
        ],
      },
      {
        key: "D",
        label: "Communication Skills",
        weightPercent: 10,
        points: [
          "Clarity of explanation",
          "Professional presentation",
          "Team coordination",
        ],
      },
      {
        key: "E",
        label: "Time Management",
        weightPercent: 10,
        points: [
          "Demo completed within allocated time",
          "Proper sequencing of presentation",
        ],
      },
    ],
  },
  {
    id: "penalties",
    title: "Common penalties (reference)",
    totalMaxPercent: 100,
    referenceOnly: true,
    criteria: [],
    penaltyTable: {
      columns: ["Issue", "Penalty example"],
      rows: [
        { left: "Plagiarized code", right: "Automatic failure or heavy deduction" },
        { left: "Non-working system", right: "Major deduction" },
        { left: "Missing documentation", right: "Deduction" },
        { left: "Poor UI", right: "Deduction" },
        { left: "No testing evidence", right: "Deduction" },
        { left: "No Git/version control", right: "Deduction" },
        { left: "Late submission", right: "Penalty per day" },
      ],
    },
  },
] as const
