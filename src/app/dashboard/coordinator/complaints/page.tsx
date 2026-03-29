"use client"

import React from 'react'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye } from 'lucide-react'
import Link from "next/link"
import { mockComplaints, Complaint } from "@/data/mockData"

export default function ComplaintsPage() {

  const openComplaints = mockComplaints.filter(c => c.status === 'open')
  const underReview = mockComplaints.filter(c => c.status === 'under_review')
  const resolved = mockComplaints.filter(c => c.status === 'resolved')

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  const columns: Column<Complaint>[] = [
    {
      key: 'studentName',
      header: 'Student',
      render: (c) => <div className="font-medium">{c.studentName}</div>,
    },
    {
      key: 'target',
      header: 'Target',
      render: (c) => (
        <div className="space-y-1">
          <Badge variant="outline" className="capitalize">{c.targetType}</Badge>
          <p className="text-sm font-medium truncate max-w-[150px]">{c.targetName}</p>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Issue',
      render: (c) => (
        <p className="max-w-[250px] truncate text-sm text-foreground/80">{c.reason}</p>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (c) => <div className="text-sm text-muted-foreground">{formatDate(c.submittedAt)}</div>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <Link href={`/dashboard/coordinator/complaints/${c.id}`} passHref legacyBehavior>
          <Button asChild variant="outline" size="sm">
            <span><Eye className="mr-2 h-4 w-4" />View Detail</span>
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6 pb-8">
      <PageHeader 
        title="Complaint Management" 
        description="Review and resolve student grade disputes and evaluation complaints."
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="font-display">Recent Complaints</CardTitle>
            <CardDescription>Manage student grade and evaluation disputes</CardDescription>
          </div>
          <div className="flex gap-2 text-sm">
            <Badge variant="secondary" className="px-3 py-1">Open: {openComplaints.length}</Badge>
            <Badge variant="outline" className="px-3 py-1">Review: {underReview.length}</Badge>
            <Badge className="px-3 py-1">Resolved: {resolved.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable data={mockComplaints} columns={columns} />
        </CardContent>
      </Card>

      <Tabs defaultValue="open" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="open" className="data-[state=active]:bg-muted data-[state=active]:text-muted-foreground">
            Open ({openComplaints.length})
          </TabsTrigger>
          <TabsTrigger value="review" className="data-[state=active]:bg-muted data-[state=active]:text-muted-foreground">
            Under Review ({underReview.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-muted data-[state=active]:text-muted-foreground">
            Resolved ({resolved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <DataTable data={openComplaints} columns={columns} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <DataTable data={underReview} columns={columns} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <DataTable data={resolved} columns={columns} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
