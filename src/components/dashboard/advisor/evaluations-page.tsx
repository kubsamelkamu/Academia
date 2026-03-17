"use client"

import * as React from "react"
import Link from "next/link"
import { FileSearch } from "lucide-react"

import { DashboardPageHeader } from "@/components/dashboard/page-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type EvaluationStatus = "Pending Review" | "Evaluated" | "Needs Revision"

interface EvaluationRow {
  id: string
  studentName: string
  projectTitle: string
  status: EvaluationStatus
  submittedDate: string
}

const evaluationData: EvaluationRow[] = [
  {
    id: "eval-1",
    studentName: "Alex Mercer",
    projectTitle: "Machine Learning applied to Smart Grids",
    status: "Pending Review",
    submittedDate: "2024-05-10",
  },
  {
    id: "eval-2",
    studentName: "Maria Garcia",
    projectTitle: "Blockchain for Supply Chain Transparency",
    status: "Evaluated",
    submittedDate: "2024-05-08",
  },
  {
    id: "eval-3",
    studentName: "Liam Johnson",
    projectTitle: "IoT Home Automation Prototype",
    status: "Needs Revision",
    submittedDate: "2024-05-12",
  },
  {
    id: "eval-4",
    studentName: "Sophia Chen",
    projectTitle: "Natural Language Processing for Healthcare",
    status: "Pending Review",
    submittedDate: "2024-05-14",
  },
]

function statusClass(status: EvaluationStatus) {
  if (status === "Pending Review") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
  if (status === "Evaluated") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
}

export function AdvisorEvaluationsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <DashboardPageHeader
        title="Project Evaluations"
        description="Review student projects, provide feedback, and submit final evaluations."
        badge="Evaluations"
      />

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px]">Student Name</TableHead>
                <TableHead>Project Title</TableHead>
                <TableHead className="w-[150px]">Date Submitted</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead className="text-right w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluationData.map((evaluation) => (
                <TableRow key={evaluation.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{evaluation.studentName}</TableCell>
                  <TableCell className="text-muted-foreground">{evaluation.projectTitle}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(evaluation.submittedDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusClass(evaluation.status)}>
                      {evaluation.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      size="sm"
                      variant={evaluation.status === "Pending Review" ? "default" : "outline"}
                      className="gap-2"
                    >
                      <Link href={`/dashboard/advisor/evaluations/${evaluation.id}`}>
                        <FileSearch className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only">View Evaluation</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {evaluationData.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No evaluations found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
