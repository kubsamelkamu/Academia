import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/store/auth-store"
import { isRateLimitMessage } from "@/lib/api/errors"

/**
 * Only treat 401 as "session is dead" when the identity endpoint rejects the token.
 * Other routes (notifications, advisor APIs, project groups, chat, etc.) often return 401 with
 * demo tokens, partial backends, or missing role wiring — clearing auth + redirecting to /login
 * then felt like random logouts (e.g. advisor evaluator → View project).
 */
function shouldForceSessionTerminationOn401(config: InternalAxiosRequestConfig | undefined): boolean {
  if (!config) return false
  const combined = `${config.baseURL ?? ""}${config.url ?? ""}`.toLowerCase()
  return combined.includes("/auth/me")
}

function isTenantDebugEnabled(): boolean {
  if (typeof window === "undefined") return false
  if (process.env.NODE_ENV === "production") return false
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get("debugTenant") === "1"
  } catch {
    return false
  }
}

function isAuthLoginRequest(config: InternalAxiosRequestConfig): boolean {
  const requestUrl = String(config.url ?? "")
  return requestUrl.includes("/auth/login")
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // For httpOnly cookies
})

// Request interceptor for tenant headers
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window === "undefined") {
    return config
  }

  const authState = useAuthStore.getState()
  let tenantDomain = authState.tenantDomain
  const accessToken = authState.accessToken

  // Fallback to persisted auth-storage for tenant domain only.
  if (!tenantDomain) {
    const authStorage = window.localStorage.getItem("auth-storage")
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage)
        tenantDomain = tenantDomain ?? parsed.state?.tenantDomain
      } catch {
        // ignore
      }
    }
  }

  const headers = AxiosHeaders.from(config.headers)
  if (tenantDomain) {
    headers.set("X-Tenant-Domain", tenantDomain)
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  if (isTenantDebugEnabled() && isAuthLoginRequest(config)) {
    const contentTypeValue = headers.get("Content-Type")
    const contentType =
      typeof contentTypeValue === "string"
        ? contentTypeValue
        : contentTypeValue != null
          ? String(contentTypeValue)
          : undefined

    const safeHeaders: Record<string, string | undefined> = {
      "X-Tenant-Domain": tenantDomain,
      "Content-Type": contentType,
    }
    console.info("[tenant-debug] /auth/login request", {
      url: config.url,
      baseURL: config.baseURL,
      tenantDomain,
      safeHeaders,
    })
  }

  config.headers = headers

  return config
})

// Response interceptor for error handling and data unwrapping
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap the backend response envelope
    if (response.data && response.data.success && response.data.data !== undefined) {
      response.data = response.data.data
    }
    return response
  },
  (error) => {
    // Handle backend error envelope
    if (error.response?.data && !error.response.data.success) {
      const message = Array.isArray(error.response.data.message)
        ? error.response.data.message.join(", ")
        : error.response.data.message
      error.message = message || "Request failed"
    }

    // Normalize throttling errors to a clear message.
    const status = Number(error.response?.status)
    if (status === 429 || isRateLimitMessage(error.message)) {
      error.message = "Too many requests. Try again later."
    }

    if (error.response?.status === 401) {
      const requestUrl: string = String(error.config?.url ?? "")
      const isAuthEndpoint =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/register") ||
        requestUrl.includes("/auth/email-verification") ||
        requestUrl.includes("/auth/forgot-password")

      // For invalid credentials on auth endpoints, let the caller handle the error
      // (e.g., show an inline message on the login page) instead of hard redirect.
      if (!isAuthEndpoint && shouldForceSessionTerminationOn401(error.config)) {
        const authStore = useAuthStore.getState()
        authStore.logout()

        if (typeof window !== "undefined") {
          const path = window.location.pathname
          const isOnAuthPage = path.startsWith("/login") || path.startsWith("/register")

          if (!isOnAuthPage) {
            window.location.href = "/login"
          }
        }
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient