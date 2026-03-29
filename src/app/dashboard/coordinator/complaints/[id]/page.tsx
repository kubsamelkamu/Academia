"use client"

import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle } from "lucide-react"
import { mockComplaints, Complaint } from "@/data/mockData"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/data/mockData"

export default function ComplaintDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const complaintId = params.id as string
  const complaint = mockComplaints.find((c: Complaint) => c.id === complaintId)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [status, setStatus] = useState(complaint?.status || "open")

  if (!complaint) {
    return (
      <div className="p-8 text-center text-destructive font-bold">Complaint not found.</div>
    )
  }

  const handleApprove = () => {
    setStatus("resolved")
    toast("Complaint approved and resolved.")
    router.push("/dashboard/coordinator/complaints")
  }

  const handleReject = () => {
    setStatus("rejected")
    toast("Complaint rejected.")
    router.push("/dashboard/coordinator/complaints")
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Complaint Detail</CardTitle>
          <CardDescription>Review and take action on this complaint.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:gap-8 gap-4">
            <div>
              <Label className="text-muted-foreground">Student</Label>
              <div className="font-semibold">{complaint.studentName}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Target</Label>
              <Badge variant="outline" className="capitalize">{complaint.targetType}</Badge>
              <div className="font-semibold">{complaint.targetName}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Badge>{status}</Badge>
            </div>
          </div>
          <div>
            <Label className="font-medium">Complaint Details</Label>
            <div className="p-4 border rounded-lg bg-muted/30 mt-2">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{complaint.reason}</p>
            </div>
          </div>
          <div className="flex gap-8">
            <div>
              <Label className="text-muted-foreground">Submitted</Label>
              <div>{formatDate(complaint.submittedAt)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Updated</Label>
              <div>{formatDate(complaint.updatedAt)}</div>
            </div>
          </div>
          <div>
            <Label>Resolution Notes (Optional)</Label>
            <Textarea
              placeholder="Document your decision and actions taken..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button className="flex-1 bg-gradient-to-r from-success to-success/80 hover:from-success/90" onClick={handleApprove}>
              <CheckCircle className="mr-2 h-4 w-4" /> Approve
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90" onClick={handleReject}>
              <XCircle className="mr-2 h-4 w-4" /> Reject
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => router.push("/dashboard/coordinator/complaints")}>Back</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
