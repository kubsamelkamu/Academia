"use client"

import { useCallback, useState } from "react"
import { MessageCircleMore, Users } from "lucide-react"
import { useRouter } from "next/navigation"

import { CoordinatorAdvisorDirectChatPage } from "@/components/dashboard/shared/coordinator-advisor-direct-chat-page"
import { Button } from "@/components/ui/button"

import { AdvisorMessagesPage } from "./messages-page"

type AdvisorChatMode = "project" | "direct"

function getChatModeFromUrl(): AdvisorChatMode {
  if (typeof window === "undefined") {
    return "project"
  }

  const value = new URLSearchParams(window.location.search).get("chat")
  return value === "direct" ? "direct" : "project"
}

export function AdvisorMessagesHubPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AdvisorChatMode>(() => getChatModeFromUrl())

  const handleModeChange = useCallback(
    (nextMode: AdvisorChatMode) => {
      setMode(nextMode)

      if (typeof window === "undefined") {
        return
      }

      const params = new URLSearchParams(window.location.search)

      if (nextMode === "direct") {
        params.set("chat", "direct")
      } else {
        params.delete("chat")
        params.delete("user")
      }

      const query = params.toString()
      router.replace(query ? `?${query}` : "?", { scroll: false })
    },
    [router]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={mode === "project" ? "default" : "outline"}
          onClick={() => handleModeChange("project")}
        >
          <Users className="mr-2 h-4 w-4" />
          Project Group Chat
        </Button>
        <Button
          type="button"
          variant={mode === "direct" ? "default" : "outline"}
          onClick={() => handleModeChange("direct")}
        >
          <MessageCircleMore className="mr-2 h-4 w-4" />
          Coordinator Direct Chat
        </Button>
      </div>

      {mode === "direct" ? (
        <CoordinatorAdvisorDirectChatPage actorRole="advisor" />
      ) : (
        <AdvisorMessagesPage />
      )}
    </div>
  )
}