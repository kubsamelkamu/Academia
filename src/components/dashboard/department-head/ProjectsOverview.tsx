import React from 'react';
import { projects } from '@/lib/mock/department-head';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function ProjectsOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Projects Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Coordinator</TableHead>
              <TableHead>Advisor</TableHead>
              <TableHead>Students</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.title}</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell>{p.coordinator}</TableCell>
                <TableCell>{p.advisor}</TableCell>
                <TableCell>{Array.isArray(p.students) ? p.students.length : 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
