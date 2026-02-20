"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Menu, X, GraduationCap } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header
      className={`border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'shadow-lg border-blue-500/20' : 'border-border'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 group" onClick={closeMenu}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-lg group-hover:bg-blue-500/30 transition-colors" />
            <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
              Academia
            </span>
            <span className="text-xs text-muted-foreground -mt-1">Academic Excellence</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/features"
            className="text-sm font-medium text-muted-foreground hover:text-blue-500 transition-all duration-200 relative group"
          >
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-200" />
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground hover:text-blue-500 transition-all duration-200 relative group"
          >
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-200" />
          </Link>
          <Link
            href="/docs"
            className="text-sm font-medium text-muted-foreground hover:text-blue-500 transition-all duration-200 relative group"
          >
            Docs
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-200" />
          </Link>
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild className="hover:bg-blue-500/10 hover:text-blue-500">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 text-white">
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden hover:bg-blue-500/10 hover:text-blue-500"
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
            className="md:hidden border-t bg-white/95 backdrop-blur-md shadow-lg"
          >
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/features"
                  className="text-base font-medium text-muted-foreground hover:text-blue-500 hover:bg-blue-500/5 transition-all duration-200 py-3 px-4 rounded-lg"
                  onClick={closeMenu}
                >
                  Features
                </Link>
                <Link
                  href="/about"
                  className="text-base font-medium text-muted-foreground hover:text-blue-500 hover:bg-blue-500/5 transition-all duration-200 py-3 px-4 rounded-lg"
                  onClick={closeMenu}
                >
                  About
                </Link>
                <Link
                  href="/docs"
                  className="text-base font-medium text-muted-foreground hover:text-blue-500 hover:bg-blue-500/5 transition-all duration-200 py-3 px-4 rounded-lg"
                  onClick={closeMenu}
                >
                  Docs
                </Link>
              </nav>

              {/* Mobile Buttons */}
              <div className="flex flex-col space-y-3 pt-4 border-t border-blue-500/10">
                <Button 
                  variant="ghost" 
                  asChild 
                  className="justify-start hover:bg-blue-500/10 hover:text-blue-500"
                >
                  <Link href="/login" onClick={closeMenu}>Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  className="justify-start bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg text-white"
                >
                  <Link href="/register" onClick={closeMenu}>Get Started</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}