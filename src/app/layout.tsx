
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Favicon } from "@/components/Favicon"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Academia - Academic Project Management",
  description: "Streamline academic project collaboration for students, advisors, Evaluators and Departments in universities.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Academia - Academic Project Management",
    description: "Streamline academic project collaboration for students, advisors, and universities.",
    url: "https://academia.com/",
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
    title: "Academia - Academic Project Management",
    description: "Streamline academic project collaboration for students, advisors, and universities.",
    images: ["/favicon.png"],
    site: "@academia",
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
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Academia - Academic Project Management" />
        <meta property="og:description" content="Streamline academic project collaboration for students, advisors, and universities." />
        <meta property="og:image" content="/favicon.png" />
        <meta property="og:url" content="https://academia.com/" />
        <meta property="og:type" content="website" />
        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Academia - Academic Project Management" />
        <meta name="twitter:description" content="Streamline academic project collaboration for students, advisors, and universities." />
        <meta name="twitter:image" content="/favicon.png" />
      </head>
      <body className={inter.variable}>
        <Favicon />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
