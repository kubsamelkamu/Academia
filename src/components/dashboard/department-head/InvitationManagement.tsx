import React from 'react';
import { advisors, coordinators } from '@/lib/mock/department-head';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function InvitationManagement() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Advisors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Invite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advisors.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>{a.department}</TableCell>
                  <TableCell>{a.students}</TableCell>
                  <TableCell>
                    <button className="px-2 py-1 bg-primary text-white rounded text-xs">Invite</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

     
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Coordinators</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Assigned Projects</TableHead>
                <TableHead>Invite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coordinators.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.department}</TableCell>
                  <TableCell>{c.assignedProjects}</TableCell>
                  <TableCell>
                    <button className="px-2 py-1 bg-primary text-white rounded text-xs">Invite</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
