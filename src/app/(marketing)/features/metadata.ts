import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Features | Academia - Academic Project Management',
  description: 'Explore the powerful features of Academia for academic project management, defense scheduling, real-time collaboration, and more.',
  openGraph: {
    title: 'Features | Academia - Academic Project Management and Collaboration platform',
    description: 'Explore the powerful features of Academia for academic project management, defense scheduling, real-time collaboration, and more.',
    url: 'https://academia.et/features',
    siteName: 'Academia',
    images: [
      {
        url: '/favicon.png',
        width: 256,
        height: 256,
        alt: 'Academia Graduation Cap Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Features | Academia - Academic Project Management',
    description: 'Explore the powerful features of Academia for academic project management, defense scheduling, real-time collaboration, and more.',
    images: ['/favicon.png'],
    site: '@academia',
  },
}
