"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" onClick={closeMenu}>
          <Image src="/favicon.png" alt="Academia" width={24} height={24} />
          <span className="text-xl font-bold">Academia</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/features" className="text-sm font-medium hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
            About
          </Link>
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden border-t bg-white"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-3">
                <Link
                  href="/features"
                  className="text-sm font-medium hover:text-primary transition-colors py-2"
                  onClick={closeMenu}
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm font-medium hover:text-primary transition-colors py-2"
                  onClick={closeMenu}
                >
                  Pricing
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-medium hover:text-primary transition-colors py-2"
                  onClick={closeMenu}
                >
                  About
                </Link>
              </nav>

              {/* Mobile Buttons */}
              <div className="flex flex-col space-y-3 pt-4 border-t">
                <Button variant="ghost" asChild className="justify-start">
                  <Link href="/login" onClick={closeMenu}>Sign In</Link>
                </Button>
                <Button asChild className="justify-start">
                  <Link href="/register" onClick={closeMenu}>Get Started</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
