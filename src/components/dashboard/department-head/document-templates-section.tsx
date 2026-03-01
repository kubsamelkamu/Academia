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
import { AddDocumentTemplateFilesDialog } from "@/components/dashboard/department-head/add-document-template-files-dialog"
import { CreateDocumentTemplateDialog } from "@/components/dashboard/department-head/create-document-template-dialog"
import { DeleteDocumentTemplateDialog } from "@/components/dashboard/department-head/delete-document-template-dialog"
import { EditDocumentTemplateDialog } from "@/components/dashboard/department-head/edit-document-template-dialog"
import { ManageDocumentTemplateFilesDialog } from "@/components/dashboard/department-head/manage-document-template-files-dialog"
import { ReplaceDocumentTemplateFilesDialog } from "@/components/dashboard/department-head/replace-document-template-files-dialog"
import { useAuthStore } from "@/store/auth-store"
import { useDocumentTemplatesList } from "@/lib/hooks/use-document-templates"
import { useDocumentTemplatesStore } from "@/store/document-templates-store"
import type { DocumentTemplateType } from "@/types/document-templates"

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

const types: Array<{ label: string; value: DocumentTemplateType | null }> = [
  { label: "All", value: null },
  { label: "SRS", value: "SRS" },
  { label: "SDD", value: "SDD" },
  { label: "REPORT", value: "REPORT" },
  { label: "OTHER", value: "OTHER" },
]

export function DocumentTemplatesSection() {
  const departmentId = useAuthStore((s) => s.user?.departmentId)

  const page = useDocumentTemplatesStore((s) => s.page)
  const limit = useDocumentTemplatesStore((s) => s.limit)
  const search = useDocumentTemplatesStore((s) => s.search)
  const type = useDocumentTemplatesStore((s) => s.type)
  const isActive = useDocumentTemplatesStore((s) => s.isActive)
  const setPage = useDocumentTemplatesStore((s) => s.setPage)
  const setLimit = useDocumentTemplatesStore((s) => s.setLimit)
  const setSearch = useDocumentTemplatesStore((s) => s.setSearch)
  const setType = useDocumentTemplatesStore((s) => s.setType)
  const setIsActive = useDocumentTemplatesStore((s) => s.setIsActive)
  const reset = useDocumentTemplatesStore((s) => s.reset)

  const params = useMemo(
    () => ({
      page,
      limit,
      search: search.trim().length ? search.trim() : undefined,
      type: type ?? undefined,
      isActive: isActive === null ? undefined : isActive,
    }),
    [page, limit, search, type, isActive]
  )

  const query = useDocumentTemplatesList(departmentId, params)

  return (
    <DashboardSectionCard
      title="Department Document Templates"
      description="Manage downloadable document templates (SRS/SDD/Report) for your department."
    >
      {!departmentId ? (
        <DashboardEmptyState
          title="No department assigned"
          description="You must be assigned to a department to manage document templates."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title"
                  className="sm:max-w-sm"
                />

                <div className="flex flex-wrap items-center gap-2">
                  {types.map((t) => (
                    <Button
                      key={t.label}
                      type="button"
                      size="sm"
                      variant={type === t.value ? "secondary" : "outline"}
                      onClick={() => setType(t.value)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

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
              <CreateDocumentTemplateDialog />
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
              description="Try changing filters or upload a new template."
            />
          ) : (
            <div className="space-y-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.templates.map((tpl) => {
                    const firstFile = tpl.files?.[0]

                    return (
                      <TableRow key={tpl.templateId}>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{tpl.title}</p>
                            {tpl.description ? (
                              <p className="text-xs text-muted-foreground">{tpl.description}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tpl.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tpl.isActive ? "secondary" : "outline"}>
                            {tpl.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ManageDocumentTemplateFilesDialog
                            templateId={tpl.templateId}
                            templateTitle={tpl.title}
                            triggerLabel={`${tpl.files?.length ?? 0}`}
                            initialFiles={tpl.files}
                          />
                        </TableCell>
                        <TableCell>{formatDate(tpl.updatedAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            {firstFile?.url ? (
                              <Button asChild type="button" size="sm" variant="outline">
                                <a href={firstFile.url} target="_blank" rel="noreferrer">
                                  Open
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}

                            <AddDocumentTemplateFilesDialog
                              templateId={tpl.templateId}
                              templateTitle={tpl.title}
                            />

                            <ReplaceDocumentTemplateFilesDialog
                              templateId={tpl.templateId}
                              templateTitle={tpl.title}
                            />

                            <EditDocumentTemplateDialog template={tpl} />

                            <DeleteDocumentTemplateDialog
                              templateId={tpl.templateId}
                              templateTitle={tpl.title}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
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
