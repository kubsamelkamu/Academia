"use client"

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Plus, Edit, CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { mockProjects } from '@/data/mockData';
import { toast } from 'sonner';

interface TitleValidation {
  id: string;
  projectId: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  submittedBy: string;
  submittedAt: string;
  feedback?: string;
  department: string;
}

const mockTitleValidations: TitleValidation[] = [
  {
    id: 'tv1',
    projectId: 'proj1',
    title: 'AI-Powered Student Performance Analytics System',
    status: 'pending',
    submittedBy: 'John Doe',
    submittedAt: '2024-03-20',
    department: 'Computer Science',
  },
  {
    id: 'tv2',
    projectId: 'proj2',
    title: 'Blockchain-Based Voting System for University Elections',
    status: 'needs_revision',
    submittedBy: 'Jane Smith',
    submittedAt: '2024-03-18',
    feedback: 'Title is too broad. Please specify the blockchain technology and voting mechanism.',
    department: 'Information Systems',
  },
  {
    id: 'tv3',
    projectId: 'proj3',
    title: 'Mobile Application for Campus Navigation Using AR',
    status: 'approved',
    submittedBy: 'Bob Johnson',
    submittedAt: '2024-03-15',
    department: 'Software Engineering',
  },
];

export function CoordinatorTitleManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTitle, setSelectedTitle] = useState<TitleValidation | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const filteredTitles = useMemo(() => {
    return mockTitleValidations.filter((title) => {
      const matchesSearch = title.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           title.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || title.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const handleApprove = (titleId: string) => {
    // In a real app, this would make an API call
    toast.success('Title approved successfully');
  };

  const handleReject = (titleId: string) => {
    setSelectedTitle(mockTitleValidations.find(t => t.id === titleId) || null);
    setFeedback('');
    setIsFeedbackDialogOpen(true);
  };

  const handleRequestRevision = (titleId: string) => {
    setSelectedTitle(mockTitleValidations.find(t => t.id === titleId) || null);
    setFeedback('');
    setIsFeedbackDialogOpen(true);
  };

  const handleSubmitFeedback = () => {
    if (!selectedTitle || !feedback.trim()) return;

    // In a real app, this would make an API call
    toast.success('Feedback submitted successfully');
    setIsFeedbackDialogOpen(false);
    setSelectedTitle(null);
    setFeedback('');
  };

  const getStatusBadge = (status: TitleValidation['status']) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      needs_revision: 'outline',
    } as const;

    const icons = {
      pending: AlertTriangle,
      approved: CheckCircle,
      rejected: XCircle,
      needs_revision: Edit,
    };

    const Icon = icons[status];

    return (
      <Badge variant={variants[status]} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'title',
      header: 'Project Title',
      render: (title: TitleValidation) => (
        <div>
          <p className="font-medium">{title.title}</p>
          <p className="text-sm text-muted-foreground">ID: {title.projectId}</p>
        </div>
      ),
    },
    {
      key: 'submittedBy',
      header: 'Submitted By',
      render: (title: TitleValidation) => (
        <div>
          <p className="font-medium">{title.submittedBy}</p>
          <p className="text-sm text-muted-foreground">{title.department}</p>
        </div>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (title: TitleValidation) => (
        <p className="text-sm">{new Date(title.submittedAt).toLocaleDateString()}</p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (title: TitleValidation) => getStatusBadge(title.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (title: TitleValidation) => (
        <div className="flex gap-2">
          {title.status === 'pending' && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleApprove(title.id)}>
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleRequestRevision(title.id)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleReject(title.id)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          {title.status === 'needs_revision' && (
            <Button size="sm" variant="outline" onClick={() => handleApprove(title.id)}>
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="space-y-6 animate-in fade-in duration-500 px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-inherit">Title Management</h1>
            <p className="text-muted-foreground mt-2">Review and validate project titles submitted by students</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold">{mockTitleValidations.filter(t => t.status === 'pending').length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold">{mockTitleValidations.filter(t => t.status === 'approved').length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Needs Revision</p>
                    <p className="text-2xl font-bold">{mockTitleValidations.filter(t => t.status === 'needs_revision').length}</p>
                  </div>
                  <Edit className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                    <p className="text-2xl font-bold">{mockTitleValidations.filter(t => t.status === 'rejected').length}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by title or student name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="needs_revision">Needs Revision</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Title Validation Table */}
          <Card>
            <CardHeader>
              <CardTitle>Title Validations</CardTitle>
              <CardDescription>Review and manage project title submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.key}>{column.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTitles.map((title) => (
                    <TableRow key={title.id}>
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {column.render(title)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredTitles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No title validations found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feedback Dialog */}
        <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Provide Feedback</DialogTitle>
              <DialogDescription>
                {selectedTitle && `Provide feedback for "${selectedTitle.title}"`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Enter your feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitFeedback}>
                Submit Feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}