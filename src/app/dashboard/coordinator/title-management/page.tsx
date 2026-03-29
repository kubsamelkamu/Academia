"use client"

import React, { useMemo, useState } from "react"
import DataTable, { Column } from "@/components/shared/DataTable"
import StatusBadge from "@/components/shared/StatusBadge"
import { DashboardPageHeader, DashboardSectionCard } from "@/components/dashboard/page-primitives"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  XCircle,
  CheckCircle,
  Eye,
  Download,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

type TitleStatus = "pending" | "approved" | "rejected"

interface ProjectTitle {
  id: string
  title: string
  description: string
  groupId: string
  submittedAt: string
  status: TitleStatus
}

const initialProjectTitles: ProjectTitle[] = [
  {
    id: "t1",
    title: "AI-Based Student Experience Analyzer",
    description: "Title proposal for a predictive student engagement system using NLP and behavior streams.",
    groupId: "g1",
    submittedAt: "2025-03-10",
    status: "pending",
  },
  {
    id: "t2",
    title: "Campus Energy Monitoring Dashboard",
    description: "A real-time dashboard to visualize campus energy consumption and drive sustainability.",
    groupId: "g2",
    submittedAt: "2025-03-09",
    status: "approved",
  },
  {
    id: "t3",
    title: "Secure Research Discussion Portal",
    description: "A collaborative platform for research teams with secure access controls and versioning.",
    groupId: "g3",
    submittedAt: "2025-03-08",
    status: "rejected",
  },
]

