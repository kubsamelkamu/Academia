const STORAGE_KEY = "academia.forgot-password.flow.v1"

type ForgotPasswordFlowState = {
  email?: string
  resetToken?: string
  resendAvailableAt?: number
}

function readRawState(): ForgotPasswordFlowState | null {
  if (typeof window === "undefined") return null
  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ForgotPasswordFlowState
  } catch {
    return null
  }
}

export function readForgotPasswordFlow(): ForgotPasswordFlowState | null {
  return readRawState()
}

export function writeForgotPasswordFlow(next: ForgotPasswordFlowState) {
  if (typeof window === "undefined") return
  const current = readRawState() ?? {}
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...next }))
}

export function clearForgotPasswordFlow() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(STORAGE_KEY)
}
