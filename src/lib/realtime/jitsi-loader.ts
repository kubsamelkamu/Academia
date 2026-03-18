export type JitsiCallPhase = "idle" | "prejoin" | "joining" | "live" | "ending" | "ended"

export interface JitsiApiOptions {
  roomName: string
  parentNode: HTMLElement
  width?: string | number
  height?: string | number
  userInfo?: {
    displayName?: string
    email?: string
    avatarURL?: string
  }
  configOverwrite?: Record<string, unknown>
  interfaceConfigOverwrite?: Record<string, unknown>
  jwt?: string
}

export interface JitsiExternalApi {
  addListener(event: string, listener: (...args: unknown[]) => void): void
  removeListener(event: string, listener: (...args: unknown[]) => void): void
  executeCommand(command: string, ...args: unknown[]): void
  dispose(): void
}

export interface JitsiExternalApiConstructor {
  new (domain: string, options: JitsiApiOptions): JitsiExternalApi
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiExternalApiConstructor
    __academiaJitsiLoaderPromise?: Promise<JitsiExternalApiConstructor>
  }
}

const JITSI_EXTERNAL_API_URL = "https://meet.jit.si/external_api.js"

export async function loadJitsiExternalApi(): Promise<JitsiExternalApiConstructor> {
  if (typeof window === "undefined") {
    throw new Error("Jitsi can only be loaded in the browser")
  }

  if (window.JitsiMeetExternalAPI) {
    return window.JitsiMeetExternalAPI
  }

  if (window.__academiaJitsiLoaderPromise) {
    return window.__academiaJitsiLoaderPromise
  }

  window.__academiaJitsiLoaderPromise = new Promise<JitsiExternalApiConstructor>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src=\"${JITSI_EXTERNAL_API_URL}\"]`)

    const handleLoad = () => {
      if (!window.JitsiMeetExternalAPI) {
        reject(new Error("Jitsi script loaded but API is unavailable"))
        return
      }
      resolve(window.JitsiMeetExternalAPI)
    }

    if (existingScript) {
      if (window.JitsiMeetExternalAPI) {
        resolve(window.JitsiMeetExternalAPI)
        return
      }
      existingScript.addEventListener("load", handleLoad, { once: true })
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Jitsi script")), {
        once: true,
      })
      return
    }

    const script = document.createElement("script")
    script.src = JITSI_EXTERNAL_API_URL
    script.async = true
    script.onload = handleLoad
    script.onerror = () => reject(new Error("Failed to load Jitsi script"))
    document.head.appendChild(script)
  })

  try {
    return await window.__academiaJitsiLoaderPromise
  } catch (error) {
    window.__academiaJitsiLoaderPromise = undefined
    throw error
  }
}
