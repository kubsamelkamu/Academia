"use client"

import { GraduationCap, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube, Send, ArrowUp } from "lucide-react"
import Link from "next/link"
import { useState, type FormEvent } from "react"

export function Footer() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      setEmail("")
      setTimeout(() => setIsSubscribed(false), 3000)
    }
  }

  return (
    <footer className="relative border-t border-border/40 bg-gradient-to-b from-background to-background/80 backdrop-blur-sm">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50 pointer-events-none" />
      
      {/* Back to top button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      >
        <ArrowUp className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      <div className="relative container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
          {/* Brand Section - Enhanced */}
          <div className="lg:col-span-1 space-y-6">
            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Academia
                  </h3>
                  <p className="text-xs text-muted-foreground tracking-wide">Academic Excellence</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              Streamlining academic project management for universities worldwide.
              Empowering educators and students with cutting-edge technology.
            </p>
            
            {/* Social links with improved styling */}
            <div className="flex space-x-3">
              {[
                { icon: Facebook, href: "#", label: "Facebook", color: "hover:bg-[#1877f2]" },
                { icon: Twitter, href: "#", label: "Twitter", color: "hover:bg-[#1da1f2]" },
                { icon: Linkedin, href: "#", label: "LinkedIn", color: "hover:bg-[#0a66c2]" },
                { icon: Youtube, href: "#", label: "YouTube", color: "hover:bg-[#ff0000]" }
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  aria-label={social.label}
                  className="text-muted-foreground hover:text-white transition-all duration-300 p-2 rounded-lg hover:scale-110 hover:shadow-lg"
                  style={{ transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = social.color.split("hover:bg-")[1]
                    e.currentTarget.style.transform = "translateY(-3px)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Section - Enhanced */}
          <div>
            <h4 className="font-semibold mb-6 text-foreground relative inline-block">
              Product
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-primary to-primary/40 rounded-full" />
            </h4>
            <ul className="space-y-3.5 text-sm">
              {["Features", "About", "Contact", "Docs"].map((item, idx) => (
                <li key={idx}>
                  <Link 
                    href={`/${item.toLowerCase()}`} 
                    className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-2 inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1 h-1 bg-primary rounded-full transition-all duration-300" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Section - Enhanced with interactive cards */}
          <div>
            <h4 className="font-semibold mb-6 text-foreground relative inline-block">
              Support
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-primary to-primary/40 rounded-full" />
            </h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a 
                  href="mailto:support@academia.et" 
                  className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-3 group hover:translate-x-1"
                >
                  <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <span className="group-hover:underline">support@academia.et</span>
                </a>
              </li>
              <li>
                <a 
                  href="tel:+1234567890" 
                  className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-3 group hover:translate-x-1"
                >
                  <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <span className="group-hover:underline">+1 (234) 567-8900</span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground leading-relaxed">
                  123 Academic Way<br />University City, UC 12345
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter Section - Enhanced with better UX */}
          <div>
            <h4 className="font-semibold mb-6 text-foreground relative inline-block">
              Stay Updated
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-primary to-primary/40 rounded-full" />
            </h4>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Get the latest updates on academic innovations and platform features.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-2.5 text-sm border border-input rounded-xl bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 pr-10"
                />
                <Send className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground text-sm font-medium py-2.5 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                <span className="relative z-10">Subscribe</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </button>
              
              {/* Success message */}
              {isSubscribed && (
                <div className="text-xs text-green-600 dark:text-green-400 text-center animate-in fade-in slide-in-from-top-2">
                  ✓ Thanks for subscribing!
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Section - Enhanced */}
        <div className="pt-8 border-t border-border/60">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Academia. All rights reserved. | Made with{" "}
              <span className="inline-block animate-pulse text-red-500">❤️</span>{" "}
              for academic excellence
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link 
                href="/privacy" 
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-y-[-2px] inline-block"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-y-[-2px] inline-block"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}