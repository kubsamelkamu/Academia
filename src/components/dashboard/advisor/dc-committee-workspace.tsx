"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  MessageSquare,
  Paperclip,
  Shield,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Users,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { useAuthStore } from "@/store/auth-store"
import {
  useDepartmentProjectProposals,
  useProjectProposalDetails,
  useProjectProposalTitleVotes,
  useVoteProjectProposalTitle,
} from "@/lib/hooks/use-project-proposals"
import type { ProjectProposal, ProposalDocument, ProposalParty, ProposalTitleIndex } from "@/types/project-proposals"

type CommitteeTitle = {
  id: string
  name: string
  description: string
  attachment: string
  votes: number
}

type CommitteeGroup = {
  id: string
  name: string
  forwardedBy: string
  committeeMembers: number
  titles: CommitteeTitle[]
}

function formatPersonName(person?: ProposalParty | null) {
  if (!person) return ""
  const first = (person.firstName ?? "").trim()
  const last = (person.lastName ?? "").trim()
  const full = [first, last].filter(Boolean).join(" ").trim()
  return full || (person.email ?? "").trim() || ""
}

function getProposalPdfDocument(proposal: ProjectProposal): ProposalDocument | null {
  const docs = proposal.documents ?? []
  const match = docs.find((doc) => String(doc.key ?? "").toLowerCase() === "proposal.pdf")
  return match ?? docs[0] ?? null
}

function normalizeProposedTitles(proposal: ProjectProposal): string[] {
  const titles = (proposal.proposedTitles ?? proposal.titles ?? [])
    .map((title) => String(title ?? "").trim())
    .filter(Boolean)
  return titles
}

function isProposalSubmitted(status: unknown) {
  return String(status ?? "").trim().toUpperCase() === "SUBMITTED"
}

