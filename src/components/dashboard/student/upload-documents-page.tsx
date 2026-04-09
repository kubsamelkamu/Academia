"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Download, Eye, FileText, Upload } from "lucide-react"
import { toast } from "sonner"

import { useDocumentTemplatesList } from "@/lib/hooks/use-document-templates"
import { useMilestoneTemplatesList } from "@/lib/hooks/use-milestone-templates"
import { useUploadMilestoneSubmission } from "@/lib/hooks/use-student-milestones"
import {
  useCreateProposalWithPdf,
  useMyGroupProposals,
  useSubmitProposalForReview,
} from "@/lib/hooks/use-project-proposals"
import { useMyProjectGroup } from "@/lib/hooks/use-project-groups"
import {
  getActiveMilestoneTemplate,
  getLatestLinkedProposal,
  isProposalMilestoneName,
  normalizeMilestoneName,
  toProposalMilestoneState,
} from "@/lib/student-milestone-helpers"
import { useAuthStore } from "@/store/auth-store"
import type { DepartmentDocumentTemplate, DocumentTemplateType } from "@/types/document-templates"
import type { ProjectProposal, ProposalProjectMilestone } from "@/types/project-proposals"

type MilestoneStatus = "pending" | "submitted" | "approved"

function getRecommendedTemplateType(milestone: string): DocumentTemplateType | null {
  if (milestone === "requirements") return "SRS"
  if (milestone === "design") return "SDD"
  if (milestone === "final") return "REPORT"
  return null
}

function normalizeMilestoneParam(value: string | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}

function milestoneParamToKey(param: string | null): string {
  const normalized = normalizeMilestoneParam(param)
  if (!normalized) return ""
  if (normalized.includes("proposal")) return "proposal"
  if (normalized.includes("project title")) return "proposal"
  if (normalized.includes("requirement") || normalized.includes("srs")) return "requirements"
  if (normalized.includes("design") || normalized.includes("sdd")) return "design"
  if (normalized.includes("implementation")) return "implementation"
  if (normalized.includes("final") || normalized.includes("report")) return "final"
  return ""
}

function milestoneKeyToLabel(key: string): string {
  if (key === "proposal") return "Project Proposal"
  if (key === "requirements") return "Requirements (SRS)"
  if (key === "design") return "Design (SDD)"
  if (key === "implementation") return "Implementation"
  if (key === "final") return "Final Report"
  return "Milestone"
}

function hasProposalPdf(proposal: ProjectProposal | null): boolean {
  if (!proposal?.documents?.length) return false
  return proposal.documents.some((doc) => doc.key === "proposal.pdf")
}

function isPdfFile(file: File | null): boolean {
  if (!file) return false
  if (file.type === "application/pdf") return true
  return file.name.toLowerCase().endsWith(".pdf")
}

const MAX_PROPOSAL_PDF_BYTES = 5 * 1024 * 1024

function formatFileSize(sizeBytes: number | null | undefined) {
  if (typeof sizeBytes !== "number" || Number.isNaN(sizeBytes) || sizeBytes <= 0) return "-"

  const units = ["B", "KB", "MB", "GB"]
  let value = sizeBytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const digits = value >= 10 || unitIndex === 0 ? 0 : 1
  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

function mapBackendStatus(status: string): MilestoneStatus {
  const normalized = status.trim().toLowerCase()
  if (normalized === "approved" || normalized === "completed") return "approved"
  if (normalized === "submitted") return "submitted"
  return "pending"
}

function isAllowedMilestoneFile(file: File | null): boolean {
  if (!file) return false
  const name = file.name.toLowerCase()
  return (
    file.type === "application/pdf" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".pdf") ||
    name.endsWith(".docx")
  )
}

function titleToMilestoneKey(title: string): string {
  const normalized = normalizeMilestoneName(title)
  if (!normalized) return ""
  if (normalized.includes("proposal") || normalized.includes("project title")) return "proposal"
  if (normalized.includes("requirement") || normalized.includes("srs")) return "requirements"
  if (normalized.includes("design") || normalized.includes("sdd")) return "design"
  if (normalized.includes("implementation")) return "implementation"
  if (
    normalized.includes("final") ||
    normalized.includes("defense") ||
    normalized.includes("presentation") ||
    normalized.includes("report")
  ) {
    return "final"
  }
  return ""
}

