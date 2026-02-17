"use client"

import { useQuery } from "@tanstack/react-query"
import { getCoordinatorDashboardData } from "@/lib/api/dashboard"

export function useCoordinatorDashboard() {
  return useQuery({
    queryKey: ["dashboard", "coordinator"],
    queryFn: getCoordinatorDashboardData,
  })
}
