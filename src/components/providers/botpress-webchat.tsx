"use client"

import Script from "next/script"
import { useState } from "react"

function getBotpressScriptUrls() {
  const injectUrl = process.env.NEXT_PUBLIC_BOTPRESS_INJECT_URL
  const configUrl = process.env.NEXT_PUBLIC_BOTPRESS_CONFIG_URL

  return { injectUrl, configUrl }
}

export function BotpressWebchat() {
  const { injectUrl, configUrl } = getBotpressScriptUrls()
  const [injectLoaded, setInjectLoaded] = useState(false)

  if (!injectUrl || !configUrl) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Botpress Webchat is not configured: set NEXT_PUBLIC_BOTPRESS_INJECT_URL and NEXT_PUBLIC_BOTPRESS_CONFIG_URL"
      )
    }
    return null
  }

  return (
    <>
      <Script
        id="botpress-webchat-inject"
        src={injectUrl}
        strategy="afterInteractive"
        onLoad={() => setInjectLoaded(true)}
      />

      {injectLoaded ? (
        <Script
          id="botpress-webchat-config"
          src={configUrl}
          strategy="afterInteractive"
        />
      ) : null}
    </>
  )
}
