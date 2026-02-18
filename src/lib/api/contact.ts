import apiClient from './client'
import type { ContactData } from '@/store/contact-store'

export const submitContact = async (data: ContactData): Promise<ContactData> => {
  try {
    const response = await apiClient.post<ContactData>('https://api.academia.et/api/v1/contact', data)
    return response.data
  } catch (error) {
    // Re-throw the error so it can be handled by the calling component
    throw error
  }
}