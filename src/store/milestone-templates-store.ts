import { create } from "zustand"

interface MilestoneTemplatesUiState {
  page: number
  limit: number
  search: string
  isActive: boolean | null
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
  setIsActive: (isActive: boolean | null) => void
  reset: () => void
}

const initialState = {
  page: 1,
  limit: 10,
  search: "",
  isActive: null as boolean | null,
}

export const useMilestoneTemplatesStore = create<MilestoneTemplatesUiState>((set) => ({
  ...initialState,
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setIsActive: (isActive) => set({ isActive, page: 1 }),
  reset: () => set(initialState),
}))
