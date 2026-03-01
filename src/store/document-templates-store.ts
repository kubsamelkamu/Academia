import { create } from "zustand"
import type { DocumentTemplateType } from "@/types/document-templates"

interface DocumentTemplatesUiState {
  page: number
  limit: number
  search: string
  type: DocumentTemplateType | null
  isActive: boolean | null
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
  setType: (type: DocumentTemplateType | null) => void
  setIsActive: (isActive: boolean | null) => void
  reset: () => void
}

const initialState = {
  page: 1,
  limit: 10,
  search: "",
  type: null as DocumentTemplateType | null,
  isActive: null as boolean | null,
}

export const useDocumentTemplatesStore = create<DocumentTemplatesUiState>((set) => ({
  ...initialState,
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setType: (type) => set({ type, page: 1 }),
  setIsActive: (isActive) => set({ isActive, page: 1 }),
  reset: () => set(initialState),
}))
