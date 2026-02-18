import { useMutation } from '@tanstack/react-query'
import { submitContact } from '@/lib/api/contact'
import { useContactStore } from '@/store/contact-store'
import type { ContactData } from '@/store/contact-store'

export const useContactSubmission = () => {

  const { setSubmitting, setLastSubmission, setError, reset } = useContactStore()

  const mutation = useMutation<ContactData, Error, ContactData>({
    mutationFn: submitContact,
    onMutate: () => {
      setSubmitting(true)
      setError(null)
    },
    onSuccess: (data) => {
      setLastSubmission(data)
      setSubmitting(false)
    },
    onError: (error) => {
      setError(error.message || 'An error occurred while submitting the contact form')
      setSubmitting(false)
    }
  })

  const submitContactForm = async (data: ContactData) => {
    return mutation.mutateAsync(data)
  }

  const resetForm = () => {
    reset()
    mutation.reset()
  }

  return {
    submitContactForm,
    resetForm,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error?.message,
    data: mutation.data,
  }
}