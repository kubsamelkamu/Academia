"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query"
import { getUniversityConfig, updateUniversityConfig } from "@/lib/api/university"
import type { TenantCurrent, UpdateTenantAddressDto } from "@/types/university"

export function universityKeys() {
  return {
    root: ["university"] as const,
    config: ["university", "config"] as const,
  }
}

export function useUniversityConfig(
  options?: Omit<
    UseQueryOptions<TenantCurrent, Error, TenantCurrent>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: universityKeys().config,
    queryFn: getUniversityConfig,
    ...options,
  })
}

export function useUpdateUniversityConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: UpdateTenantAddressDto) => updateUniversityConfig(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(universityKeys().config, data)
      // Backend may emit an in-app notification on first address set.
      // Refresh notification queries so the bell updates immediately.
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}
