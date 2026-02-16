import React from 'react';
import { overviewStats } from '@/lib/mock/department-head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  { label: 'Projects', value: overviewStats.totalProjects },
  { label: 'Advisors', value: overviewStats.totalAdvisors },
  { label: 'Coordinators', value: overviewStats.totalCoordinators },
  { label: 'Students', value: overviewStats.totalStudents },
  { label: 'Defenses', value: overviewStats.totalDefenses },
];

export default function DashboardOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{stat.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