export function StudentUploadDocumentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const studentId = user?.id ?? null

  const myProjectGroupQuery = useMyProjectGroup(Boolean(user))
  const myGroupProposalsQuery = useMyGroupProposals(Boolean(user))
  const projectTitle = myProjectGroupQuery.data?.name?.trim() || ""
  const [title, setTitle] = useState("")
  const [milestone, setMilestone] = useState("")
  const [milestoneFile, setMilestoneFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasRedirectedRef = useRef(false)

  const milestoneParam = searchParams.get("milestone")
  const milestoneKeyFromParam = useMemo(() => milestoneParamToKey(milestoneParam), [milestoneParam])

  useEffect(() => {
    if (!milestone && milestoneKeyFromParam) {
      setMilestone(milestoneKeyFromParam)
    }
  }, [milestone, milestoneKeyFromParam])

  const isProposalFlow = useMemo(() => {
    if (milestone === "proposal") return true
    const normalizedParam = normalizeMilestoneParam(milestoneParam)
    return normalizedParam.includes("proposal")
  }, [milestone, milestoneParam])

  const { data: milestoneTemplatesData } = useMilestoneTemplatesList(departmentId, {
    page: 1,
    limit: 100,
  })
  const latestLinkedProposal = useMemo(
    () => getLatestLinkedProposal(myGroupProposalsQuery.data),
    [myGroupProposalsQuery.data]
  )

  const projectMilestones = latestLinkedProposal?.project?.milestones ?? []

  const targetMilestone = useMemo<ProposalProjectMilestone | null>(() => {
    if (!milestone) return null
    return (
      projectMilestones.find((item) => titleToMilestoneKey(item.title ?? "") === milestone) ?? null
    )
  }, [milestone, projectMilestones])

  const latestSubmission = targetMilestone?.submissions?.[0] ?? null
  const feedbacks = latestSubmission?.feedbacks ?? []
  const hasFeedback = feedbacks.length > 0
  const isApproved =
    targetMilestone?.status === "APPROVED" || latestSubmission?.status === "APPROVED"
  const canUploadFirst = !latestSubmission
  const canResubmit = Boolean(latestSubmission && hasFeedback && !isApproved)
  const waitingForReview = Boolean(latestSubmission && !hasFeedback && !isApproved)
  const canSubmitMilestone = canUploadFirst || canResubmit
  const uploadMilestoneSubmissionMutation = useUploadMilestoneSubmission()

  const prerequisiteCheck = useMemo(() => {
    if (!milestone) return null

    const templates = milestoneTemplatesData?.templates ?? []
    const activeTemplate = templates.find((t) => t.isActive) ?? templates[0] ?? null
    if (!activeTemplate?.milestones?.length) return null

    const orderedTemplateMilestones = activeTemplate.milestones
      .slice()
      .sort((a, b) => a.sequence - b.sequence)

    const projectMilestonesByName = new Map(
      projectMilestones.map((item) => [normalizeMilestoneName(item.title ?? ""), item])
    )

    const proposalMilestoneState = toProposalMilestoneState(myGroupProposalsQuery.data)

    const orderedStatuses = orderedTemplateMilestones.map((templateMilestone) => {
      const matched = projectMilestonesByName.get(normalizeMilestoneName(templateMilestone.title))
      const mappedStatus = matched ? mapBackendStatus(matched.status) : ("pending" as const)

      if (proposalMilestoneState && isProposalMilestoneName(templateMilestone.title)) {
        return proposalMilestoneState.status
      }

      return mappedStatus
    })

    const currentIndex = orderedTemplateMilestones.findIndex((templateMilestone) => {
      const key = titleToMilestoneKey(templateMilestone.title)
      return key === milestone
    })

    if (currentIndex === -1) return null
    if (currentIndex <= 0) return { blocked: false }

    const previousIndex = currentIndex - 1
    const previousStatus = orderedStatuses[previousIndex]
    if (previousStatus === "approved") return { blocked: false }

    const blockingMilestoneNumber =
      orderedTemplateMilestones[previousIndex].sequence ?? previousIndex + 1
    return { blocked: true, blockingMilestoneNumber }
  }, [milestone, milestoneTemplatesData?.templates, myGroupProposalsQuery.data, projectMilestones])

  useEffect(() => {
    if (hasRedirectedRef.current) return
    if (!prerequisiteCheck?.blocked) return

    hasRedirectedRef.current = true
    toast.error(
      prerequisiteCheck.blockingMilestoneNumber
        ? `Locked until Milestone ${prerequisiteCheck.blockingMilestoneNumber} is approved.`
        : "This milestone is locked until previous milestones are approved."
    )
    router.replace("/dashboard/student/milestones")
  }, [prerequisiteCheck, router])

  useEffect(() => {
    if (isProposalFlow) return
    if (hasRedirectedRef.current) return
    if (!milestone) return
    if (!targetMilestone) return

    if (isApproved) {
      hasRedirectedRef.current = true
      toast.info("This milestone is already approved.")
      router.replace("/dashboard/student/milestones")
      return
    }

    if (waitingForReview) {
      hasRedirectedRef.current = true
      toast.info("This milestone is awaiting advisor review.")
      router.replace("/dashboard/student/milestones")
      return
    }
  }, [isApproved, isProposalFlow, milestone, router, targetMilestone, waitingForReview])

  const milestoneLabel = useMemo(() => milestoneKeyToLabel(milestone), [milestone])

  useEffect(() => {
    if (isProposalFlow) return
    if (!milestone) return
    if (title.trim()) return

    const base = projectTitle || ""
    const suggested = base ? `${base} — ${milestoneLabel}` : milestoneLabel
    setTitle(suggested)
  }, [isProposalFlow, milestone, milestoneLabel, projectTitle, title])

  const createProposalMutation = useCreateProposalWithPdf()
  const submitProposalMutation = useSubmitProposalForReview()
  const [proposal, setProposal] = useState<ProjectProposal | null>(null)
  const [proposalTitle1, setProposalTitle1] = useState("")
  const [proposalTitle2, setProposalTitle2] = useState("")
  const [proposalTitle3, setProposalTitle3] = useState("")
  const [proposalPdf, setProposalPdf] = useState<File | null>(null)

  const canSubmitProposal = useMemo(() => {
    if (!proposal?.id) return false
    const status = String(proposal.status ?? "").toUpperCase()
    const allowed = status === "DRAFT" || status === "REJECTED"
    return allowed && hasProposalPdf(proposal)
  }, [proposal])
  const recommendedType = getRecommendedTemplateType(milestone)
  const templatesQuery = useDocumentTemplatesList(isProposalFlow ? null : departmentId, {
    page: 1,
    limit: 10,
    isActive: true,
    type: recommendedType ?? undefined,
  })

  const recommendedTemplate = useMemo<DepartmentDocumentTemplate | null>(() => {
    if (!recommendedType || !templatesQuery.data?.templates.length) {
      return null
    }

    return templatesQuery.data.templates[0] ?? null
  }, [recommendedType, templatesQuery.data?.templates])

  const handleSubmit = async () => {
    if (!milestone) {
      toast.error("Milestone is required")
      return
    }

    if (!targetMilestone?.id) {
      toast.error("Unable to resolve milestone submission target")
      return
    }

    if (!milestoneFile) {
      toast.error("A file is required")
      return
    }

    if (!isAllowedMilestoneFile(milestoneFile)) {
      toast.error("Only PDF and DOCX files are allowed")
      return
    }

    if (!canSubmitMilestone) {
      toast.error("This milestone cannot be uploaded right now")
      return
    }

    setIsSubmitting(true)
    try {
      await uploadMilestoneSubmissionMutation.mutateAsync({
        milestoneId: targetMilestone.id,
        file: milestoneFile,
      })
      toast.success(canResubmit ? "Milestone resubmitted successfully" : "Milestone submitted successfully")
      router.push("/dashboard/student/submissions")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadProposal = async () => {
    const titles = [proposalTitle1.trim(), proposalTitle2.trim(), proposalTitle3.trim()]

    if (titles.some((t) => !t)) {
      toast.error("All 3 titles are required")
      return
    }

    const uniqueTitles = new Set(titles.map((t) => t.toLowerCase()))
    if (uniqueTitles.size !== 3) {
      toast.error("Titles must be unique")
      return
    }

    if (!proposalPdf) {
      toast.error("Proposal PDF is required")
      return
    }

    if (!isPdfFile(proposalPdf)) {
      toast.error("Proposal file must be a PDF")
      return
    }

    if (proposalPdf.size > MAX_PROPOSAL_PDF_BYTES) {
      toast.error("PDF must be 5MB or smaller")
      return
    }

    try {
      const created = await createProposalMutation.mutateAsync({
        titles: [titles[0], titles[1], titles[2]],
        proposalPdf,
      })

      setProposal(created)
      toast.success("Draft proposal created")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      toast.error(message)
    }
  }

  const handleSubmitProposal = async () => {
    if (!proposal?.id) return

    try {
      const updated = await submitProposalMutation.mutateAsync({ proposalId: proposal.id })
      setProposal(updated)
      toast.success("Proposal submitted for review")

      try {
        const host = typeof window !== "undefined" ? window.location.host : ""
        const ids = [
          studentId ?? null,
          (typeof updated.submittedBy === "string" ? updated.submittedBy : null) ?? null,
          (typeof updated.submitter?.id === "string" ? updated.submitter.id : null) ?? null,
        ].filter((value): value is string => Boolean(value && value.trim()))

        const uniqueIds = Array.from(new Set(ids.map((value) => value.trim())))
        const markerScopes = Array.from(new Set([...uniqueIds, "any", ""]))
        const storageKeys = markerScopes.map((scope) =>
          ["academia:proposal:lastSubmitted", host, scope].join(":")
        )

        const proposalStatus = String(updated.status ?? "").toUpperCase()
        const milestoneStatus = proposalStatus === "APPROVED" ? "approved" : "submitted"
        const submittedAt =
          updated.submittedAt ??
          updated.updatedAt ??
          updated.createdAt ??
          new Date().toISOString()

        const payload = JSON.stringify({
          proposalId: updated.id,
          status: milestoneStatus,
          submittedAt,
        })

        for (const storageKey of storageKeys) {
          localStorage.setItem(storageKey, payload)
        }
      } catch {
        // ignore localStorage failures
      }

      router.push("/dashboard/student/milestones")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submit failed"
      toast.error(message)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isProposalFlow ? "Milestone 1: Project Proposal" : "Upload Document"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isProposalFlow
              ? "Upload your proposal PDF to create a draft, then submit it for review."
              : "Add a new file to your submissions for advisor review."}
          </p>
          {projectTitle ? (
            <p className="text-xs text-muted-foreground mt-2">
              Project: <span className="text-foreground font-medium">{projectTitle}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/student/milestones")}
            className="justify-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Milestones
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/student/submissions")}
            className="justify-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isProposalFlow ? "Milestone 1: Project Proposal" : "Document Details"}</CardTitle>
          <CardDescription>
            {isProposalFlow
              ? "Provide three title options and upload your proposal PDF (max 5MB)."
              : "Fill in the required fields and upload your file."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isProposalFlow ? (
            <div className="space-y-5">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                <p className="text-sm font-medium">Upload-first flow</p>
                <p className="text-sm text-muted-foreground">
                  Step 1 creates a <span className="font-medium text-foreground">DRAFT</span> and uploads the PDF.
                  Step 2 submits the draft for review.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="proposal-title-1">Title 1</Label>
                  <Input
                    id="proposal-title-1"
                    value={proposalTitle1}
                    onChange={(e) => setProposalTitle1(e.target.value)}
                    placeholder="First title option"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposal-title-2">Title 2</Label>
                  <Input
                    id="proposal-title-2"
                    value={proposalTitle2}
                    onChange={(e) => setProposalTitle2(e.target.value)}
                    placeholder="Second title option"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="proposal-title-3">Title 3</Label>
                  <Input
                    id="proposal-title-3"
                    value={proposalTitle3}
                    onChange={(e) => setProposalTitle3(e.target.value)}
                    placeholder="Third title option"
                  />
                  <p className="text-xs text-muted-foreground">All three titles are required and must be unique.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposal-pdf">Proposal PDF</Label>
                <Input
                  id="proposal-pdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setProposalPdf(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">PDF only, max 5MB.</p>
              </div>

              {proposal ? (
                <div className="rounded-lg border bg-background p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">Draft created</p>
                      <p className="text-xs text-muted-foreground">Proposal ID: {proposal.id}</p>
                    </div>
                    <Badge variant="secondary" className="self-start sm:self-auto">
                      {String(proposal.status ?? "DRAFT")}
                    </Badge>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {hasProposalPdf(proposal) ? "proposal.pdf attached" : "proposal.pdf missing"}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  onClick={handleUploadProposal}
                  disabled={createProposalMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {createProposalMutation.isPending ? "Uploading..." : "Upload Proposal"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSubmitProposal}
                  disabled={!canSubmitProposal || submitProposalMutation.isPending}
                >
                  {submitProposalMutation.isPending ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>

              {!proposal ? (
                <p className="text-xs text-muted-foreground">
                  After uploading, you’ll see the created draft and can submit it.
                </p>
              ) : !canSubmitProposal ? (
                <p className="text-xs text-muted-foreground">
                  Submit is enabled only when the draft has <span className="font-medium text-foreground">proposal.pdf</span> attached.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-title">Document Title</Label>
                <Input
                  id="document-title"
                  placeholder="e.g., Project Proposal v3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-file">File</Label>
                <Input
                  id="document-file"
                  type="file"
                  accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                  onChange={(e) => setMilestoneFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, DOCX
                </p>
              </div>

              <div className="space-y-2">
                <Label>Milestone</Label>
                <select
                  value={milestone}
                  onChange={(e) => setMilestone(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select milestone</option>
                  <option value="proposal">Proposal</option>
                  <option value="requirements">Requirements (SRS)</option>
                  <option value="design">Design (SDD)</option>
                  <option value="implementation">Implementation</option>
                  <option value="final">Final Report</option>
                </select>
              </div>

              {recommendedType ? (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Recommended Template</p>
                        <Badge variant="outline">{recommendedType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use the department template below as a starting point for this milestone.
                      </p>
                    </div>
                  </div>

                  {!departmentId ? (
                    <p className="text-sm text-muted-foreground">
                      Your account is not linked to a department yet, so no template can be suggested.
                    </p>
                  ) : templatesQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading recommended template...</p>
                  ) : templatesQuery.isError ? (
                    <p className="text-sm text-destructive">{templatesQuery.error.message}</p>
                  ) : recommendedTemplate ? (
                    <div className="rounded-lg border bg-background p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium">{recommendedTemplate.title}</p>
                          {recommendedTemplate.description ? (
                            <p className="text-sm text-muted-foreground">{recommendedTemplate.description}</p>
                          ) : null}
                          {recommendedTemplate.files[0] ? (
                            <p className="text-xs text-muted-foreground">
                              {recommendedTemplate.files[0].fileName} • {formatFileSize(recommendedTemplate.files[0].sizeBytes)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">No file is attached to this template yet.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {recommendedTemplate.files[0]?.url ? (
                          <Button asChild variant="outline" size="sm">
                            <a href={recommendedTemplate.files[0].url} target="_blank" rel="noreferrer">
                              <Eye className="h-4 w-4 mr-2" />
                              Open
                            </a>
                          </Button>
                        ) : null}
                        {recommendedTemplate.files[0]?.url ? (
                          <Button asChild variant="outline" size="sm">
                            <a href={recommendedTemplate.files[0].url} download>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No active {recommendedType} template is available for your department right now.
                    </p>
                  )}
                </div>
              ) : null}

              {!isProposalFlow && targetMilestone ? (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">Current milestone state</p>
                    <Badge variant="outline">{targetMilestone.status ?? "PENDING"}</Badge>
                    {isApproved ? <Badge>Approved</Badge> : null}
                    {canResubmit ? <Badge variant="secondary">Feedback Received</Badge> : null}
                    {waitingForReview ? <Badge variant="secondary">Awaiting Advisor Review</Badge> : null}
                  </div>
                  {latestSubmission?.fileName ? (
                    <p className="text-sm text-muted-foreground">
                      Latest submission: {latestSubmission.fileName}
                    </p>
                  ) : null}
                  {feedbacks[0]?.message ? (
                    <p className="text-sm text-muted-foreground">
                      Latest feedback: {feedbacks[0].message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || uploadMilestoneSubmissionMutation.isPending || !canSubmitMilestone}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isSubmitting || uploadMilestoneSubmissionMutation.isPending
                    ? "Uploading..."
                    : canResubmit
                      ? "Resubmit"
                      : "Upload Submission"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
