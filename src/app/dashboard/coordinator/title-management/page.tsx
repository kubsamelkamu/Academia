"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  Search,
  Users,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { useDepartmentProjectProposals } from "@/lib/hooks/use-project-proposals"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import type {
  DepartmentProjectProposalsSummary,
  ProjectProposal,
  ProposalDocument,
  ProposalParty,
} from "@/types/project-proposals"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type TitleStatus = "pending" | "approved" | "rejected" | "draft"

const GROUP_TITLES_PER_PAGE = 5

type GroupSummary = {
  groupId: string
  groupName: string
  managerName: string
  memberCount: number
  advisorName: string
  titles: ProjectTitle[]
  latestSubmittedAt?: string | null
}

interface ProjectTitle {
  id: string
  title: string
  description: string
  groupId: string
  groupName: string
  managerName: string
  memberCount: number
  advisorName: string
  submittedAt?: string | null
  status: TitleStatus
  reviewNote?: string
  documents: ProposalDocument[]
  proposedTitles: string[]
  selectedTitleIndex?: number | null
}

const STATUS_CFG: Record<TitleStatus, { label: string; cls: string }> = {
  pending: {
    label: "Pending",
    cls: "bg-primary/10 text-primary border-primary/20",
  },
  approved: {
    label: "Approved",
    cls: "bg-muted text-foreground border-border",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
  },
  draft: {
    label: "Draft",
    cls: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
}

function formatPersonName(person?: ProposalParty | null) {
  if (!person) return ""

  const fullName = [person.firstName, person.lastName].filter(Boolean).join(" ").trim()
  return fullName || person.email || ""
}

function formatOptionalDate(value?: string | null) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function daysAgo(value?: string | null) {
  if (!value) return "Unknown"

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return "Unknown"

  const diffDays = Math.floor((Date.now() - timestamp) / 86_400_000)
  if (diffDays <= 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return `${diffDays}d ago`
}

function normalizeStatus(status?: string | null): TitleStatus {
  const normalized = String(status ?? "").trim().toUpperCase()

  if (normalized === "APPROVED") return "approved"
  if (normalized === "REJECTED") return "rejected"
  if (normalized === "DRAFT") return "draft"
  return "pending"
}

function normalizeDocuments(documents: ProjectProposal["documents"]): ProposalDocument[] {
  if (!Array.isArray(documents)) return []

  return documents.filter((document): document is ProposalDocument => {
    if (!document || Array.isArray(document) || typeof document !== "object") {
      return false
    }

    return typeof (document as ProposalDocument).url === "string"
  })
}

function collectMemberNames(proposal: ProjectProposal) {
  const names = new Set<string>()
  const leaderName = formatPersonName(proposal.projectGroup?.leader)
  if (leaderName) {
    names.add(leaderName)
  }

  for (const member of proposal.projectGroup?.members ?? []) {
    const memberName = formatPersonName(member.user)
    if (memberName) {
      names.add(memberName)
    }
  }

  const submitterName = formatPersonName(proposal.submitter)
  if (!names.size && submitterName) {
    names.add(submitterName)
  }

  return Array.from(names)
}

function mapProposalToTitle(proposal: ProjectProposal): ProjectTitle {
  const proposedTitles = (proposal.proposedTitles ?? proposal.titles ?? [])
    .map((title) => title.trim())
    .filter(Boolean)
  const selectedIndex = proposal.selectedTitleIndex ?? null
  const selectedTitle =
    selectedIndex !== null && selectedIndex >= 0 ? proposedTitles[selectedIndex] : undefined
  const memberNames = collectMemberNames(proposal)
  const submitterName = formatPersonName(proposal.submitter) || proposal.submittedBy || "Unknown submitter"

  return {
    id: proposal.id,
    title: proposal.title?.trim() || selectedTitle || proposedTitles[0] || "Untitled proposal",
    description: proposal.description?.trim() || "No description provided.",
    groupId:
      proposal.projectGroupId?.trim() ||
      proposal.submitter?.id?.trim() ||
      proposal.submittedBy?.trim() ||
      `proposal-${proposal.id}`,
    groupName: proposal.projectGroup?.name?.trim() || submitterName,
    managerName: submitterName,
    memberCount: memberNames.length || 1,
    advisorName: formatPersonName(proposal.advisor) || "Unassigned",
    submittedAt: proposal.createdAt ?? proposal.updatedAt ?? proposal.submittedAt,
    status: normalizeStatus(proposal.status),
    reviewNote: proposal.feedback?.trim() || undefined,
    documents: normalizeDocuments(proposal.documents),
    proposedTitles,
    selectedTitleIndex: selectedIndex,
  }
}

function toTimestamp(value?: string | null) {
  if (!value) return 0

  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getGroupPriority(group: GroupSummary) {
  const hasPending = group.titles.some((title) => title.status === "pending")
  const hasDraft = group.titles.some((title) => title.status === "draft")
  const hasRejected = group.titles.some((title) => title.status === "rejected")

  if (hasPending) return 0
  if (hasDraft) return 1
  if (hasRejected) return 2
  return 3
}

function buildPagination(currentPage: number, totalPages: number) {
  if (totalPages <= 1) return [1]

  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < totalPages) {
      pages.add(page)
    }
  }

  const orderedPages = Array.from(pages).sort((left, right) => left - right)
  const result: Array<number | "ellipsis"> = []

  for (let index = 0; index < orderedPages.length; index += 1) {
    const page = orderedPages[index]
    const previous = orderedPages[index - 1]

    if (previous && page - previous > 1) {
      result.push("ellipsis")
    }

    result.push(page)
  }

  return result
}

function buildSummary(
  titles: ProjectTitle[],
  backendSummary?: DepartmentProjectProposalsSummary | null
): DepartmentProjectProposalsSummary {
  if (backendSummary) {
    return backendSummary
  }

  return {
    total: titles.length,
    pending: titles.filter((title) => title.status === "pending").length,
    approved: titles.filter((title) => title.status === "approved").length,
    rejected: titles.filter((title) => title.status === "rejected").length,
    draft: titles.filter((title) => title.status === "draft").length,
  }
}

function openDocument(document: ProposalDocument) {
  if (!document.url || typeof window === "undefined") {
    toast("Document URL is not available for this proposal.")
    return
  }

  window.open(document.url, "_blank", "noopener,noreferrer")
}

function ReviewSheet({
  title,
  open,
  onClose,
}: {
  title: ProjectTitle | null
  open: boolean
  onClose: () => void
}) {
  if (!title) return null

  const statusConfig = STATUS_CFG[title.status]

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="line-clamp-2 text-sm leading-snug">{title.title}</SheetTitle>
              <SheetDescription className="mt-0.5 text-xs">
                {title.groupName} · Advisor: {title.advisorName}
              </SheetDescription>
            </div>
            <Badge variant="outline" className={`shrink-0 text-xs ${statusConfig.cls}`}>
              {statusConfig.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "Group", value: title.groupName },
              { label: "Submitted By", value: title.managerName },
              { label: "Advisor", value: title.advisorName },
              { label: "Submitted", value: formatOptionalDate(title.submittedAt) },
            ].map((row) => (
              <div key={row.label} className="space-y-0.5 rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-muted-foreground">{row.label}</p>
                <p className="text-sm font-semibold text-foreground">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" /> Proposed Titles
            </p>
            <div className="space-y-2 rounded-xl border bg-muted/20 px-4 py-3">
              {(title.proposedTitles.length ? title.proposedTitles : [title.title]).map((proposalTitle, index) => {
                const isSelected = title.selectedTitleIndex === index

                return (
                  <div key={`${title.id}-${proposalTitle}-${index}`} className="flex items-start gap-2 text-sm">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="leading-relaxed">{proposalTitle}</p>
                      {isSelected && (
                        <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Selected by committee
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" /> Description
            </p>
            <div className="rounded-xl border bg-muted/20 px-4 py-3">
              <p className="text-sm leading-relaxed">{title.description}</p>
            </div>
          </div>

          {title.reviewNote && (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                title.status === "rejected"
                  ? "border-destructive/20 bg-destructive/5 text-destructive"
                  : "border-primary/10 bg-primary/5 text-foreground"
              )}
            >
              <span className="font-semibold">Feedback:</span> {title.reviewNote}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Proposal Documents</p>
            {title.documents.length > 0 ? (
              <div className="space-y-2">
                {title.documents.map((document) => (
                  <Button
                    key={`${title.id}-${document.url}`}
                    variant="outline"
                    className="w-full justify-between gap-2"
                    onClick={() => openDocument(document)}
                  >
                    <span className="truncate text-left text-sm">
                      {document.originalName || document.key || "Proposal document"}
                    </span>
                    <Download className="h-4 w-4 shrink-0" />
                  </Button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                No proposal documents were attached to this submission.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            Review actions are intentionally read-only in this first integration step. Approve, reject, and bulk review actions will be wired to backend endpoints next.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function TitleRow({
  index,
  title,
  onReview,
}: {
  index: number
  title: ProjectTitle
  onReview: (title: ProjectTitle) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const statusConfig = STATUS_CFG[title.status]

  return (
    <div
      className={cn(
        "rounded-xl border transition-all",
        expanded
          ? "border-primary/20 bg-primary/[0.02]"
          : "border-border/60 bg-card hover:border-primary/15 hover:bg-muted/20"
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            title.status === "pending"
              ? "bg-primary/10 text-primary"
              : title.status === "approved"
                ? "bg-muted text-foreground"
                : title.status === "draft"
                  ? "bg-amber-500/10 text-amber-700"
                  : "bg-destructive/10 text-destructive"
          )}
        >
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{title.title}</p>
            <Badge variant="outline" className={`shrink-0 text-xs ${statusConfig.cls}`}>
              {statusConfig.label}
            </Badge>
          </div>

          <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {daysAgo(title.submittedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {title.memberCount} member{title.memberCount === 1 ? "" : "s"}
            </span>
            {title.documents.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {title.documents.length} document{title.documents.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs hover:border-primary hover:text-primary"
            onClick={() => onReview(title)}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setExpanded((value) => !value)}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="ml-9 space-y-3 border-t border-border/60 px-4 pb-4 pt-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="text-sm leading-relaxed text-foreground/90">{title.description}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Submitted by <span className="font-medium text-foreground">{title.managerName}</span>
            </div>
            <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Advisor <span className="font-medium text-foreground">{title.advisorName}</span>
            </div>
          </div>

          {title.reviewNote && (
            <div
              className={cn(
                "rounded-lg border px-3 py-2 text-xs",
                title.status === "rejected"
                  ? "border-destructive/10 bg-destructive/5 text-destructive"
                  : "border-primary/10 bg-primary/5 text-primary/80"
              )}
            >
              <span className="font-semibold">Feedback:</span> {title.reviewNote}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GroupCard({
  groupId,
  groupName,
  managerName,
  memberCount,
  advisorName,
  titles,
  onReview,
}: GroupSummary & {
  onReview: (title: ProjectTitle) => void
}) {
  const [currentTitlesPage, setCurrentTitlesPage] = useState(1)
  const pendingCount = titles.filter((title) => title.status === "pending").length
  const approvedCount = titles.filter((title) => title.status === "approved").length
  const rejectedCount = titles.filter((title) => title.status === "rejected").length
  const draftCount = titles.filter((title) => title.status === "draft").length
  const latestSubmittedAt = titles
    .map((title) => title.submittedAt)
    .sort((left, right) => toTimestamp(right) - toTimestamp(left))[0]
  const documentsCount = titles.reduce((total, title) => total + title.documents.length, 0)
  const titlesTotalPages = Math.max(1, Math.ceil(titles.length / GROUP_TITLES_PER_PAGE))
  const safeTitlesPage = Math.min(currentTitlesPage, titlesTotalPages)
  const visibleTitles = titles.slice(
    (safeTitlesPage - 1) * GROUP_TITLES_PER_PAGE,
    safeTitlesPage * GROUP_TITLES_PER_PAGE
  )
  const titlesPaginationItems = buildPagination(safeTitlesPage, titlesTotalPages)

  React.useEffect(() => {
    if (currentTitlesPage > titlesTotalPages) {
      setCurrentTitlesPage(titlesTotalPages)
    }
  }, [currentTitlesPage, titlesTotalPages])

  return (
    <Card className="overflow-hidden border border-border/60 bg-card shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className="flex items-start gap-4 border-b bg-gradient-to-r from-muted/50 via-muted/20 to-transparent px-5 py-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold">{groupName}</h3>
            {pendingCount > 0 && (
              <Badge variant="outline" className="border-primary/20 bg-primary/10 text-xs text-primary">
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {memberCount} members · {managerName}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> Advisor: {advisorName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Updated {daysAgo(latestSubmittedAt)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-1">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {titles.length} proposal{titles.length === 1 ? "" : "s"}
            </span>
            {draftCount > 0 && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-700">
                {draftCount} draft
              </span>
            )}
            {approvedCount > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-foreground/70">
                {approvedCount} approved
              </span>
            )}
            {rejectedCount > 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
                {rejectedCount} rejected
              </span>
            )}
          </div>
          {documentsCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs hover:border-primary hover:text-primary"
              onClick={() => {
                const firstDocument = titles.flatMap((title) => title.documents)[0]
                if (!firstDocument) {
                  toast("No proposal document is available for this group yet.")
                  return
                }

                openDocument(firstDocument)
              }}
            >
              <Download className="h-3.5 w-3.5" />
              {documentsCount === 1 ? "Proposal PDF" : `${documentsCount} documents`}
            </Button>
          ) : (
            <div className="rounded-full border border-dashed px-3 py-1 text-[10px] text-muted-foreground">
              No documents
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2.5 p-4">
        {visibleTitles.map((title, index) => (
          <TitleRow
            key={`${groupId}-${title.id}`}
            index={(safeTitlesPage - 1) * GROUP_TITLES_PER_PAGE + index}
            title={title}
            onReview={onReview}
          />
        ))}

        {titlesTotalPages > 1 && (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{(safeTitlesPage - 1) * GROUP_TITLES_PER_PAGE + 1}</span> to <span className="font-medium text-foreground">{Math.min(safeTitlesPage * GROUP_TITLES_PER_PAGE, titles.length)}</span> of <span className="font-medium text-foreground">{titles.length}</span> proposals
            </p>
            <Pagination className="mx-0 w-auto justify-start sm:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentTitlesPage(1)}
                    disabled={safeTitlesPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentTitlesPage((page) => Math.max(1, page - 1))}
                    disabled={safeTitlesPage === 1}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                {titlesPaginationItems.map((item, index) => {
                  if (item === "ellipsis") {
                    return (
                      <PaginationItem key={`${groupId}-ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )
                  }

                  return (
                    <PaginationItem key={`${groupId}-${item}`}>
                      <Button
                        variant={safeTitlesPage === item ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentTitlesPage(item)}
                      >
                        {item}
                      </Button>
                    </PaginationItem>
                  )
                })}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentTitlesPage((page) => Math.min(titlesTotalPages, page + 1))}
                    disabled={safeTitlesPage === titlesTotalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentTitlesPage(titlesTotalPages)}
                    disabled={safeTitlesPage === titlesTotalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </Card>
  )
}

function WorkflowPipeline({ summary }: { summary: DepartmentProjectProposalsSummary }) {
  const hasSubmissions = summary.total > 0
  const hasItemsInReview = summary.pending > 0 || summary.draft > 0
  const hasDecisions = summary.approved > 0 || summary.rejected > 0
  const hasApprovedProjects = summary.approved > 0

  const steps = [
    {
      title: "Student Submission",
      description: "Students prepare a proposal document that presents the intended project title, background, abstract, objectives, and the core problem the team plans to solve.",
      note: "Submission package: title proposal, abstract, objectives, description, and proposal document.",
      icon: FileText,
      state: hasSubmissions ? "completed" : "upcoming",
    },
    {
      title: "Department Committee Review",
      description: "The department committee reviews relevance, scope, clarity, originality, and proposal completeness before the title can move to the decision stage.",
      note: hasItemsInReview
        ? "Some submissions are still under committee review or waiting for the next review action."
        : "Committee review is complete for the currently visible submissions.",
      icon: Users,
      state: hasItemsInReview ? "current" : hasSubmissions ? "completed" : "upcoming",
    },
    {
      title: "Coordinator Decision",
      description: "The coordinator confirms whether a proposed title should be approved, returned for revision, or rejected after committee review is complete.",
      note: hasDecisions
        ? "Decision records already exist for part of the current proposal queue."
        : "No final coordinator decision has been recorded yet.",
      icon: CheckCircle2,
      state: hasDecisions ? "current" : hasSubmissions ? "upcoming" : "upcoming",
    },
    {
      title: "Project Kickoff",
      description: "After approval, the group proceeds with the confirmed title and can begin project planning, milestone execution, and advisor-guided implementation.",
      note: hasApprovedProjects
        ? "Approved titles are ready to move into project execution and follow-up milestones."
        : "Project kickoff begins only after a title has been approved.",
      icon: GraduationCap,
      state: hasApprovedProjects ? "ready" : "upcoming",
    },
  ] as const

  const stateConfig = {
    completed: {
      badge: "Completed",
      card: "border-primary/15 bg-primary/5",
      iconWrap: "bg-primary/10 text-primary",
      badgeClass: "border-primary/20 bg-primary/10 text-primary",
      rail: "bg-primary/60",
    },
    current: {
      badge: "In Review",
      card: "border-primary/20 bg-muted/30",
      iconWrap: "bg-primary/10 text-primary",
      badgeClass: "border-primary/20 bg-primary/10 text-primary",
      rail: "bg-primary/50",
    },
    ready: {
      badge: "Ready",
      card: "border-border bg-background",
      iconWrap: "bg-foreground text-background",
      badgeClass: "border-border bg-foreground text-background",
      rail: "bg-foreground/70",
    },
    upcoming: {
      badge: "Upcoming",
      card: "border-border/60 bg-muted/20",
      iconWrap: "bg-muted text-muted-foreground",
      badgeClass: "border-border bg-muted text-muted-foreground",
      rail: "bg-border",
    },
  } as const

  return (
    <Card className="overflow-hidden border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 shadow-sm">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Title Approval Workflow</p>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              This flow shows how a project title moves from student submission to review, decision, and project start.
            </p>
          </div>
          <div className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground">
            Informational journey for title approval
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {steps.map((step, index) => {
            const state = stateConfig[step.state]

            return (
              <div key={step.title} className="flex gap-3 2xl:block">
                <div className="hidden 2xl:flex 2xl:items-center 2xl:justify-center">
                  {index > 0 && <div className="h-px w-6 bg-border/70" />}
                </div>
                <div className={cn("flex h-full min-h-[280px] flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm transition-colors", state.card)}>
                  <div className={cn("h-1.5 w-full", state.rail)} />
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", state.iconWrap)}>
                          <step.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Step {index + 1}
                          </p>
                          <p className="mt-1 text-base font-semibold text-foreground">{step.title}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("shrink-0 text-[10px] uppercase tracking-wide", state.badgeClass)}>
                        {state.badge}
                      </Badge>
                    </div>

                    <div className="mt-5 flex-1">
                      <p className="text-sm leading-7 text-muted-foreground">{step.description}</p>
                    </div>

                    <div className="mt-5 border-t border-border/60 pt-4">
                      <div className="rounded-xl bg-background/80 px-3 py-3 text-xs leading-6 text-muted-foreground shadow-sm">
                        {step.note}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="h-16 animate-pulse rounded-xl bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
        </CardContent>
      </Card>
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function CoordinatorTitleManagementPage() {
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const departmentId = user?.departmentId ?? user?.department?.id ?? null
  const departmentLabel = user?.departmentName ?? user?.department?.name ?? "your department"

  const proposalsQuery = useDepartmentProjectProposals({
    departmentId,
    enabled: Boolean(accessToken) && Boolean(departmentId),
  })

  const [sheetTitle, setSheetTitle] = useState<ProjectTitle | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TitleStatus | "all">("all")
  const [advisorFilter, setAdvisorFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [groupsPerPage, setGroupsPerPage] = useState("6")

  const titles = useMemo(() => {
    return (proposalsQuery.data?.items ?? []).map(mapProposalToTitle)
  }, [proposalsQuery.data?.items])

  const summary = useMemo(() => {
    return buildSummary(titles, proposalsQuery.data?.summary)
  }, [proposalsQuery.data?.summary, titles])

  const advisors = useMemo(() => {
    return Array.from(new Set(titles.map((title) => title.advisorName))).sort((left, right) => left.localeCompare(right))
  }, [titles])

  const filteredTitles = useMemo(() => {
    return titles.filter((title) => {
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        title.title.toLowerCase().includes(query) ||
        title.groupName.toLowerCase().includes(query) ||
        title.managerName.toLowerCase().includes(query) ||
        title.advisorName.toLowerCase().includes(query) ||
        title.description.toLowerCase().includes(query)
      const matchesStatus = statusFilter === "all" || title.status === statusFilter
      const matchesAdvisor = advisorFilter === "all" || title.advisorName === advisorFilter

      return matchesSearch && matchesStatus && matchesAdvisor
    })
  }, [advisorFilter, search, statusFilter, titles])

  const groups = useMemo(() => {
    const grouped = new Map<string, GroupSummary>()

    for (const title of filteredTitles) {
      if (!grouped.has(title.groupId)) {
        grouped.set(title.groupId, {
          groupId: title.groupId,
          groupName: title.groupName,
          managerName: title.managerName,
          memberCount: title.memberCount,
          advisorName: title.advisorName,
          titles: [],
        })
      }

      grouped.get(title.groupId)?.titles.push(title)
    }

    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        latestSubmittedAt: group.titles
          .map((title) => title.submittedAt)
          .sort((left, right) => toTimestamp(right) - toTimestamp(left))[0],
        titles: [...group.titles].sort((left, right) => toTimestamp(right.submittedAt) - toTimestamp(left.submittedAt)),
      }))
      .sort((left, right) => {
        const priorityDifference = getGroupPriority(left) - getGroupPriority(right)
        if (priorityDifference !== 0) {
          return priorityDifference
        }

        const latestDifference = toTimestamp(right.latestSubmittedAt) - toTimestamp(left.latestSubmittedAt)
        if (latestDifference !== 0) {
          return latestDifference
        }

        return right.titles.length - left.titles.length
      })
  }, [filteredTitles])

  const groupsPerPageValue = Number(groupsPerPage)
  const totalPages = Math.max(1, Math.ceil(groups.length / groupsPerPageValue))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedGroups = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * groupsPerPageValue
    return groups.slice(startIndex, startIndex + groupsPerPageValue)
  }, [groups, groupsPerPageValue, safeCurrentPage])
  const paginationItems = useMemo(
    () => buildPagination(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  )

  const advisorBreakdown = useMemo(() => {
    const buckets = new Map<string, number>()

    for (const title of titles) {
      buckets.set(title.advisorName, (buckets.get(title.advisorName) ?? 0) + 1)
    }

    return Array.from(buckets.entries()).sort((left, right) => right[1] - left[1])
  }, [titles])

  const kpi = [
    {
      label: "Total Proposals",
      value: summary.total,
      icon: FileText,
      bg: "bg-primary/10",
      color: "text-primary",
    },
    {
      label: "Pending Review",
      value: summary.pending,
      icon: Clock,
      bg: summary.pending > 0 ? "bg-destructive/10" : "bg-muted",
      color: summary.pending > 0 ? "text-destructive" : "text-muted-foreground",
    },
    {
      label: "Approved",
      value: summary.approved,
      icon: CheckCircle2,
      bg: "bg-muted",
      color: "text-foreground",
    },
    {
      label: "Rejected",
      value: summary.rejected,
      icon: XCircle,
      bg: summary.rejected > 0 ? "bg-destructive/10" : "bg-muted",
      color: summary.rejected > 0 ? "text-destructive" : "text-muted-foreground",
    },
  ]

  const openSheet = (title: ProjectTitle) => {
    setSheetTitle(title)
    setSheetOpen(true)
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setAdvisorFilter("all")
    setCurrentPage(1)
  }

  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, advisorFilter, groupsPerPage])

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coordinator">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Title Management
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Review project title proposals submitted by each student group in {departmentLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
        </div>
      </div>

      {!departmentId ? (
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Your account does not currently expose a department id, so coordinator proposals cannot be loaded yet.
          </CardContent>
        </Card>
      ) : proposalsQuery.isLoading ? (
        <LoadingState />
      ) : proposalsQuery.isError ? (
        <Card className="border-none shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="font-medium text-foreground">Failed to load project proposals</p>
              <p className="text-sm text-muted-foreground">{proposalsQuery.error.message}</p>
            </div>
            <Button onClick={() => proposalsQuery.refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpi.map((item) => (
              <Card key={item.label} className="group border-none shadow-sm transition-all hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.bg} transition-transform group-hover:scale-110`}
                  >
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <WorkflowPipeline summary={summary} />

          <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Proposal Queue</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {groups.length} group{groups.length === 1 ? "" : "s"} across {filteredTitles.length} visible proposal{filteredTitles.length === 1 ? "" : "s"}. Pending groups are pinned first.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                  {summary.pending} pending review
                </span>
                <span className="rounded-full bg-muted px-3 py-1">
                  {summary.approved} approved
                </span>
                <span className="rounded-full bg-destructive/10 px-3 py-1 text-destructive">
                  {summary.rejected} rejected
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, group, submitter, advisor, or description…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TitleStatus | "all")}>
              <SelectTrigger className="h-10 w-44 shrink-0">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={advisorFilter} onValueChange={setAdvisorFilter}>
              <SelectTrigger className="h-10 w-52 shrink-0">
                <BarChart3 className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Advisor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Advisors</SelectItem>
                {advisors.map((advisor) => (
                  <SelectItem key={advisor} value={advisor}>
                    {advisor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || statusFilter !== "all" || advisorFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 shrink-0 text-xs"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="-mt-1 flex flex-col gap-2 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing <span className="font-medium text-foreground">{groups.length === 0 ? 0 : (safeCurrentPage - 1) * groupsPerPageValue + 1}</span> to <span className="font-medium text-foreground">{Math.min(safeCurrentPage * groupsPerPageValue, groups.length)}</span> of <span className="font-medium text-foreground">{groups.length}</span> groups
            </p>
            <div className="flex items-center gap-2">
              <span>Groups per page</span>
              <Select value={groupsPerPage} onValueChange={setGroupsPerPage}>
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">No proposals match your filters</p>
              <p className="mt-1 text-xs text-muted-foreground">Try adjusting the search or filter criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedGroups.map((group) => (
                <GroupCard key={group.groupId} {...group} onReview={openSheet} />
              ))}
            </div>
          )}

          {groups.length > 0 && totalPages > 1 && (
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Page <span className="font-medium text-foreground">{safeCurrentPage}</span> of <span className="font-medium text-foreground">{totalPages}</span>
                </div>
                <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(1)}
                        disabled={safeCurrentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={safeCurrentPage === 1}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                    {paginationItems.map((item, index) => {
                      if (item === "ellipsis") {
                        return (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }

                      return (
                        <PaginationItem key={item}>
                          <Button
                            variant={safeCurrentPage === item ? "default" : "outline"}
                            size="icon"
                            onClick={() => setCurrentPage(item)}
                          >
                            {item}
                          </Button>
                        </PaginationItem>
                      )
                    })}
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={safeCurrentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={safeCurrentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
          )}

          {advisorBreakdown.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="h-4 w-4 text-primary" /> Proposals by Advisor
                </p>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                {advisorBreakdown.map(([advisor, count]) => {
                  const percent = Math.round((count / Math.max(titles.length, 1)) * 100)

                  return (
                    <div key={advisor} className="flex items-center gap-3">
                      <span className="w-44 truncate text-sm text-muted-foreground">{advisor}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-5 text-right text-xs font-semibold text-primary">{count}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <ReviewSheet title={sheetTitle} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
