'use client'

import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm, useWatch, UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useContactSubmission } from '@/hooks/use-contact-submission'
import { contactSchema, type ContactFormData } from '@/validations/contact'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import {
  Mail,
  Send,
  CheckCircle,
  MessageSquare,
  Users,
  Building,
  Sparkles,
  Clock,
  ArrowRight,
  ChevronDown,
  HelpCircle,
  Rocket,
  MapPin,
  Phone,
  Heart,
  Play,
  Check,
  ChevronRight,
} from 'lucide-react'

const container = 'mx-auto w-full max-w-[1600px] px-6 sm:px-10 lg:px-16'

// Brand color
const BRAND = "#ED5F45"
const BRAND_DARK = "#D54A32"
const BRAND_LIGHT = "#F47A64"

/* ── 3D Tilt Card Component ── */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
      className={`relative ${className}`}
    >
      <motion.div
        style={{ transformStyle: "preserve-3d" }}
        whileHover={{ translateZ: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ── Magnetic Button Component ── */
function MagnetButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2
    x.set((e.clientX - centerX) * 0.1)
    y.set((e.clientY - centerY) * 0.1)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      style={{ x, y }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

type ContactInfoItem = {
  title: string
  description: string
  contact: string
  icon: LucideIcon
}

type ContactCardProps = {
  info: ContactInfoItem
  index: number
}

function ContactCard({ info, index }: ContactCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const Icon = info.icon

  const handleCopy = () => {
    void navigator.clipboard.writeText(info.contact)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      viewport={{ once: true }}
    >
      <TiltCard className="h-full">
        <button
          type="button"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleCopy}
          className="group w-full h-full rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-left shadow-xl hover:shadow-2xl transition-all"
        >
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ED5F45]/10 text-[#ED5F45] transition-colors group-hover:bg-[#ED5F45] group-hover:text-white">
            <Icon className="h-8 w-8" aria-hidden />
          </div>
          <h3 className="text-xl font-black text-foreground mb-2 uppercase tracking-tight">{info.title}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{info.description}</p>
          
          <div className="relative">
            <div className={cn(
              "p-4 rounded-xl border font-mono text-sm font-bold transition-all truncate",
              isCopied 
                ? "border-emerald-500/50 bg-emerald-50 text-emerald-600" 
                : "border-slate-100 bg-slate-50 text-slate-600 group-hover:border-[#ED5F45]/30 group-hover:bg-[#ED5F45]/5"
            )}>
              {isCopied ? (
                <span className="flex items-center gap-2"><Check className="h-4 w-4" /> COPIED!</span>
              ) : (
                info.contact
              )}
            </div>
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="bg-[#ED5F45] text-white text-[10px] font-black px-2 py-1 rounded shadow-lg">CLICK TO COPY</div>
            </div>
          </div>
        </button>
      </TiltCard>
    </motion.div>
  )
}

type AnimatedInputProps = {
  id: string
  label: string
  type?: React.HTMLInputTypeAttribute
  register: UseFormRegisterReturn
  value?: string
  error?: string
  required?: boolean
  isTextarea?: boolean
}

function AnimatedInput({
  id,
  label,
  type = 'text',
  register,
  value = '',
  error,
  required,
  isTextarea = false,
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value.length > 0
  const Component = isTextarea ? Textarea : Input

  return (
    <div className="relative group">
      <Label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute left-4 z-10 transition-all font-bold',
          isFocused || hasValue 
            ? '-top-3 text-[10px] text-[#ED5F45] bg-white dark:bg-slate-900 px-2' 
            : 'top-4 text-sm text-slate-400',
        )}
      >
        {label}
        {required ? <span className="ml-1 text-[#ED5F45]">*</span> : null}
      </Label>
      <Component
        id={id}
        type={type}
        {...register}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          register.onBlur(e)
          setIsFocused(false)
        }}
        className={cn(
          'h-14 rounded-2xl border-2 border-slate-100 bg-white/50 px-4 pt-2 font-bold transition-all focus:border-[#ED5F45] focus:ring-0 dark:border-slate-800 dark:bg-slate-900/50',
          isTextarea && "min-h-[150px] pt-4",
          error && 'border-destructive focus:border-destructive',
        )}
        rows={isTextarea ? 6 : undefined}
      />
      {error ? (
        <p className="mt-2 text-xs font-bold text-destructive flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> {error}
        </p>
      ) : null}
    </div>
  )
}

