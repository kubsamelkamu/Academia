import apiClient from "@/lib/api/client"

export type TenantVerificationRequestStatus = "PENDING" | "APPROVED" | "REJECTED"

export type TenantVerificationRequest = {
  id: string
  tenantId: string
  submittedByUserId: string
  status: TenantVerificationRequestStatus
  documentUrl: string
  fileName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export async function submitTenantVerificationDocument(file: File): Promise<TenantVerificationRequest> {
  const formData = new FormData()
  formData.append("document", file)

  const response = await apiClient.post<TenantVerificationRequest>(
    "/tenant/verification/document",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data
}
