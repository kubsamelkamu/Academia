
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Favicon } from "@/components/Favicon"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  metadataBase: new URL("https://academia.et"),
  title: "Academia - Academic Project Management and Collaboration Platform",
  description: "Streamline academic project collaboration for students, advisors, Evaluators and Departments in universities.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Academia - Academic Project Management and Collaboration Platform",
    description: "Streamline academic project collaboration for students, advisors, Evaluators and Departments in universities.",
    url: "https://academia.et/",
    siteName: "Academia",
    images: [
      {
        url: "/favicon.png",
        width: 256,
        height: 256,
        alt: "Academia Graduation Cap Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Academia - Academic Project Management and Collaboration Platform",
    description: "Streamline academic project collaboration for students, advisors, Evaluators and Departments in universities.",
    images: ["/favicon.png"],
    site: "@academia",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Academia - Academic Project Management and Collaboration Platform" />
        <meta property="og:description" content="Streamline academic project collaboration for students, advisors, Evaluators and Departments in universities." />
        <meta property="og:image" content="/favicon.png" />
        <meta property="og:url" content="https://academia.et/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Academia - Academic Project Management and Collaboration Platform" />
        <meta name="twitter:description" content="Streamline academic project collaboration for students, advisors, Evaluators and Departments in universities." />
        <meta name="twitter:image" content="/favicon.png" />
      </head>
      <body className={inter.variable}>
        <Favicon />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
