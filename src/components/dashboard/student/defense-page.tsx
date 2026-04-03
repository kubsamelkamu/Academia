"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Lightbulb,
  MessageSquare,
  Upload,
  Users,
} from "lucide-react"
import { toast } from "sonner"

type MaterialStatus = "approved" | "pending" | "rejected"

interface DefenseMaterial {
  id: number
  name: string
  size: string
  uploadedAt: string
  status: MaterialStatus
  feedback: string
}

interface ChecklistItem {
  id: number
  item: string
  category: "Materials" | "Logistics" | "Preparation" | "Personal"
  deadline: string
  completed: boolean
}

const defenseData = {
  scheduledDate: "2026-04-15T14:00:00",
  duration: "45 minutes",
  venue: "Conference Hall B",
  committee: [
    { id: 1, name: "Dr. Sarah Johnson", role: "Chair", department: "Computer Science" },
    { id: 2, name: "Prof. Michael Chen", role: "Advisor", department: "Software Engineering" },
    { id: 3, name: "Dr. Emily Williams", role: "Examiner", department: "Information Systems" },
  ],
  materials: [
    {
      id: 1,
      name: "Final Presentation Slides.pptx",
      size: "8.2 MB",
      uploadedAt: "2026-04-08",
      status: "approved",
      feedback: "Great structure. Keep slide text concise during delivery.",
    },
    {
      id: 2,
      name: "Project Demo Video.mp4",
      size: "45.6 MB",
      uploadedAt: "2026-04-09",
      status: "pending",
      feedback: "Under review by advisor.",
    },
    {
      id: 3,
      name: "Executive Summary.pdf",
      size: "1.3 MB",
      uploadedAt: "2026-04-10",
      status: "rejected",
      feedback: "Please add measurable results and comparison table.",
    },
  ] as DefenseMaterial[],
  checklist: [
    { id: 1, item: "Presentation slides finalized", category: "Materials", deadline: "2026-04-10", completed: true },
    { id: 2, item: "Demo video uploaded", category: "Materials", deadline: "2026-04-11", completed: false },
    { id: 3, item: "Venue and projector confirmed", category: "Logistics", deadline: "2026-04-12", completed: true },
    { id: 4, item: "Practice Q&A session with advisor", category: "Preparation", deadline: "2026-04-13", completed: false },
    { id: 5, item: "Backup copy on USB and cloud", category: "Personal", deadline: "2026-04-14", completed: false },
  ] as ChecklistItem[],
  tips: [
    "Dress professionally and neatly to create a positive first impression.",
    "Arrive at least 30 minutes early and test all equipment.",
    "Maintain confident posture and make eye contact with the audience.",
    "Explain the problem and outcomes before going into technical details.",
    "Listen carefully to questions from the examiners before answering.",
    "Answer questions directly and confidently, then add more detail if necessary.",
    "Manage your time carefully to finish within the allocated presentation time.",
  ],
}

const statusStyles: Record<MaterialStatus, string> = {
  approved: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function getDaysUntil(dateString: string): number {
  const now = new Date()
  const target = new Date(dateString)
  if (Number.isNaN(target.getTime())) return 0
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function StudentDefensePage() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defenseData.checklist)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<DefenseMaterial | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [reply, setReply] = useState("")

  const daysUntil = getDaysUntil(defenseData.scheduledDate)
  const preparationProgress = useMemo(() => {
    const completed = checklist.filter((item) => item.completed).length
    return Math.round((completed / checklist.length) * 100)
  }, [checklist])

  const approvedMaterials = defenseData.materials.filter((m) => m.status === "approved").length

  const toggleChecklistItem = (id: number) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Final Defense
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prepare your materials, track readiness, and stay aligned with defense requirements.
          </p>
        </div>

        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Upload Defense Material</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="material-type">Material Type</Label>
                <select id="material-type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option>Presentation Slides</option>
                  <option>Demo Video</option>
                  <option>Executive Summary</option>
                  <option>Supporting Document</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-file">File</Label>
                <Input id="material-file" type="file" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-notes">Notes (Optional)</Label>
                <Textarea id="material-notes" placeholder="Any context for your advisor..." />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setUploadOpen(false)
                  toast.success("Material uploaded successfully")
                }}
              >
                Submit Material
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Days Until Defense</p>
            <p className="text-3xl font-bold">{daysUntil}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Preparation Progress</p>
            <p className="text-3xl font-bold">{preparationProgress}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Approved Materials</p>
            <p className="text-3xl font-bold">{approvedMaterials}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Committee Members</p>
            <p className="text-3xl font-bold">{defenseData.committee.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full max-w-3xl grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="guide">Tips & Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Defense Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium">{new Date(defenseData.scheduledDate).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{defenseData.duration}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Venue</p>
                <p className="font-medium">{defenseData.venue}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Overall completion</span>
                  <span className="font-medium">{preparationProgress}%</span>
                </div>
                <Progress value={preparationProgress} className="h-2.5" />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{checklist.filter((i) => i.completed).length} of {checklist.length} checklist items completed.</p>
              </div>
              <div className="pt-1">
                <Button variant="outline" className="w-full" onClick={() => toast.message("Calendar invite feature coming soon")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Add Defense to Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Presentation Materials</CardTitle>
              <CardDescription>Upload and monitor advisor feedback for each item.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {defenseData.materials.map((material) => (
                <div key={material.id} className="rounded-lg border p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{material.name}</p>
                        <Badge className={statusStyles[material.status]}>{material.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {material.size} • Uploaded {formatDate(material.uploadedAt)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{material.feedback}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedMaterial(material)
                        setFeedbackOpen(true)
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => toast.message("Preview coming soon")}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => toast.success("Download started")}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>Defense Checklist</CardTitle>
              <CardDescription>Track your preparation items before defense day.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(["Materials", "Logistics", "Preparation", "Personal"] as const).map((category) => (
                <div key={category}>
                  <p className="text-sm font-medium mb-2">{category}</p>
                  <div className="space-y-2">
                    {checklist
                      .filter((item) => item.category === category)
                      .map((item) => (
                        <button
                          key={item.id}
                          className={`w-full rounded-lg border p-3 flex items-center justify-between text-left ${
                            item.completed ? "bg-green-50 border-green-200" : "bg-muted/30"
                          }`}
                          onClick={() => toggleChecklistItem(item.id)}
                        >
                          <div className="flex items-center gap-3">
                            {item.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock3 className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                              {item.item}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(item.deadline)}</span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Defense Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {defenseData.tips.map((tip, index) => (
                  <div key={index} className="rounded-lg border p-3 text-sm">
                    {tip}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Committee
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {defenseData.committee.map((member) => (
                  <div key={member.id} className="rounded-lg border p-3">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role} • {member.department}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-primary" />
              Material Feedback
            </DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="font-medium">{selectedMaterial.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedMaterial.feedback}</p>
              </div>
              <ScrollArea className="max-h-[180px]">
                <div className="space-y-2">
                  <Label htmlFor="feedback-reply">Reply to Advisor</Label>
                  <Textarea
                    id="feedback-reply"
                    placeholder="Write your response..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (!reply.trim()) return
                    toast.success("Reply sent")
                    setReply("")
                    setFeedbackOpen(false)
                  }}
                >
                  Send Reply
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setFeedbackOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {daysUntil <= 3 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Defense is very close</p>
              <p className="text-sm text-amber-700">Run a full rehearsal and verify all materials and backups today.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StudentDefensePage
