import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { submitContact } from '@/lib/api/contact'
import { useContactStore } from '@/store/contact-store'
import type { ContactData } from '@/store/contact-store'
import { RateLimitError, isRateLimitError } from '@/lib/api/errors'

export const useContactSubmission = () => {

  const { setSubmitting, setLastSubmission, setError, reset } = useContactStore()

  const [isRateLimited, setIsRateLimited] = useState(false)
  const [rateLimitRemainingMs, setRateLimitRemainingMs] = useState(0)
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCooldownTimer = () => {
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current)
      cooldownTimerRef.current = null
    }
  }

  const startCooldown = (retryAfterMs: number) => {
    setIsRateLimited(true)
    setRateLimitRemainingMs(retryAfterMs)
    clearCooldownTimer()
    cooldownTimerRef.current = setTimeout(() => {
      setIsRateLimited(false)
      setRateLimitRemainingMs(0)
      cooldownTimerRef.current = null
    }, retryAfterMs)
  }

  useEffect(() => {
    return () => {
      clearCooldownTimer()
    }
  }, [])

  const isCooldownActive = isRateLimited

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
      if (isRateLimitError(error)) {
        startCooldown(error.retryAfterMs)
      }
      setError(error.message || 'An error occurred while submitting the contact form')
      setSubmitting(false)
    }
  })

  const submitContactForm = async (data: ContactData) => {
    if (isCooldownActive) {
      // Defensive: UI should already disable, but prevent programmatic spam too.
      throw new RateLimitError('Too many requests. Try again later.', rateLimitRemainingMs || 60_000)
    }
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
    isRateLimited: isCooldownActive,
    rateLimitRemainingMs,
  }
}