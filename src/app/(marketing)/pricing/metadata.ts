import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing | Academia - Academic Project Management and Collaboration platform',
  description: 'See Academia pricing plans for academic institutions. Simple, transparent pricing to help you scale your project management needs.',
  openGraph: {
    title: 'Pricing | Academia - Academic Project Management and Collaboration platform',
    description: 'See Academia pricing plans for academic institutions. Simple, transparent pricing to help you scale your project management needs.',
    url: 'https://academia.com/pricing',
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
    title: 'Pricing | Academia - Academic Project Management',
    description: 'See Academia pricing plans for academic institutions. Simple, transparent pricing to help you scale your project management needs.',
    images: ['/favicon.png'],
    site: '@academia',
  },
}
