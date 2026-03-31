"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  Calendar,
  DollarSign,
  FolderOpen,
  Info,
  Tag,
  Users,
} from "lucide-react"
import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { DashboardBackLink } from "@/components/dashboard/dashboard-back"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  "Artificial Intelligence",
  "Blockchain",
  "IoT",
  "VR/AR",
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Cybersecurity",
  "Cloud Computing",
  "EdTech",
  "Healthcare",
  "Other",
]

const DEPARTMENTS = [
  "Computer Science",
  "Data Science",
  "Software Engineering",
  "Information Systems",
  "Cybersecurity",
]

const ADVISORS = [
  "Dr. Sarah Johnson",
  "Prof. Michael Chen",
  "Dr. Emily Rodriguez",
  "Prof. David Kim",
  "Dr. Lisa Thompson",
]

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  )
}

export function ProjectsNewPage() {
  const [title, setTitle]           = useState("")
  const [groupName, setGroupName]   = useState("")
  const [advisorName, setAdvisor]   = useState("")
  const [department, setDept]       = useState("")
  const [category, setCategory]     = useState("")
  const [description, setDesc]      = useState("")
  const [startDate, setStart]       = useState("")
  const [dueDate, setDue]           = useState("")
  const [budget, setBudget]         = useState("")
  const [techInput, setTechInput]   = useState("")
  const [technologies, setTechs]    = useState<string[]>([])
  const [errors, setErrors]         = useState<Record<string, string>>({})

  const addTech = () => {
    const t = techInput.trim()
    if (t && !technologies.includes(t)) {
      setTechs((prev) => [...prev, t])
      setTechInput("")
    }
  }

  const removeTech = (t: string) => setTechs((prev) => prev.filter((x) => x !== t))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim())      e.title      = "Project title is required"
    if (!groupName.trim())  e.groupName  = "Group name is required"
    if (!advisorName)       e.advisorName = "Please select an advisor"
    if (!department)        e.department  = "Please select a department"
    if (!category)          e.category    = "Please select a category"
    if (!startDate)         e.startDate   = "Start date is required"
    if (!dueDate)           e.dueDate     = "Due date is required"
    if (startDate && dueDate && startDate >= dueDate)
      e.dueDate = "Due date must be after start date"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    toast.success("Project created", {
      description: `"${title}" has been created and is now active.`,
    })
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="New Project"
        description="Create a new department project with full details"
        actions={<DashboardBackLink href="/dashboard/department-head/projects" variant="outline" />}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Section 1: Basic Info ─────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Project Information
            </CardTitle>
            <CardDescription>Enter the core details of the project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field id="title" label="Project Title" required error={errors.title}>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., AI-Powered Student Assistant"
                className={cn(errors.title && "border-destructive")}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="groupName" label="Group Name" required error={errors.groupName}>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Group Alpha"
                  className={cn(errors.groupName && "border-destructive")}
                />
              </Field>
              <Field id="category" label="Category" required error={errors.category}>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className={cn("w-full", errors.category && "border-destructive")}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field id="description" label="Description">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Brief overview of the project goals and scope…"
                rows={3}
                className="resize-none"
              />
            </Field>
          </CardContent>
        </Card>

        {/* ── Section 2: Team & Assignment ─────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Team & Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="advisor" label="Assigned Advisor" required error={errors.advisorName}>
                <Select value={advisorName} onValueChange={setAdvisor}>
                  <SelectTrigger id="advisor" className={cn("w-full", errors.advisorName && "border-destructive")}>
                    <SelectValue placeholder="Select advisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADVISORS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="department" label="Department" required error={errors.department}>
                <Select value={department} onValueChange={setDept}>
                  <SelectTrigger id="department" className={cn("w-full", errors.department && "border-destructive")}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: Timeline & Budget ─────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Timeline & Budget
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field id="startDate" label="Start Date" required error={errors.startDate}>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStart(e.target.value)}
                  className={cn(errors.startDate && "border-destructive")}
                />
              </Field>
              <Field id="dueDate" label="Due Date" required error={errors.dueDate}>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDue(e.target.value)}
                  className={cn(errors.dueDate && "border-destructive")}
                />
              </Field>
              <Field id="budget" label="Budget (USD)">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="100"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="0"
                    className="pl-8"
                  />
                </div>
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 4: Technologies ───────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Technologies
            </CardTitle>
            <CardDescription>Add technologies and tools used in this project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech() } }}
                  placeholder="e.g., Python, React, TensorFlow…"
                  className="pl-8"
                />
              </div>
              <Button type="button" variant="outline" onClick={addTech} className="shrink-0">
                Add
              </Button>
            </div>
            {technologies.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {technologies.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() => removeTech(t)}
                  >
                    {t} ×
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Press Enter or click Add. Click a tag to remove it.
            </p>
          </CardContent>
        </Card>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/department-head/projects">Cancel</Link>
          </Button>
          <Button type="submit" className="btn-gradient">
            <FolderOpen className="h-4 w-4 mr-2" /> Create Project
          </Button>
        </div>
      </form>
    </div>
  )
}
