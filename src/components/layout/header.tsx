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
      className={`sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md transition-all duration-300 ${
        isScrolled ? 'shadow-lg border-border' : 'border-border'
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
            <div className="absolute inset-0 rounded-lg bg-primary/20 blur-lg transition-colors group-hover:bg-primary/30" />
            <div className="relative rounded-lg bg-primary p-2">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary">
              Academia
            </span>
            <span className="text-xs text-muted-foreground -mt-1">Academic Excellence</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/features"
            className="text-sm font-medium text-muted-foreground transition-all duration-200 relative group hover:text-primary"
          >
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full" />
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground transition-all duration-200 relative group hover:text-primary"
          >
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full" />
          </Link>
          <Link
            href="/docs"
            className="text-sm font-medium text-muted-foreground transition-all duration-200 relative group hover:text-primary"
          >
            Docs
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full" />
          </Link>
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild className="hover:bg-accent hover:text-primary">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild className="bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 hover:shadow-xl">
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden hover:bg-accent hover:text-primary"
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
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-md shadow-lg"
          >
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/features"
                  className="text-base font-medium text-muted-foreground transition-all duration-200 py-3 px-4 rounded-lg hover:bg-accent hover:text-primary"
                  onClick={closeMenu}
                >
                  Features
                </Link>
                <Link
                  href="/about"
                  className="text-base font-medium text-muted-foreground transition-all duration-200 py-3 px-4 rounded-lg hover:bg-accent hover:text-primary"
                  onClick={closeMenu}
                >
                  About
                </Link>
                <Link
                  href="/docs"
                  className="text-base font-medium text-muted-foreground transition-all duration-200 py-3 px-4 rounded-lg hover:bg-accent hover:text-primary"
                  onClick={closeMenu}
                >
                  Docs
                </Link>
              </nav>

              {/* Mobile Buttons */}
              <div className="flex flex-col space-y-3 pt-4 border-t border-border">
                <Button 
                  variant="ghost" 
                  asChild 
                  className="justify-start hover:bg-accent hover:text-primary"
                >
                  <Link href="/login" onClick={closeMenu}>Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  className="justify-start bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
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