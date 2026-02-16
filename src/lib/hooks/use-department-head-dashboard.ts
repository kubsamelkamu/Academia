"use client"

import { useQuery } from "@tanstack/react-query"
import { getDepartmentHeadDashboardData } from "@/lib/api/dashboard"

export function useDepartmentHeadDashboard() {
  return useQuery({
    queryKey: ["dashboard", "department-head"],
    queryFn: getDepartmentHeadDashboardData,
  })
}
