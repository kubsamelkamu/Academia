"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

// This should be moved to a shared location if needed elsewhere
const initialProjectTitles = [
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

type TitleStatus = "pending" | "approved" | "rejected"

export default function TitleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [rejectReason, setRejectReason] = useState("")
  const [status, setStatus] = useState<TitleStatus | null>(null)
  const titleId = params.id as string
  const projectTitle = initialProjectTitles.find((t) => t.id === titleId)

  if (!projectTitle) {
    return <div className="p-8 text-center text-destructive font-bold">Title not found.</div>
  }

  const handleApprove = () => {
    setStatus("approved")
    toast.success("Title approved.")
    router.push("/dashboard/coordinator/title-management")
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection.")
      return
    }
    setStatus("rejected")
    toast.error("Title rejected.")
    router.push("/dashboard/coordinator/title-management")
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Project Title Detail</CardTitle>
          <CardDescription>Review and take action on this project title.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:gap-8 gap-4">
            <div>
              <Label className="text-muted-foreground">Title</Label>
              <div className="font-semibold">{projectTitle.title}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Group</Label>
              <Badge variant="outline">Group {projectTitle.groupId.replace("g", "")}</Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Badge>{status || projectTitle.status}</Badge>
            </div>
          </div>
          <div>
            <Label className="font-medium">Description</Label>
            <div className="p-4 border rounded-lg bg-muted/30 mt-2">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{projectTitle.description}</p>
            </div>
          </div>
          <div className="flex gap-8">
            <div>
              <Label className="text-muted-foreground">Submitted</Label>
              <div>{new Date(projectTitle.submittedAt).toLocaleDateString()}</div>
            </div>
          </div>
          {status === "rejected" ? (
            <div className="space-y-4">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleReject}>Confirm Reject</Button>
                <Button variant="outline" onClick={() => setStatus(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button className="flex-1 bg-gradient-to-r from-success to-success/80 hover:from-success/90" onClick={handleApprove}>
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90" onClick={() => setStatus("rejected") }>
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => router.push("/dashboard/coordinator/title-management")}>Back</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
