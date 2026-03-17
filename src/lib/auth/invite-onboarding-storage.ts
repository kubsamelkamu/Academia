import type { AcceptInvitationResult } from "@/types/invitations"

const STORAGE_KEY = "academia.invite.accept-result.v1"

type StoredInviteAcceptResult = {
  token: string
  result: AcceptInvitationResult
  storedAt: number
}

export function storeInviteAcceptResult(token: string, result: AcceptInvitationResult) {
  if (typeof window === "undefined") return
  const payload: StoredInviteAcceptResult = {
    token,
    result,
    storedAt: Date.now(),
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function readInviteAcceptResult(): StoredInviteAcceptResult | null {
  if (typeof window === "undefined") return null
  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredInviteAcceptResult
  } catch {
    return null
  }
}

export function clearInviteAcceptResult() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(STORAGE_KEY)
}
