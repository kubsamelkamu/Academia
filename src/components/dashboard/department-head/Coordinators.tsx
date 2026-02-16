import React from 'react';
import { coordinators } from '@/lib/mock/department-head';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function Coordinators() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Coordinators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Assigned Projects</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coordinators.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.department}</TableCell>
                  <TableCell>{c.assignedProjects}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