function FAQItem({ faq, index }: { faq: { question: string; answer: string }; index: number }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      viewport={{ once: true }}
      className={cn(
        "rounded-[2rem] border-2 transition-all p-2",
        isOpen ? "border-[#ED5F45]/30 bg-white dark:bg-slate-900" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-4">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
            isOpen ? "bg-[#ED5F45] text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
          )}>
             <HelpCircle className="h-5 w-5" />
          </div>
          <span className="font-black text-lg tracking-tight uppercase text-slate-900 dark:text-white transition-colors">{faq.question}</span>
        </span>
        <div className={cn("transition-transform duration-300", isOpen && "rotate-180")}>
           <ChevronDown className={cn("h-6 w-6", isOpen ? "text-[#ED5F45]" : "text-slate-300 dark:text-slate-600")} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-slate-50 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ContactPage() {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' },
  })

  const { submitContactForm, isSubmitting, isSuccess, error, resetForm, isRateLimited } = useContactSubmission()

  useEffect(() => {
    if (!isSuccess) return
    const timer = setTimeout(() => { resetForm() }, 5000)
    return () => clearTimeout(timer)
  }, [isSuccess, resetForm])

  const watchedValues = useWatch({ control: form.control })

  const formProgress = useMemo(() => {
    const values = watchedValues
    const filledFields = Object.values(values || {}).filter((val) => val && String(val).trim().length > 0).length
    return (filledFields / 4) * 100
  }, [watchedValues])

  const handleSubmit = async (data: ContactFormData) => {
    try {
      await submitContactForm(data)
      form.reset()
    } catch {}
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#ED5F45_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-[0.03]" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20">
        <div className={container}>
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="mb-6 border-[#ED5F45]/30 bg-[#ED5F45]/10 text-[#ED5F45] px-6 py-2 rounded-full font-bold uppercase tracking-widest text-[10px]">
                Support & Sales
              </Badge>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
                Let&apos;s Get <br />
                <span className="text-[#ED5F45]">In Touch.</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto lg:mx-0">
                Questions about Academia, pricing, or a pilot for your department? 
                We&apos;re here to help—usually within one business day.
              </p>
              
              <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center justify-center text-[#ED5F45]">
                     <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response Time</p>
                    <p className="text-sm font-black uppercase">Under 24 Hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center justify-center text-[#ED5F45]">
                     <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Us</p>
                    <p className="text-sm font-black uppercase">hello@academia.com</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="flex-1 w-full max-w-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <TiltCard>
                <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl border border-white">
                  <Image
                    src="/contact us.png"
                    alt="Contact Academia"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-12">
                    <div>
                       <div className="flex gap-2 mb-4">
                          {[1,2,3,4,5].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#ED5F45]" />)}
                       </div>
                       <p className="text-white text-3xl font-black uppercase tracking-tighter">GLOBAL REACH <br /> LOCAL SUPPORT</p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Channels */}
      <section className="py-24">
        <div className={container}>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {contactInfo.map((info, index) => (
              <ContactCard key={info.title} info={info} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="py-24 md:py-40">
        <div className={container}>
          <div className="flex flex-col lg:flex-row gap-20">
            <div className="lg:w-1/3">
              <Badge className="mb-6 border-[#ED5F45]/30 bg-[#ED5F45]/10 text-[#ED5F45] px-6 py-2 rounded-full font-bold uppercase tracking-widest text-[10px]">
                Contact Form
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">
                Send a <span className="text-[#ED5F45]">Message.</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10">
                Share your context and we&apos;ll reply with next steps—demos, 
                security reviews, or general questions.
              </p>

              <div className="space-y-6">
                 {[
                   { icon: Check, text: "Personalized Product Scoping" },
                   { icon: Check, text: "Technical Infrastructure Review" },
                   { icon: Check, text: "Pilot Program Coordination" }
                 ].map((item, i) => (
                   <motion.div 
                    key={i} 
                    initial={{ opacity:0, x:-20 }} 
                    whileInView={{ opacity:1, x:0 }} 
                    transition={{ delay: i*0.1 }}
                    className="flex items-center gap-4"
                   >
                      <div className="h-8 w-8 rounded-full bg-[#ED5F45] text-white flex items-center justify-center">
                         <item.icon className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-700">{item.text}</span>
                   </motion.div>
                 ))}
              </div>
            </div>

            <div className="lg:w-2/3">
              <TiltCard>
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-16 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-1 bg-[#ED5F45] transition-all duration-500" 
                    style={{ width: `${formProgress}%` }}
                  />

                  <AnimatePresence mode="wait">
                    {isSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-20 text-center"
                      >
                        <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                           <CheckCircle className="h-12 w-12" />
                        </div>
                        <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter">MESSAGE SENT!</h3>
                        <p className="text-slate-500 font-bold mb-10">We&apos;ll be in touch within 24 business hours.</p>
                        <MagnetButton>
                          <Button onClick={() => resetForm()} className="bg-slate-950 text-white font-black px-10 h-14 rounded-2xl uppercase tracking-widest text-xs">
                             Send Another Message
                          </Button>
                        </MagnetButton>
                      </motion.div>
                    ) : (
                      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                          <AnimatedInput
                            id="name"
                            label="YOUR NAME"
                            register={form.register('name')}
                            value={watchedValues?.name}
                            error={form.formState.errors.name?.message}
                            required
                          />
                          <AnimatedInput
                            id="email"
                            label="EMAIL ADDRESS"
                            type="email"
                            register={form.register('email')}
                            value={watchedValues?.email}
                            error={form.formState.errors.email?.message}
                            required
                          />
                        </div>
                        <AnimatedInput
                          id="subject"
                          label="SUBJECT"
                          register={form.register('subject')}
                          value={watchedValues?.subject}
                          error={form.formState.errors.subject?.message}
                          required
                        />
                        <AnimatedInput
                          id="message"
                          label="YOUR MESSAGE"
                          register={form.register('message')}
                          value={watchedValues?.message}
                          error={form.formState.errors.message?.message}
                          required
                          isTextarea
                        />

                        <MagnetButton>
                          <Button 
                            type="submit"
                            size="lg"
                            disabled={isSubmitting || isRateLimited}
                            className="h-16 px-12 bg-[#ED5F45] hover:bg-[#D54A32] text-white font-black text-xl rounded-2xl shadow-xl shadow-[#ED5F45]/20 w-full md:w-auto transition-all"
                          >
                            {isSubmitting ? (
                              <span className="flex items-center gap-3">
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                SENDING...
                              </span>
                            ) : (
                              <span className="flex items-center gap-3 uppercase">
                                Send Message <Send className="h-5 w-5" />
                              </span>
                            )}
                          </Button>
                        </MagnetButton>
                      </form>
                    )}
                  </AnimatePresence>
                </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 md:py-40 bg-slate-50 dark:bg-slate-950 px-6">
        <div className={container}>
          <div className="text-center mb-24">
             <Badge className="mb-6 bg-slate-200 text-slate-800 px-6 py-2 rounded-full font-bold uppercase tracking-widest text-[10px]">
                Common Questions
             </Badge>
             <h2 className="text-4xl md:text-6xl font-black tracking-tight">
               FAQ
               <span className="text-[#ED5F45]">.</span>
             </h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <FAQItem key={faq.question} faq={faq} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Premium Institutional CTA */}
      <section className="py-24 md:py-40">
        <div className={container}>
          <motion.div
            initial={{ opacity: 0, scale: 0.98, rotateX: 5 }}
            whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <TiltCard>
               <div className="relative overflow-hidden bg-slate-950 rounded-[4rem] p-12 md:p-24 text-center min-h-[500px] flex flex-col justify-center border-none shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ED5F45]/40 via-transparent to-[#ED5F45]/20" />
                  <div className="relative z-10">
                    <Heart className="h-16 w-16 text-[#ED5F45] mx-auto mb-10 animate-pulse" />
                    <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white mb-8 leading-tight">
                      Ready to Modernize <br />
                      <span className="text-[#ED5F45]">Your Institution?</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-white/50 mb-12 max-w-3xl mx-auto font-medium">
                      Join 500+ departments already delivering exceptional
                      academic project management experiences.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                       <MagnetButton>
                          <Button size="lg" className="h-16 px-12 text-xl font-black bg-[#ED5F45] hover:bg-white hover:text-[#ED5F45] text-white shadow-2xl rounded-2xl transition-all" asChild>
                            <Link href="/register">
                              Start Now — It&apos;s Free <ArrowRight className="ml-3 h-6 w-6" />
                            </Link>
                          </Button>
                       </MagnetButton>
                       <MagnetButton>
                          <Button size="lg" variant="outline" className="h-16 px-12 text-xl font-bold border-2 border-white/20 text-white hover:bg-white/10 rounded-2xl backdrop-blur-md" asChild>
                            <Link href="/features">Explore Features <ChevronRight className="ml-3 h-6 w-6" /></Link>
                          </Button>
                       </MagnetButton>
                    </div>
                  </div>
               </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] leading-relaxed">
        <p>© {new Date().getFullYear()} ACADEMIA. ENGINEERED FOR EXCELLENCE.</p>
      </footer>
    </div>
  )
}

const contactInfo: ContactInfoItem[] = [
  {
    title: 'Sales',
    description: 'Pricing, pilots, and institution-wide rollout.',
    contact: 'sales@academia.com',
    icon: Building,
  },
  {
    title: 'Support',
    description: 'Account access, bugs, and day-to-day help.',
    contact: 'support@academia.com',
    icon: MessageSquare,
  },
  {
    title: 'Partnerships',
    description: 'Integrations, resellers, and research collaborations.',
    contact: 'partners@academia.com',
    icon: Users,
  },
  {
    title: 'General',
    description: 'Anything else—we read every message.',
    contact: 'hello@academia.com',
    icon: Mail,
  },
]

const faqs = [
  {
    question: 'How quickly do you respond to inquiries?',
    answer:
      'We typically respond within 24 hours on business days. For urgent production issues, priority support customers can use the in-app channel.',
  },
  {
    question: 'Do you offer personalised demos?',
    answer:
      'Yes. Share your department size and goals in the form and we will suggest a short walkthrough tailored to coordinators, heads, or IT.',
  },
  {
    question: 'Can we schedule a video call?',
    answer:
      'Absolutely. Mention your time zone and preferred slots in the message field and we will send a calendar link.',
  },
  {
    question: 'What regions do you support?',
    answer:
      'Academia is built for global institutions. Our team spans multiple time zones so we can cover follow-ups without long delays.',
  },
  {
    question: 'Is there a community or forum?',
    answer:
      'We are growing a user community for sharing workflows and templates. Ask in your message if you would like an invitation.',
  },
]
