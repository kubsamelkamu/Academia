import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Academia - Academic Project Management and Collaboration platform',
  description: 'Learn about Academia, the platform empowering academic excellence and collaboration for students, advisors, and universities.',
  openGraph: {
    title: 'About | Academia - Academic Project Management and Collaboration platform',
    description: 'Learn about Academia, the platform empowering academic excellence and collaboration for students, advisors, and universities.',
    url: 'https://academia.et/about',
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
    title: 'About | Academia - Academic Project Management',
    description: 'Learn about Academia, the platform empowering academic excellence and collaboration for students, advisors, and universities.',
    images: ['/favicon.png'],
    site: '@academia',
  },
}
