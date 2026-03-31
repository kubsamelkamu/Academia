# Student Milestone 1 (Proposal) — Upload-First Integration (Option B)

This document describes how **Academia (frontend)** integrates the backend **upload-first proposal** flow for **Milestone 1: Project Proposal**.

## Goal

Allow an **approved student group leader** to:

1. Create a proposal **draft + upload PDF** in a single request.
2. Submit the created proposal for review.

Backend contract: a proposal cannot be submitted unless `documents[]` includes `key === "proposal.pdf"`.

## Where this is implemented

- UI entry point:
  - Dashboard → Student → Milestones → click **Submit** on the Proposal milestone.
  - This navigates to `.../dashboard/student/upload-documents?milestone=Project%20Proposal`.

- Proposal upload + submit UI:
  - Implemented inside the existing Student Upload page:
    - `src/components/dashboard/student/upload-documents-page.tsx`
  - When the milestone is recognized as **proposal**, the page switches to the proposal upload-first flow.

## API integration

All upstream calls go through the shared Axios client so tenant + auth headers are injected automatically.

- Axios client:
  - `src/lib/api/client.ts`

### Step 1 — Create draft + upload PDF (single request)

- Endpoint: `POST /projects/proposals/with-proposal-pdf`
- Content type: `multipart/form-data`
- Fields:
  - `titles` (repeated exactly 3 times)
  - `description` (optional)
  - `proposalPdf` (required, PDF, <= 5MB)

Frontend API wrapper:
- `src/lib/api/project-proposals.ts` → `createProposalWithProposalPdf()`

Hook:
- `src/lib/hooks/use-project-proposals.ts` → `useCreateProposalWithPdf()`

### Step 2 — Submit proposal

- Endpoint: `POST /projects/proposals/:id/submit`

Frontend API wrapper:
- `src/lib/api/project-proposals.ts` → `submitProposalForReview()`

Hook:
- `src/lib/hooks/use-project-proposals.ts` → `useSubmitProposalForReview()`

## UI behavior (proposal mode)

The proposal upload-first UI shows:

- 3 Title inputs (required, unique)
- Description textarea (required)
- PDF input (required, `application/pdf`, max 5MB)
- Actions:
  - **Upload Proposal**: creates DRAFT + uploads PDF
  - **Submit for Review**: enabled only when:
    - a proposal draft exists
    - status is `DRAFT` or `REJECTED`
    - `documents[]` contains `key === "proposal.pdf"`

Frontend state stored in the page:
- `proposal.id`
- `proposal.status`
- `proposal.documents[]` (checks for `proposal.pdf`)

## Notes / Next improvements (optional)

If you want to make the experience resilient across refreshes, we can add:

- A “Get my latest proposal draft” query (requires a backend read endpoint or list endpoint).
- Persisting `proposalId` in the URL (search param) or session storage.
- Integrating non-proposal milestones to real upload endpoints (currently other milestone uploads are demo-only).
