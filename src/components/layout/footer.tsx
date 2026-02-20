import { GraduationCap, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-white/95 backdrop-blur-md relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233B82F6' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400/20 rounded-lg blur-lg" />
                <div className="relative bg-gradient-to-br from-blue-400 to-blue-500 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
                  Academia
                </h3>
                <p className="text-xs text-muted-foreground">Academic Excellence</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Streamlining academic project management for universities worldwide.
              Empowering educators and students with cutting-edge technology.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-blue-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-blue-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Section */}
          <div>
            <h4 className="font-semibold mb-6 text-foreground relative">
              Product
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-blue-400 rounded-full" />
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-blue-400 transition-colors hover:translate-x-1 inline-block transform duration-200">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-blue-400 transition-colors hover:translate-x-1 inline-block transform duration-200">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-blue-400 transition-colors hover:translate-x-1 inline-block transform duration-200">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-blue-400 transition-colors hover:translate-x-1 inline-block transform duration-200">
                  Docs
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h4 className="font-semibold mb-6 text-foreground relative">
              Support
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-blue-400 rounded-full" />
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="mailto:support@academia.et" className="text-muted-foreground hover:text-blue-400 transition-colors flex items-center gap-2 hover:translate-x-1 transform duration-200">
                  <Mail className="h-4 w-4" />
                  support@academia.et
                </a>
              </li>
              <li>
                <a href="tel:+1234567890" className="text-muted-foreground hover:text-blue-400 transition-colors flex items-center gap-2 hover:translate-x-1 transform duration-200">
                  <Phone className="h-4 w-4" />
                  +1 (234) 567-8900
                </a>
              </li>
              <li>
                <div className="text-muted-foreground flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">123 Academic Way<br />University City, UC 12345</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div>
            <h4 className="font-semibold mb-6 text-foreground relative">
              Stay Updated
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-blue-400 rounded-full" />
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Get the latest updates on academic innovations and platform features.
            </p>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 text-sm border border-blue-400/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 bg-white/50 backdrop-blur-sm"
              />
              <button className="w-full bg-blue-400 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-blue-400/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Academia. All rights reserved. | Made with ❤️ for academic excellence
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-blue-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-blue-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}