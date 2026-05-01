# Academia — Scrum Implementation (Senior Project)

## Selected Topics in Software Engineering | Scrum Methodology

### Submission Sheet (Cover Page)

| Item | Details |
|---|---|
| Product | Academia — academic project management and collaboration platform for universities (multi-tenant) |
| Product website | https://www.academia.et/ |
| Product documentation | https://docs.academia.et/ |
| Repositories | Frontend (this repo): Next.js App Router + React + TypeScript; Backend: academia-backend-api (separate repo) |
| Sprint length | 2 weeks |
| Sprint 1 focus (chosen) | Group Formation + Proposal Flow |
| Prepared on | April 27, 2026 |
| Submission deadline | April 30, 2026 |

### Team (Sprint 1)

| Name | Responsibility |
|---|---|
| Kubsa Melkamu | Project Lead, Backend Developer |
| Keyradin Aman | Frontend Developer, System Design |
| Tofik Ahmad | Backend Developer |
| Mihret Wubshet | Frontend Developer |

---

## Table of Contents

1. System Overview
2. Product Vision & Product Goal
3. Product Backlog (EPIC-Based User Stories) — Maximum 2 Sprints
4. Sprint 1 Planning
Appendix — Story Point Scale

---

## 1) System Overview

Academia is a multi-tenant platform designed to manage **university senior projects end-to-end**. It supports role-based workspaces and the full project lifecycle from **project intake** to **milestones, evaluation, defense, and reporting**.

### Primary user roles (workspaces)

| Role | Key responsibilities |
|---|---|
| Department Head | Invites users, oversees departments, approvals and reports |
| Coordinator | Manages projects, assigns advisors/evaluators, schedules defenses, grade management |
| Advisor | Supervises project groups, feedback, milestone follow-up, evaluation submission |
| Evaluator / Department Committee | Evaluates submissions and participates in defenses |
| Student | Forms a project group, uploads documents, submits milestones (starting with proposal), tracks progress |

### Core modules in this senior project

- **User onboarding** (invitations → accept → first login → forced password change)
- **Group formation** (leader request → create group → invite members / join requests → submit group)
- **Proposal submission** (upload-first PDF proposal draft + submit for review)
- **Coordinator workflows** (review, approvals, advisor assignment)
- **Collaboration** (notifications, messaging; optional video call presence with Jitsi)

---

## 2) Product Vision & Product Goal

### Product Vision

To provide universities with a single, reliable system that makes senior project management **transparent, fair, trackable, and collaborative** for students and faculty—reducing paperwork, improving communication, and increasing on-time milestone completion.

### Product Goal (measurable)

Within one academic term, enable a department to run the **Group Formation + Proposal submission workflow** fully online such that:

- At least **80%** of eligible students can **form/join a group** using the platform, and
- At least **80%** of formed groups can **upload and submit a proposal PDF** for review,
- While maintaining **tenant isolation** and **role-based access control** for all actions.

---

## 3) Product Backlog (EPIC-Based User Stories) — Maximum 2 Sprints

Notes:
- Each user story includes **Priority** and **Story Points** (Fibonacci).
- Each user story includes **2–5 acceptance criteria**.
- Backlog is scoped to what can reasonably fit into **Sprint 1 + Sprint 2**.

### EPIC 1 — Group Leadership & Group Formation

