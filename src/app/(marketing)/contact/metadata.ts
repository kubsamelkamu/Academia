import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact | Academia - Academic Project Management and Collaboration Platform',
  description: 'Contact Academia for support, partnership, or general inquiries. We are here to help academic institutions and students succeed.',
  openGraph: {
    title: 'Contact | Academia - Academic Project Management and Collaboration Platform',
    description: 'Contact Academia for support, partnership, or general inquiries. We are here to help academic institutions and students succeed.',
    url: 'https://academia.et/contact',
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
    title: 'Contact | Academia - Academic Project Management',
    description: 'Contact Academia for support, partnership, or general inquiries. We are here to help academic institutions and students succeed.',
    images: ['/favicon.png'],
    site: '@academia',
  },
}