function formatTimestamp(value?: string | null) {
  if (!value) return ""
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return ""
  return timestamp.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function formatGroupMemberCount(proposalGroup: ProjectProposal["projectGroup"] | null | undefined) {
  if (!proposalGroup) return "-"
  const ids = new Set<string>()

  if (proposalGroup.leader?.id) {
    ids.add(String(proposalGroup.leader.id))
  }

  for (const member of proposalGroup.members ?? []) {
    const id = member?.user?.id
    if (id) {
      ids.add(String(id))
    }
  }

  return ids.size > 0 ? String(ids.size) : "-"
}

interface DcCommitteeWorkspaceProps {
  backHref?: string
  backLabel?: string
  role: "advisor" | "coordinator" | "department_head"
}

export function DcCommitteeWorkspace({
  backHref = "/dashboard/advisor",
  backLabel = "Back to Advisor Dashboard",
  role,
}: DcCommitteeWorkspaceProps) {
  const authUser = useAuthStore((state) => state.user)
  const departmentId = authUser?.departmentId ?? authUser?.department?.id ?? null

  const departmentProposalsQuery = useDepartmentProjectProposals({
    departmentId,
    enabled: Boolean(departmentId),
  })

  const backendGroups = React.useMemo<CommitteeGroup[] | null>(() => {
    const proposals = departmentProposalsQuery.data?.items ?? []
    if (!proposals.length) {
      return null
    }

    return proposals.map((proposal) => {
      const submitterName = formatPersonName(proposal.submitter) || proposal.submittedBy || "Unknown submitter"
      const groupName = proposal.projectGroup?.name?.trim() || submitterName || "Proposal"
      const titles = normalizeProposedTitles(proposal)
      const description = proposal.description?.trim() || "No description provided."
      const document = getProposalPdfDocument(proposal)
      const attachmentName = document?.originalName?.trim() || document?.key?.trim() || "proposal.pdf"

      return {
        id: proposal.id,
        name: groupName,
        forwardedBy: isProposalSubmitted(proposal.status) ? "Submitted" : `Status: ${String(proposal.status ?? "").trim() || "Unknown"}`,
        committeeMembers: 0,
        titles: titles.slice(0, 3).map((title, index) => ({
          id: `${proposal.id}:${index}`,
          name: title,
          description,
          attachment: attachmentName,
          votes: 0,
        })),
      }
    })
  }, [departmentProposalsQuery.data?.items])

  const groups = backendGroups ?? []
  const hasGroups = groups.length > 0

  const [selectedGroupId, setSelectedGroupId] = React.useState<string>("")
  const [selectedVoteByGroup, setSelectedVoteByGroup] = React.useState<Record<string, string | null>>({})
  const [rejectedByGroup, setRejectedByGroup] = React.useState<Record<string, string[]>>(() =>
    Object.fromEntries(groups.map((group) => [group.id, []]))
  )

  React.useEffect(() => {
    if (!groups.length) {
      setSelectedGroupId("")
      return
    }

    setSelectedGroupId((current) => {
      if (current && groups.some((group) => group.id === current)) {
        return current
      }
      return groups[0].id
    })

    setSelectedVoteByGroup((current) => {
      const next: Record<string, string | null> = { ...current }
      for (const group of groups) {
        if (!(group.id in next)) {
          next[group.id] = null
        }
      }
      return next
    })

    setRejectedByGroup((current) => {
      const next: Record<string, string[]> = { ...current }
      for (const group of groups) {
        if (!(group.id in next)) {
          next[group.id] = []
        }
      }
      return next
    })
  }, [groups])

  const selectedGroup = React.useMemo<CommitteeGroup | null>(() => {
    if (!groups.length) return null
    return groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null
  }, [groups, selectedGroupId])

  const selectedTitleId = selectedGroup ? selectedVoteByGroup[selectedGroup.id] : null
  const rejectedTitleIds = new Set(selectedGroup ? (rejectedByGroup[selectedGroup.id] ?? []) : [])

  const proposalDetailsQuery = useProjectProposalDetails({
    proposalId: selectedGroup?.id ?? null,
    enabled: Boolean(selectedGroup?.id),
  })

  const effectiveProposal = proposalDetailsQuery.data ?? null
  const effectiveStatus = effectiveProposal?.status ?? null
  const effectiveTitles = effectiveProposal ? normalizeProposedTitles(effectiveProposal) : selectedGroup?.titles.map((t) => t.name) ?? []
  const canVote = Boolean(effectiveProposal && isProposalSubmitted(effectiveStatus) && effectiveTitles.length === 3)

  const proposalSubmitterLabel = effectiveProposal ? (formatPersonName(effectiveProposal.submitter) || effectiveProposal.submittedBy || "-") : "-"
  const proposalSubmitterEmail = effectiveProposal?.submitter?.email?.trim() || ""
  const proposalAdvisorLabel = effectiveProposal ? (formatPersonName(effectiveProposal.advisor) || (effectiveProposal.advisorId ?? "")) : "-"
  const proposalAdvisorEmail = effectiveProposal?.advisor?.email?.trim() || ""
  const proposalGroupName = effectiveProposal?.projectGroup?.name?.trim() || selectedGroup?.name || "-"
  const proposalDepartmentName =
    effectiveProposal?.department?.name?.trim() ||
    (authUser?.department && typeof authUser.department === "object" ? String((authUser.department as { name?: string | null }).name ?? "").trim() : "") ||
    "-"
  const proposalSubmittedAt = effectiveProposal?.submittedAt ? formatTimestamp(effectiveProposal.submittedAt) : ""
  const proposalMemberCount = formatGroupMemberCount(effectiveProposal?.projectGroup)

  const voteMutation = useVoteProjectProposalTitle()

  const canViewVoteBreakdown = role === "coordinator" || role === "department_head"
  const titleVotesQuery = useProjectProposalTitleVotes({
    proposalId: canViewVoteBreakdown ? (selectedGroup?.id ?? null) : null,
    enabled: canViewVoteBreakdown && Boolean(selectedGroup?.id),
  })

  const voteCounts = titleVotesQuery.data?.counts ?? { "0": 0, "1": 0, "2": 0 }
  const totalVotes = (voteCounts["0"] ?? 0) + (voteCounts["1"] ?? 0) + (voteCounts["2"] ?? 0)

  const baseTitles = selectedGroup?.titles ?? []

  const voteRows: Array<CommitteeTitle & { percentage: number }> = !baseTitles.length
    ? []
    : !canViewVoteBreakdown
      ? baseTitles.map((title) => ({ ...title, votes: 0, percentage: 0 }))
      : baseTitles.map((title, index) => {
          const votes = voteCounts[String(index as 0 | 1 | 2) as "0" | "1" | "2"] ?? 0
          const percentage = Math.round((votes / Math.max(totalVotes, 1)) * 100)
          return { ...title, votes, percentage }
        })

  const leadingTitle = [...voteRows].sort((left, right) => right.votes - left.votes)[0] ?? voteRows[0]

  const handleVote = async (groupId: string, titleIndex: ProposalTitleIndex, titleId: string, titleName: string) => {
    const proposalId = selectedGroup?.id

    if (!proposalId) return

    if (!canVote) {
      toast.error("Voting is only available while the proposal is submitted.")
      return
    }

    setSelectedVoteByGroup((currentSelectedVotes) => ({
      ...currentSelectedVotes,
      [groupId]: titleId,
    }))

    try {
      await voteMutation.mutateAsync({
        proposalId,
        dto: { titleIndex },
      })
      toast.success(`Vote recorded for ${titleName}`)
    } catch (error) {
      toast.error("Unable to record vote", {
        description: error instanceof Error ? error.message : "Try again.",
      })
    }
  }

  const toggleReject = (groupId: string, titleId: string, titleName: string) => {
    setRejectedByGroup((currentRejected) => {
      const groupRejected = currentRejected[groupId] ?? []
      const alreadyRejected = groupRejected.includes(titleId)

      return {
        ...currentRejected,
        [groupId]: alreadyRejected
          ? groupRejected.filter((id) => id !== titleId)
          : [...groupRejected, titleId],
      }
    })

    toast.info(`${titleName} ${rejectedTitleIds.has(titleId) ? "restored" : "marked for review"}`)
  }

  const handleDownload = (attachment: string) => {
    const proposal = effectiveProposal
    const doc = proposal ? getProposalPdfDocument(proposal) : null
    const url = doc?.url

    if (url && typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer")
      return
    }

    toast.success(`Downloading ${attachment}`)
  }

  const handleDecision = (message: string) => {
    toast.success(message)
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm sm:p-8">
        <div className="absolute -right-10 top-4 h-28 w-28 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <Shield className="h-3.5 w-3.5" />
              DC Committee Workspace
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Review three titles from each student group in one clean workspace.
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Committee members inspect title names, descriptions, and proposal attachments, then vote before the coordinator finalizes a decision.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="w-full gap-2 sm:w-auto">
                <Link href={backHref}>
                  {backLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => handleDecision("Live review session prepared") }>
                <Sparkles className="h-4 w-4" />
                Start Review Session
              </Button>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 lg:grid-cols-2">
            {[
              { label: "Groups", value: departmentProposalsQuery.isLoading ? "…" : groups.length, icon: Users },
              { label: "Titles", value: selectedGroup?.titles.length ?? 0, icon: FileText },
              { label: "Votes", value: canViewVoteBreakdown ? totalVotes : "-", icon: BarChart3 },
              { label: "Status", value: effectiveProposal ? String(effectiveProposal.status ?? "-") : "-", icon: CheckCircle2 },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.label} className="border-border/60 bg-background/90 shadow-sm backdrop-blur">
                  <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground truncate">{item.label}</p>
                      <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold tracking-tight">{item.value}</p>
                    </div>
                    <div className="rounded-xl sm:rounded-2xl bg-primary/10 p-2 sm:p-3 text-primary shrink-0">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Group List</CardTitle>
            <CardDescription>Click a group to open its forwarded titles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!departmentId && (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                Your account has no department set, so proposals can’t be loaded.
              </div>
            )}

            {departmentId && departmentProposalsQuery.isLoading && (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                Loading proposals…
              </div>
            )}

            {departmentId && departmentProposalsQuery.isError && (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                Failed to load proposals. {departmentProposalsQuery.error?.message ?? ""}
              </div>
            )}

            {departmentId && !departmentProposalsQuery.isLoading && !departmentProposalsQuery.isError && !hasGroups && (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                No submitted proposals found for your department.
              </div>
            )}

            {groups.map((group) => {
              const isActive = group.id === selectedGroupId

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                    isActive
                      ? "border-primary/30 bg-primary/10 shadow-sm"
                      : "border-border/70 bg-background hover:border-primary/20 hover:bg-muted/40"
                  )}
                >
                  <div>
                    <p className="font-semibold">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.forwardedBy}</p>
                  </div>
                  <Badge variant={isActive ? "default" : "outline"}>{group.titles.length} titles</Badge>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Titles Section</CardTitle>
                <CardDescription>
                  {selectedGroup?.name
                    ? `${selectedGroup?.name} is ready for title review, discussion, and voting.`
                    : "Select a proposal from the list to start reviewing."
                  }
                </CardDescription>
              </div>
              {selectedGroup?.forwardedBy ? (
                <Badge variant="secondary" className="w-fit">{selectedGroup?.forwardedBy}</Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {effectiveProposal && (
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Proposal Details</p>
                    <p className="mt-1 text-sm font-semibold">{proposalGroupName}</p>
                  </div>
                  <Badge variant={isProposalSubmitted(effectiveStatus) ? "default" : "secondary"} className="w-fit">
                    {String(effectiveStatus ?? "-")}
                  </Badge>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Submitter</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{proposalSubmitterLabel}</span>
                    </p>
                    {proposalSubmitterEmail && <p className="text-xs text-muted-foreground truncate">{proposalSubmitterEmail}</p>}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Advisor</p>
                    <p className="text-sm font-medium truncate">{proposalAdvisorLabel || "-"}</p>
                    {proposalAdvisorEmail && <p className="text-xs text-muted-foreground truncate">{proposalAdvisorEmail}</p>}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm font-medium truncate">{proposalDepartmentName}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Group Members</p>
                    <p className="text-sm font-medium">{proposalMemberCount}</p>
                    {proposalSubmittedAt && <p className="text-xs text-muted-foreground">Submitted {proposalSubmittedAt}</p>}
                  </div>
                </div>
              </div>
            )}

            {!selectedGroup && (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                No proposal selected.
              </div>
            )}

            {(selectedGroup?.titles ?? []).map((title, index) => {
              const voteInfo = voteRows.find((row) => row.id === title.id)
              const isRejected = rejectedTitleIds.has(title.id)
              const isSelected = selectedTitleId === title.id

              return (
                <details key={title.id} open={index === 0} className="group rounded-2xl border border-border/70 bg-card/80 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{title.name}</p>
                        {isSelected && <Badge className="bg-primary text-primary-foreground">Selected</Badge>}
                        {isRejected && <Badge variant="destructive">Rejected</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Title {index + 1} • Click to expand details</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {canViewVoteBreakdown && (
                        <span className="font-semibold text-foreground">{voteInfo?.votes ?? 0}</span>
                      )}
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    </div>
                  </summary>
                  <div className="space-y-4 border-t border-border/60 px-4 pb-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
                      <div className="space-y-3">
                        <div className="rounded-2xl bg-muted/40 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                          <p className="mt-2 text-sm leading-6 text-foreground">{title.description}</p>
                        </div>
                        <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-primary/10 p-2 text-primary">
                              <Paperclip className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Attached proposal file</p>
                              <p className="truncate text-sm font-semibold">{title.attachment}</p>
                            </div>
                            <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleDownload(title.attachment)} aria-label={`Download ${title.attachment}`}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {canViewVoteBreakdown && (
                          <div className="rounded-2xl border border-border/70 bg-background p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vote Summary</p>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-sm font-semibold">Votes</span>
                              <span className="text-sm text-muted-foreground">{voteInfo?.votes ?? 0} / {Math.max(totalVotes, 1)}</span>
                            </div>
                            <Progress value={voteInfo?.percentage ?? 0} className="mt-3 h-2" />
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                              <span>Share of votes</span>
                              <span>{voteInfo?.percentage ?? 0}%</span>
                            </div>
                          </div>
                        )}

                        <div className="grid gap-2 sm:grid-cols-3">
                          <Button
                            onClick={() => {
                              if (!selectedGroup) return
                              handleVote(selectedGroup.id, index as ProposalTitleIndex, title.id, title.name)
                            }}
                            className="gap-2"
                            disabled={!canVote || voteMutation.isPending || !selectedGroup}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Select
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (!selectedGroup) return
                              toggleReject(selectedGroup.id, title.id, title.name)
                            }}
                            className="gap-2"
                            disabled={!selectedGroup}
                          >
                            <ThumbsDown className="h-4 w-4" />
                            Reject
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Comment
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Add a Comment</DialogTitle>
                                <DialogDescription>
                                  Leave a note for the committee regarding <strong>{title.name}</strong>.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-2">
                                <Textarea 
                                  placeholder="Type your comment associated with this title here..." 
                                  className="min-h-[120px] resize-none"
                                />
                              </div>
                              <DialogFooter>
                                <DialogTrigger asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogTrigger>
                                <DialogTrigger asChild>
                                  <Button onClick={() => {
                                    toast.success(`Comment successfully added to ${title.name}`)
                                    // Also sync chat if needed, but simple toast is perfectly fine 
                                  }}>
                                    Post Comment
                                  </Button>
                                </DialogTrigger>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              )
            })}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
          {canViewVoteBreakdown && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Voting Progress</CardTitle>
                <CardDescription>Percentages represent share of votes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {voteRows.map((row) => (
                  <div key={row.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{row.name}</span>
                      <span className="whitespace-nowrap text-muted-foreground">{row.votes} votes • {row.percentage}%</span>
                    </div>
                    <Progress value={row.percentage} className="h-2" />
                  </div>
                ))}
                <Separator />
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Leading Title</p>
                  <p className="mt-2 text-sm font-semibold">{leadingTitle?.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{leadingTitle?.votes} votes out of {Math.max(totalVotes, 1)} total votes</p>
                </div>
              </CardContent>
            </Card>
          )}

          {role === "coordinator" && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Coordinator Control Panel</CardTitle>
                <CardDescription>Approve one title, reject all titles, or request revision.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current decision focus</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{leadingTitle?.name}</p>
                      <p className="text-xs text-muted-foreground">Most supported title in the selected group</p>
                    </div>
                    <Badge>{leadingTitle?.percentage}%</Badge>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button asChild className="gap-2">
                    <Link href="/dashboard/coordinator/title-management">
                      <CheckCircle2 className="h-4 w-4" />
                      Approve Selected Title
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="gap-2">
                    <Link href="/dashboard/coordinator/title-management">
                      <ThumbsDown className="h-4 w-4" />
                      Reject All Titles
                    </Link>
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="gap-2 sm:col-span-2">
                        <MessageSquare className="h-4 w-4" />
                        Request Revision
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Request Revision</DialogTitle>
                        <DialogDescription>
                          Send committee feedback to <strong>{selectedGroup?.name ?? "this group"}</strong> requesting targeted revisions before approval.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-2">
                        <Textarea 
                          placeholder="Summarize what revisions need to be made by the group..." 
                          className="min-h-[120px] resize-none"
                        />
                      </div>
                      <DialogFooter>
                        <DialogTrigger asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogTrigger>
                        <DialogTrigger asChild>
                          <Button onClick={() => handleDecision("Revision requested with committee feedback") }>
                            Send Request
                          </Button>
                        </DialogTrigger>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground">
                  Option 1: approve one title. Option 2: reject all titles. Option 3: request revision and ask the group to submit new titles.
                </div>
              </CardContent>
            </Card>
          )}
      </section>
    </div>
  )
}