| ID | User story | Priority | Story points | Acceptance criteria (2–5) |
|---|---|---|---:|---|
| US1.1 | As a student, I want to apply to become a group leader so that I can create and manage a project group. | High | 5 | 1) Student can submit a leader request with required info (e.g., reason/summary).<br>2) Student can view request status (Pending / Approved / Rejected).<br>3) Rejected requests show a rejection reason. |
| US1.2 | As a department head, I want to approve or reject group leader requests so that only eligible students can create groups. | High | 5 | 1) Department head can list pending requests with student identity.<br>2) Department head can approve a request and the student becomes “approved leader”.<br>3) Department head can reject a request and must provide a reason. |
| US1.3 | As an approved group leader, I want to create a group with name, objectives, and technologies so that I can start recruiting members and preparing a proposal. | High | 3 | 1) Group leader can create a group with non-empty name/objectives and at least one technology.<br>2) Created group starts in status `DRAFT`.<br>3) Group leader can see group details (leader + members + status). |
| US1.4 | As an approved group leader, I want to invite other students to my group so that we can form a complete project team. | High | 8 | 1) Group leader can search/select an available student and preview the invitation email.<br>2) Group leader can send an invitation and see it recorded as Pending.<br>3) System prevents invalid invites (self-invite, student already in group, wrong department, group full) and shows a clear error.<br>4) Invitation has an expiry time and displays it in preview. |
| US1.5 | As a student, I want to accept or reject a group invitation so that I can join the right team. | High | 5 | 1) Student can open invitation link and choose Accept or Reject.<br>2) On Accept, the student becomes a group member and can access “My Group”.<br>3) On Reject, the student does not join and the system shows a rejection result. |
| US1.6 | As a student, I want to browse available groups and request to join one so that I can join a group even if I’m not invited. | Medium | 5 | 1) Student can view a paginated list of joinable groups.<br>2) Student can submit a join request with a reason.<br>3) Student can cancel a pending join request. |
| US1.7 | As an approved group leader, I want to approve or reject join requests so that I can control who joins my group. | Medium | 5 | 1) Group leader can view pending join requests.<br>2) Approving a request adds the student to the group.<br>3) Rejecting a request records a rejection reason. |

---

### EPIC 2 — Proposal Flow (Milestone 1) — Upload-First

| ID | User story | Priority | Story points | Acceptance criteria (2–5) |
|---|---|---|---:|---|
| US2.1 | As an approved group leader, I want to upload a proposal PDF while creating a draft proposal so that I can complete Proposal Milestone submission efficiently. | High | 8 | 1) User must provide exactly 3 non-empty proposal titles and a description.<br>2) User must upload a PDF file (≤ 5MB) to create the draft.<br>3) System stores the proposal with status `DRAFT` and includes `proposal.pdf` in documents.<br>4) Errors (wrong file type/size, missing fields) are shown clearly. |
| US2.2 | As an approved group leader, I want to submit my proposal draft for review so that the department can approve it and create the real project. | High | 3 | 1) Submit button is enabled only when proposal has `proposal.pdf` uploaded.<br>2) On submit, proposal status changes to “Submitted / Pending Review”.<br>3) If a proposal is rejected, the group leader can re-upload and re-submit. |
| US2.3 | As a coordinator, I want to review submitted proposals and approve or request changes so that proposals move forward to project execution. | Medium | 5 | 1) Coordinator can view a list of submitted proposals.<br>2) Coordinator can approve or request changes with feedback.<br>3) Students can see the updated status and feedback. |

---

### EPIC 3 — Coordinator Project Setup (Sprint 2 scope)

| ID | User story | Priority | Story points | Acceptance criteria (2–5) |
|---|---|---|---:|---|
| US3.1 | As a coordinator, I want a reliable list of approved proposals mapped to real projects so that I can perform advisor assignment without missing `projectId`. | High | 5 | 1) Each assignable card includes a stable `projectId` (no title-matching required).<br>2) If a proposal is approved but project is not created yet, the UI shows “not assignable yet”.<br>3) List loads consistently for the selected department. |
| US3.2 | As a coordinator, I want to assign an advisor to a project so that supervision is established early in the project lifecycle. | High | 5 | 1) Coordinator can select an advisor from an advisor directory for the department.<br>2) Assignment persists via backend and shows confirmation in UI.<br>3) Assigned advisor is visible on the project card/details. |

---

## 4) Sprint 1 Planning

### Sprint 1 timeframe

**May 1, 2026 → May 14, 2026** (2 weeks)

