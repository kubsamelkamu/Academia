"use client"

import React, { useState, useCallback } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { UserPlus } from 'lucide-react'
import { mockUsers, mockProjects, type ProjectSummary } from '@/data/mockData'
// AssignmentProject type is defined below
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'

type AssignmentProject = ProjectSummary & {
  advisorId?: string
  advisorName?: string
  evaluatorIds: string[]
}

interface AssignmentDialogProps {
  project: AssignmentProject
  onClose: () => void
  onAssign: (advisorId: string, evaluatorIds: string[]) => void
  open: boolean
}

function AssignmentDialog({ project, onClose, onAssign, open }: AssignmentDialogProps & { open: boolean }) {
  const [selectedAdvisor, setSelectedAdvisor] = useState(project.advisorId || '')
  const [selectedEvaluators, setSelectedEvaluators] = useState<string[]>(project.evaluatorIds || [])
  const { toast } = useToast()

const prevAdvisorIdRef = React.useRef(project.advisorId || '')
  const prevEvaluatorIdsRef = React.useRef(project.evaluatorIds || [])

  useEffect(() => {
    prevAdvisorIdRef.current = project.advisorId || ''
    prevEvaluatorIdsRef.current = project.evaluatorIds || []
  }, [project.advisorId, project.evaluatorIds])

  useEffect(() => {
    if (open) {
      setSelectedAdvisor(prevAdvisorIdRef.current)
      setSelectedEvaluators(prevEvaluatorIdsRef.current)
    }
  }, [open])

  const advisors = mockUsers.filter(u => u.role === 'advisor')
  const evaluators = mockUsers.filter(u => u.role === 'evaluator')

  const handleAssign = () => {
    onAssign(selectedAdvisor, selectedEvaluators)
    onClose()
  }

  const handleEvaluatorChange = (v: string) => {
    if (!selectedAdvisor) {
      toast.error('Please assign an advisor before selecting evaluators.')
      return
    }
    const newSet = selectedEvaluators.includes(v)
      ? selectedEvaluators.filter(id => id !== v)
      : [...selectedEvaluators, v]
    setSelectedEvaluators(newSet)
  }

  return (
    <DialogContent showCloseButton={false} onInteractOutside={onClose} onEscapeKeyDown={onClose}>
      <DialogHeader>
        <DialogTitle>Assign Team to {project.title}</DialogTitle>
        <DialogDescription>Select advisor and evaluators for this project.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Primary Advisor</Label>
          <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
            <SelectTrigger>
              <SelectValue placeholder="Select advisor" />
            </SelectTrigger>
            <SelectContent>
              {advisors.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Evaluators</Label>
          <Select onValueChange={handleEvaluatorChange} disabled={!selectedAdvisor}>
            <SelectTrigger>
              <SelectValue placeholder="Click to toggle evaluators" />
            </SelectTrigger>
            <SelectContent>
              {evaluators.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1 flex-wrap mt-1">
            {selectedEvaluators.map(id => {
              const evaluator = evaluators.find(e => e.id === id)
              return evaluator ? <Badge key={id} variant="secondary">{evaluator.name}</Badge> : null
            })}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedAdvisor}>
            Assign Team <UserPlus className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}

export default function AssignmentsPage() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<AssignmentProject[]>(() =>
    mockProjects.map(p => ({
      ...p,
      advisorId: '',
      advisorName: '',
      evaluatorIds: [] as string[],
    }))
  )
  const [dialogProject, setDialogProject] = useState<AssignmentProject | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleAssign = useCallback((advisorId: string, evaluatorIds: string[]) => {
    const advisor = mockUsers.find(u => u.id === advisorId)
    setProjects(prev => prev.map(p =>
      p.id === dialogProject?.id
        ? { ...p, advisorId, advisorName: advisor?.name || 'Unknown', evaluatorIds }
        : p
    ))
    toast.success(`${advisor?.name || 'Advisor'} and ${evaluatorIds.length} evaluator(s) assigned to "${dialogProject?.title}".`)
    setDialogOpen(false)
    setDialogProject(null)
  }, [dialogProject, toast])

  const columns: Column<AssignmentProject>[] = [
    {
      key: 'title',
      header: 'Project',
      render: (p) => (
        <div className="space-y-1">
          <p className="font-medium">{p.title}</p>
          <p className="text-sm text-muted-foreground">Group project</p>
        </div>
      ),
    },
    {
      key: 'advisorName',
      header: 'Advisor',
      render: (p) => p.advisorName ? (
        <Badge variant="default">{p.advisorName}</Badge>
      ) : (
        <Badge variant="outline" className="border-orange-400 text-orange-700 bg-orange-50">
          Unassigned
        </Badge>
      ),
    },
    {
      key: 'evaluators',
      header: 'Evaluators',
      render: (p) => (
        p.evaluatorIds.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {p.evaluatorIds.map(id => {
              const evaluator = mockUsers.find(u => u.id === id && u.role === 'evaluator')
              return evaluator ? (
                <Badge key={id} variant="secondary" className="text-xs">{evaluator.name}</Badge>
              ) : null
            })}
          </div>
        ) : (
          <Badge variant="outline" className="border-orange-400 text-orange-700 bg-orange-50">
            None
          </Badge>
        )
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'actions',
      header: ' ',
      render: (p) => (
        <Button
          variant={p.advisorName ? "secondary" : "outline"}
          size="sm"
          onClick={() => {
            setDialogProject({ ...p }) // always open dialog for this project
            setDialogOpen(true)
          }}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {p.advisorName ? 'Reassign' : 'Assign Team'}
        </Button>
      ),
    },
  ]

  const advisorWorkload = mockUsers
    .filter(u => u.role === 'advisor')
    .map(a => ({
      ...a,
      projectCount: projects.filter(p => p.advisorId === a.id).length,
    }))

  return (
    <div className="min-h-screen bg-surface-secondary/60 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <PageHeader
          title="Project Assignments"
          description="Assign advisors and evaluators to student projects."
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>Manage project team assignments for all groups.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable data={projects} columns={columns} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Advisor Workload</CardTitle>
              <CardDescription>Current number of projects assigned to each advisor.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {advisorWorkload.map(a => (
                  <div key={a.id} className="flex flex-col items-center min-w-[120px]">
                    <Badge variant="secondary" className="mb-1">{a.name}</Badge>
                    <span className="text-lg font-semibold">{a.projectCount}</span>
                    <span className="text-xs text-muted-foreground">projects</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Single dialog at page level */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setDialogProject(null)
        }}>
          {dialogProject && (
            <AssignmentDialog
              project={dialogProject}
              onClose={() => {
                setDialogOpen(false)
                setDialogProject(null)
              }}
              onAssign={handleAssign}
              open={dialogOpen}
            />
          )}
        </Dialog>
      </div>
    </div>
  )
}
