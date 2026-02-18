import { create } from 'zustand'

export interface ContactData {
  name: string
  email: string
  subject: string
  message: string
}

interface ContactState {
  isSubmitting: boolean
  lastSubmission: ContactData | null
  error: string | null
  setSubmitting: (submitting: boolean) => void
  setLastSubmission: (data: ContactData) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useContactStore = create<ContactState>((set) => ({
  isSubmitting: false,
  lastSubmission: null,
  error: null,
  setSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setLastSubmission: (data) => set({ lastSubmission: data }),
  setError: (error) => set({ error }),
  reset: () => set({
    isSubmitting: false,
    lastSubmission: null,
    error: null
  })
}))