import apiClient from "@/lib/api/client"
import type { AuthMeUser } from "@/types/auth"

export type ForgotPasswordRequestDto = {
  email: string
}

export type ForgotPasswordVerifyDto = {
  email: string
  otp: string
}

export type ForgotPasswordResendDto = {
  email: string
}

export type ForgotPasswordResetDto = {
  resetToken: string
  newPassword: string
}

export type ForgotPasswordRequestResult = {
  message: string
}

export type ForgotPasswordVerifyResult = {
  resetToken: string
}

export type ForgotPasswordResetResult = {
  message: string
}

export async function getAuthMe(): Promise<AuthMeUser> {
  const response = await apiClient.get<AuthMeUser>("/auth/me")
  return response.data
}

export async function requestForgotPassword(
  dto: ForgotPasswordRequestDto
): Promise<ForgotPasswordRequestResult> {
  const response = await apiClient.post<ForgotPasswordRequestResult>("/auth/forgot-password/request", dto)
  return response.data
}

export async function verifyForgotPasswordOtp(
  dto: ForgotPasswordVerifyDto
): Promise<ForgotPasswordVerifyResult> {
  const response = await apiClient.post<ForgotPasswordVerifyResult>("/auth/forgot-password/verify", dto)
  return response.data
}

export async function resendForgotPasswordOtp(
  dto: ForgotPasswordResendDto
): Promise<ForgotPasswordRequestResult> {
  const response = await apiClient.post<ForgotPasswordRequestResult>("/auth/forgot-password/resend", dto)
  return response.data
}

export async function resetForgotPassword(
  dto: ForgotPasswordResetDto
): Promise<ForgotPasswordResetResult> {
  const response = await apiClient.post<ForgotPasswordResetResult>("/auth/forgot-password/reset", dto)
  return response.data
}