### Sprint Goal (short, measurable)

Deliver an end-to-end MVP where an approved group leader can **form a project group** (create + invite members) and then **upload and submit the proposal PDF (Milestone 1)** for review, with invitation accept/reject working via link.

### Sprint Backlog (selected user stories)

| Selected for Sprint 1 | Story ID | Title |
|---:|---|---|
| 1 | US1.1 | Student requests to become a Group Leader |
| 2 | US1.2 | Department Head reviews and approves/rejects Group Leader requests |
| 3 | US1.3 | Approved Group Leader creates a project group (DRAFT) |
| 4 | US1.4 | Group Leader invites students to join (preview + send) |
| 5 | US1.5 | Invited student accepts or rejects a group invitation |
| 6 | US2.1 | Group Leader uploads proposal PDF and creates proposal draft (upload-first) |
| 7 | US2.2 | Group Leader submits proposal for review |

---

### Sprint 1 Task Breakdown (technical tasks, assignee, hours)

Hours are estimates for Sprint 1 planning (not exact).

| Story | Area | Task | Assigned member | Estimated effort |
|---|---|---|---|---:|
| US1.1 | Backend | Implement/verify `POST /group-leader-requests` and `GET /group-leader-requests/me` | Kubsa | 6h |
| US1.1 | Frontend | Student request form + status UI + error handling | Mihret | 8h |
| US1.1 | QA | Test request submission + status states | Keyradin | 3h |
| US1.2 | Backend | Implement/verify pending list + approve/reject endpoints | Tofik | 8h |
| US1.2 | Frontend | Department head list UI + approve/reject dialog with reason | Keyradin | 10h |
| US1.2 | QA | Role-based access checks + edge cases | Mihret | 3h |
| US1.3 | Backend | Implement/verify `POST /project-groups` and `GET /project-groups/me` | Kubsa | 6h |
| US1.3 | Frontend | Create group modal/form + validation + success refresh | Mihret | 8h |
| US1.3 | QA | Verify required fields + group status shown | Keyradin | 2h |
| US1.4 | Backend | Implement/verify `POST /project-groups/invitations/preview` and `POST /project-groups/invitations` | Tofik | 10h |
| US1.4 | Frontend | Available-students picker + preview modal (HTML iframe) + send action + toasts | Keyradin | 12h |
| US1.4 | QA | Validate error message mapping and group size limit cases | Mihret | 4h |
| US1.5 | Backend | Implement/verify accept/reject UI links (token-based) + result redirect parameters | Kubsa | 8h |
| US1.5 | Frontend | Result page rendering (accepted/rejected/error) + navigation links | Mihret | 4h |
| US1.5 | QA | Test expired token and invalid token flows | Keyradin | 2h |
| US2.1 | Backend | Implement/verify `POST /projects/proposals/with-proposal-pdf` (multipart) | Tofik | 12h |
| US2.1 | Frontend | Proposal mode in upload page (3 titles + description + pdf validation) | Mihret | 12h |
| US2.1 | QA | File-size/type validations + retry behavior | Keyradin | 3h |
| US2.2 | Backend | Implement/verify `POST /projects/proposals/:id/submit` rules | Kubsa | 6h |
| US2.2 | Frontend | Submit button enable/disable rules + status feedback | Keyradin | 6h |
| US2.2 | QA | Confirm submit blocked without `proposal.pdf` | Mihret | 2h |

---

### Sprint 1 total planned effort (hours)

| Team member | Planned hours |
|---|---:|
| Kubsa | ~26h |
| Keyradin | ~33h |
| Tofik | ~42h |
| Mihret | ~41h |
| **Team total** | **~142h** |

---

## Appendix — Story Point scale used

- 1 = very small / simple UI or endpoint
- 3 = small feature with validation
- 5 = medium feature with multiple states and RBAC
- 8 = larger feature with multiple steps + integration + edge cases
