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
  // Get tenant domain from localStorage (persisted by Zustand)
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const authData = JSON.parse(authStorage);
      if (authData.state?.tenantDomain) {
        config.headers["X-Tenant-Domain"] = authData.state.tenantDomain;
      }
      if (authData.state?.accessToken) {
        config.headers["Authorization"] = `Bearer ${authData.state.accessToken}`;
      }
    } catch (_error) {
      // Ignore parsing errors
    }
  }

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