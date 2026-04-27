"use client"

import { GraduationCap, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube, Send, ArrowUp, Github, Instagram } from "lucide-react"
import Link from "next/link"
import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"

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
    <footer className="relative bg-[#0B0F19] text-white overflow-hidden border-t border-white/5">
      {/* Wave Divider with Emerald Tone */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-0 transform rotate-180 opacity-50">
        <svg className="relative block w-[calc(100%+1.3px)] h-[40px] fill-background" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>

      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-500 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] rounded-full bg-teal-500 blur-[100px]" />
      </div>

      <div className="relative w-full px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#ED5F45] p-2.5 rounded-2xl">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-2xl tracking-tighter text-[#ED5F45]">
                  Academia
                </h3>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Academic Excellence</p>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Streamlining academic project management for universities worldwide.
              Empowering educators and students with cutting-edge technology.
            </p>
            
            <div className="flex gap-4">
              {[
                { icon: Twitter, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Github, href: "#" }
              ].map((social, idx) => (
                <motion.a
                  key={idx}
                  href={social.href}
                  whileHover={{ y: -5, color: "#ED5F45", borderColor: "#ED5F45/30" }}
                  whileTap={{ scale: 0.9 }}
                  className="text-slate-500 hover:bg-white/5 p-2 rounded-xl border border-white/5 transition-all backdrop-blur-sm"
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Ecosystem Links */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">
              Ecosystem
            </h4>
            <ul className="space-y-3">
              {["Features", "About", "Contact"].map((item) => (
                <li key={item}>
                  <Link 
                    href={`/${item.toLowerCase()}`} 
                    className="text-slate-400 hover:text-[#ED5F45] transition-all duration-200 flex items-center gap-2 group text-sm"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#ED5F45] scale-0 group-hover:scale-100 transition-transform" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">
              Resources
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="https://docs.academia.et/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-[#ED5F45] transition-all duration-200 flex items-center gap-2 group text-sm"
                >
                  <span className="w-1 h-1 rounded-full bg-[#ED5F45] scale-0 group-hover:scale-100 transition-transform" />
                  Docs
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-slate-400 hover:text-[#ED5F45] transition-all duration-200 flex items-center gap-2 group text-sm"
                >
                  <span className="w-1 h-1 rounded-full bg-[#ED5F45] scale-0 group-hover:scale-100 transition-transform" />
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-slate-400 hover:text-[#ED5F45] transition-all duration-200 flex items-center gap-2 group text-sm"
                >
                  <span className="w-1 h-1 rounded-full bg-[#ED5F45] scale-0 group-hover:scale-100 transition-transform" />
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/5">
            <h4 className="font-bold text-lg mb-2 text-white">Stay Updated</h4>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">
              Get the latest updates on academic innovations.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#ED5F45]/50 transition-all text-sm"
                />
              </div>
              <motion.button 
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#ED5F45] hover:opacity-90 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-[#ED5F45]/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                Subscribe <Send className="h-4 w-4" />
              </motion.button>
              
              {isSubscribed && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-bold text-[#ED5F45] text-center mt-2"
                >
                  Subscribed successfully!
                </motion.div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <Mail className="h-3.5 w-3.5" />
            <span>support@academia.et</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span>© 2026 Academia</span>
          </div>
          
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex items-center gap-2 text-[#ED5F45] hover:opacity-80 transition-all font-bold text-xs uppercase tracking-widest"
          >
            Back to top
            <ArrowUp className="h-3.5 w-3.5 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  )
}