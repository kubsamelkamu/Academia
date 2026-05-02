"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DashboardEmptyState, DashboardSectionCard } from "@/components/dashboard/page-primitives"
import { useAuthStore } from "@/store/auth-store"
import { useMilestoneTemplatesList } from "@/lib/hooks/use-milestone-templates"
import { useMilestoneTemplatesStore } from "@/store/milestone-templates-store"
import { EditMilestoneTemplateDialog } from "@/components/dashboard/department-head/edit-milestone-template-dialog"
import type { MilestoneTemplateMilestone } from "@/types/milestone-templates"

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

function formatMilestoneSequences(milestones: MilestoneTemplateMilestone[] | null | undefined): string {
  if (!milestones?.length) return "—"
  const sequences = milestones
    .map((m) => m.sequence)
    .filter((seq): seq is number => Number.isFinite(seq))
    .slice()
    .sort((a, b) => a - b)

  return sequences.length ? sequences.join(" • ") : "—"
}

export function MilestoneTemplatesSection() {
  const departmentId = useAuthStore((s) => s.user?.departmentId)

  const page = useMilestoneTemplatesStore((s) => s.page)
  const limit = useMilestoneTemplatesStore((s) => s.limit)
  const search = useMilestoneTemplatesStore((s) => s.search)
  const isActive = useMilestoneTemplatesStore((s) => s.isActive)
  const setPage = useMilestoneTemplatesStore((s) => s.setPage)
  const setLimit = useMilestoneTemplatesStore((s) => s.setLimit)
  const setSearch = useMilestoneTemplatesStore((s) => s.setSearch)
  const setIsActive = useMilestoneTemplatesStore((s) => s.setIsActive)
  const reset = useMilestoneTemplatesStore((s) => s.reset)

  const params = useMemo(
    () => ({
      page,
      limit,
      search: search.trim().length ? search.trim() : undefined,
      isActive: isActive === null ? undefined : isActive,
    }),
    [page, limit, search, isActive]
  )

  const query = useMilestoneTemplatesList(departmentId, params)

  return (
    <DashboardSectionCard
      title="Milestone Templates"
      description="Create and manage reusable schedule templates for departmental projects."
    >
      {!departmentId ? (
        <DashboardEmptyState
          title="No department assigned"
          description="You must be assigned to a department to manage milestone templates."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by template name"
                className="sm:max-w-sm"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={isActive === null ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setIsActive(null)}
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant={isActive === true ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setIsActive(true)}
                >
                  Active
                </Button>
                <Button
                  type="button"
                  variant={isActive === false ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setIsActive(false)}
                >
                  Inactive
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={reset}>
                  Reset
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLimit(limit === 10 ? 20 : 10)}
              >
                Limit: {limit}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => query.refetch()}
                disabled={query.isFetching}
              >
                Refresh
              </Button>
            </div>
          </div>

          {query.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading templates…</div>
          ) : query.isError ? (
            <div className="text-sm text-destructive">{query.error.message}</div>
          ) : !query.data?.templates?.length ? (
            <DashboardEmptyState
              title="No templates found"
              description="Try changing filters or create a new template."
            />
          ) : (
            <div className="space-y-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Milestones</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.templates.map((tpl) => (
                    <TableRow key={tpl.templateId}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{tpl.name}</p>
                          {tpl.description ? (
                            <p className="text-xs text-muted-foreground">{tpl.description}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tpl.isActive ? "secondary" : "outline"}>
                          {tpl.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatMilestoneSequences(tpl.milestones)}</TableCell>
                      <TableCell>{tpl.usageCount ?? 0}</TableCell>
                      <TableCell>{formatDate(tpl.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <EditMilestoneTemplateDialog template={tpl} onUpdated={() => query.refetch()} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Page {query.data.pagination.page} of {query.data.pagination.pages} • {query.data.pagination.total} total
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= query.data.pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardSectionCard>
  )
}
