import axios from "axios"

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // For httpOnly cookies
})

// Request interceptor for tenant headers
apiClient.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem("tenantId")
  if (tenantId) {
    config.headers["X-Tenant-ID"] = tenantId
  }
  return config
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default apiClient