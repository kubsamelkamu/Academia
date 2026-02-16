import React from 'react';
import { defenses } from '@/lib/mock/department-head';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function Reports() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Defense Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Committee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defenses.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.project}</TableCell>
                <TableCell>{d.date}</TableCell>
                <TableCell>{d.status}</TableCell>
                <TableCell>{Array.isArray(d.committee) ? d.committee.join(', ') : ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
