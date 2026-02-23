import axios from "axios"
import { useAuthStore } from "@/store/auth-store"

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // For httpOnly cookies
})

// Request interceptor for tenant headers
apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config
  }

  const authState = useAuthStore.getState()
  let tenantDomain = authState.tenantDomain
  let accessToken = authState.accessToken

  // Fallback to persisted auth-storage (useful very early in app init)
  if (!tenantDomain || !accessToken) {
    const authStorage = window.localStorage.getItem("auth-storage")
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage)
        tenantDomain = tenantDomain ?? parsed.state?.tenantDomain
        accessToken = accessToken ?? parsed.state?.accessToken
      } catch {
        // ignore
      }
    }
  }

  const headers = (config.headers ?? {}) as Record<string, string>
  if (tenantDomain) {
    headers["X-Tenant-Domain"] = tenantDomain
  }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
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
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
      const authStore = useAuthStore.getState()
      authStore.logout()
      window.location.href = "/login"
    }

    // Handle backend error envelope
    if (error.response?.data && !error.response.data.success) {
      const message = Array.isArray(error.response.data.message)
        ? error.response.data.message.join(", ")
        : error.response.data.message
      error.message = message || "Request failed"
    }

    return Promise.reject(error)
  }
)

export default apiClient