export default function CoordinatorTitleManagementPage() {
  const [titles, setTitles] = useState<ProjectTitle[]>(initialProjectTitles)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"pending" | "sent" | "all">("pending")
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState<ProjectTitle | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const filteredTitles = useMemo(() => {
    const byStatus =
      activeTab === "all"
        ? titles
        : titles.filter((t) => (activeTab === "pending" ? t.status === "pending" : t.status !== "pending"))

    if (!searchTerm.trim()) return byStatus

    const query = searchTerm.toLowerCase()
    return byStatus.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.groupId.toLowerCase().includes(query)
    )
  }, [titles, activeTab, searchTerm])

  const pendingCount = titles.filter((t) => t.status === "pending").length
  const sentCount = titles.filter((t) => t.status !== "pending").length

  const handleValidateAndSend = (title: ProjectTitle) => {
    setTitles((current) =>
      current.map((item) =>
        item.id === title.id ? { ...item, status: "approved" as TitleStatus } : item
      )
    )
    toast.success("Title forwarded to DC Committee", {
      description: `"${title.title}" is now in review by the DC committee.`,
    })
  }

  const handleRejectTitle = (title: ProjectTitle) => {
    setSelectedTitle(title)
    setRejectReason("")
    setRejectDialogOpen(true)
  }

  const handleDownloadTitle = (title: ProjectTitle) => {
    // Download as JSON for demo; can be changed to PDF/CSV as needed
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(title, null, 2))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute("href", dataStr)
    dlAnchor.setAttribute("download", `${title.title.replace(/\s+/g, '_')}_info.json`)
    document.body.appendChild(dlAnchor)
    dlAnchor.click()
    dlAnchor.remove()
    toast.success("Title info downloaded")
  }

  const handleConfirmReject = () => {
    if (!selectedTitle || !rejectReason.trim()) return

    setTitles((current) =>
      current.map((item) =>
        item.id === selectedTitle.id ? { ...item, status: "rejected" as TitleStatus } : item
      )
    )
    toast.error("Title rejected", {
      description: `"${selectedTitle.title}" rejected: ${rejectReason}`,
    })
    setRejectDialogOpen(false)
    setSelectedTitle(null)
    setRejectReason("")
  }

  const columns: Column<ProjectTitle>[] = [
    {
      key: "title",
      header: "Project Title",
      render: (t) => (
        <div className="max-w-md">
          <p className="font-semibold truncate">{t.title}</p>
          <p className="text-sm text-muted-foreground truncate">{t.description}</p>
        </div>
      ),
    },
    {
      key: "group",
      header: "Group",
      render: (t) => <Badge variant="outline">Group {t.groupId.replace("g", "")}</Badge>,
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (t) => new Date(t.submittedAt).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (t) => (
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/coordinator/title-management/${t.id}`} passHref legacyBehavior>
            <Button asChild size="sm" variant="outline">
              <span><Eye className="mr-1 h-3 w-3" />View Detail</span>
            </Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={() => handleDownloadTitle(t)}>
            <Download className="mr-1 h-3 w-3" />
            Download
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-surface-secondary/60 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <DashboardPageHeader
          title="Title Management"
          description="Review and route student project titles for DC committee approval."
          actions={
            <Button onClick={() => toast.success("Title management refreshed")}>Refresh</Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <DashboardSectionCard title="Pending" description="Awaiting validation">
            <p className="text-3xl font-semibold">{pendingCount}</p>
          </DashboardSectionCard>
          <DashboardSectionCard title="Sent to DC" description="Approved/rejected titles">
            <p className="text-3xl font-semibold">{sentCount}</p>
          </DashboardSectionCard>
          <DashboardSectionCard title="Total" description="Entries in the table">
            <p className="text-3xl font-semibold">{titles.length}</p>
          </DashboardSectionCard>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Title queue</CardTitle>
              <CardDescription>Filter, search and take action on incoming project titles.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search project title or group"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-72"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "pending" | "sent" | "all")}> 
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="p-0">
                <div className="p-4">
                  <DataTable data={filteredTitles} columns={columns} />
                </div>
              </TabsContent>

              <TabsContent value="sent" className="p-0">
                <div className="p-4">
                  <DataTable
                    data={filteredTitles}
                    columns={columns}
                  />
                </div>
              </TabsContent>

              <TabsContent value="all" className="p-0">
                <div className="p-4">
                  <DataTable data={filteredTitles} columns={columns} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Project Title Details</DialogTitle>
              <DialogDescription>
                Review the full details and take action on this project title.
              </DialogDescription>
            </DialogHeader>
            {selectedTitle && (
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <p className="font-semibold text-lg mt-1">{selectedTitle.title}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-muted-foreground mt-1">{selectedTitle.description}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <Label>Group</Label>
                    <p>Group {selectedTitle.groupId.replace("g", "")}</p>
                  </div>
                  <div>
                    <Label>Submitted</Label>
                    <p>{new Date(selectedTitle.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <StatusBadge status={selectedTitle.status} />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              {selectedTitle && selectedTitle.status === "pending" && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => {
                    setTitles((current) =>
                      current.map((item) =>
                        item.id === selectedTitle.id ? { ...item, status: "approved" as TitleStatus } : item
                      )
                    )
                    toast.success("Title approved", {
                      description: `"${selectedTitle.title}" approved at coordinator level.`,
                    })
                    setDetailDialogOpen(false)
                  }}>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => {
                    setDetailDialogOpen(false)
                    handleRejectTitle(selectedTitle)
                  }}>
                    <XCircle className="mr-1 h-3 w-3" />
                    Reject
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    handleValidateAndSend(selectedTitle)
                    setDetailDialogOpen(false)
                  }}>
                    <Send className="mr-1 h-3 w-3" />
                    Send to DC
                  </Button>
                </>
              )}
              {selectedTitle && selectedTitle.status !== "pending" && (
                <Button size="sm" variant="outline" disabled>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {selectedTitle.status === "approved" ? "Approved" : "Rejected"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Reject Project Title</DialogTitle>
              <DialogDescription>
                Provide an explanation for rejecting &quot;{selectedTitle?.title}&quot;. This will notify the student.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="reject-reason">Rejection reason</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Enter reasoning for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmReject} disabled={!rejectReason.trim()}>
                Confirm Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
