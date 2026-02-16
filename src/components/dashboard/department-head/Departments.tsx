import React from 'react';
import { departmentSettings } from '@/lib/mock/department-head';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Departments() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Department Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Name:</span> {departmentSettings.name}
          </div>
          <div>
            <span className="font-medium">Head:</span> {departmentSettings.head}
          </div>
          <div>
            <span className="font-medium">Email:</span> {departmentSettings.email}
          </div>
          <div>
            <span className="font-medium">Roles:</span> {departmentSettings.roles.join(', ')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
