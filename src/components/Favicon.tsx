"use client"

import { useEffect } from 'react'

export function Favicon() {
  useEffect(() => {
    // Check if favicon link already exists
    const existingFavicon = document.querySelector('link[rel="icon"]')
    if (existingFavicon) {
      existingFavicon.remove()
    }

    // Create new favicon link
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = '/favicon.png'

    // Add to document head
    document.head.appendChild(link)

    // Cleanup function
    return () => {
      const faviconToRemove = document.querySelector('link[rel="icon"][href="/favicon.png"]')
      if (faviconToRemove) {
        faviconToRemove.remove()
      }
    }
  }, [])

  return null // This component doesn't render anything
}