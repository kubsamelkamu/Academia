"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query"
import {
  getDepartmentGroupSizeSettings,
  updateDepartmentGroupSizeSettings,
} from "@/lib/api/department-settings"
import type {
  DepartmentGroupSizeSettings,
  UpdateDepartmentGroupSizeSettingsDto,
} from "@/types/department-settings"

export function departmentSettingsKeys() {
  return {
    root: ["department-settings"] as const,
    groupSize: ["department-settings", "group-size"] as const,
  }
}

export function useDepartmentGroupSizeSettings(
  options?: Omit<
    UseQueryOptions<
      DepartmentGroupSizeSettings,
      Error,
      DepartmentGroupSizeSettings
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: departmentSettingsKeys().groupSize,
    queryFn: getDepartmentGroupSizeSettings,
    ...options,
  })
}

export function useUpdateDepartmentGroupSizeSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: UpdateDepartmentGroupSizeSettingsDto) =>
      updateDepartmentGroupSizeSettings(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(departmentSettingsKeys().groupSize, data)
    },
  })
}
