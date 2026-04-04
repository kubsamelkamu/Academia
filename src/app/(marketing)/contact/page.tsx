'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
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
} from 'lucide-react'

const container = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'

type ContactInfoItem = {
  title: string
  description: string
  contact: string
  icon: LucideIcon
  accent: 'sky' | 'violet' | 'emerald' | 'amber'
}

const contactAccent: Record<ContactInfoItem['accent'], { border: string; iconBg: string; icon: string }> = {
  sky: {
    border: 'border-sky-200/60 dark:border-sky-800/50',
    iconBg: 'bg-sky-100 dark:bg-sky-950/70',
    icon: 'text-sky-600 dark:text-sky-400',
  },
  violet: {
    border: 'border-violet-200/60 dark:border-violet-800/50',
    iconBg: 'bg-violet-100 dark:bg-violet-950/70',
    icon: 'text-violet-600 dark:text-violet-400',
  },
  emerald: {
    border: 'border-emerald-200/60 dark:border-emerald-800/50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    border: 'border-amber-200/60 dark:border-amber-800/50',
    iconBg: 'bg-amber-100 dark:bg-amber-950/70',
    icon: 'text-amber-600 dark:text-amber-400',
  },
}

type ContactCardProps = {
  info: ContactInfoItem
  index: number
}

function ContactCard({ info, index }: ContactCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const a = contactAccent[info.accent]
  const Icon = info.icon

  const handleCopy = () => {
    void navigator.clipboard.writeText(info.contact)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleCopy}
      className={cn(
        'group w-full rounded-2xl border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md',
        a.border,
      )}
    >
      <div className={cn('mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform', a.iconBg, isHovered && 'scale-105')}>
        <Icon className={cn('h-6 w-6', a.icon)} aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{info.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{info.description}</p>
      <div className="mt-4">
        <span
          className={cn(
            'inline-flex items-center rounded-lg border px-3 py-1.5 font-mono text-xs font-medium transition-colors',
            isCopied
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-border/80 bg-muted/40 text-foreground group-hover:bg-muted/60',
          )}
        >
          {isCopied ? (
            <>
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Copied
            </>
          ) : (
            info.contact
          )}
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Click to copy address</p>
    </motion.button>
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
    <div className="relative">
      <Label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute left-3 z-10 transition-all',
          isFocused || hasValue ? '-top-2.5 text-xs text-sky-600 dark:text-sky-400' : 'top-3 text-sm text-muted-foreground',
        )}
      >
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
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
          'rounded-xl border-border/80 bg-background/80 pt-5 transition-shadow dark:bg-background/50',
          isFocused && 'border-sky-500/50 ring-2 ring-sky-500/20',
          error && 'border-destructive ring-destructive/20',
        )}
        rows={isTextarea ? 5 : undefined}
      />
      {error ? (
        <p className="mt-1.5 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  )
}

function FAQItem({ faq, index }: { faq: { question: string; answer: string }; index: number }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-border/70 bg-card/90 shadow-sm"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="flex items-start gap-3">
          <HelpCircle
            className={cn('mt-0.5 h-5 w-5 shrink-0', isOpen ? 'text-sky-600 dark:text-sky-400' : 'text-muted-foreground')}
            aria-hidden
          />
          <span className="font-semibold text-foreground">{faq.question}</span>
        </span>
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex gap-3 border-t border-border/50 px-5 pb-5 pt-3">
              <div className="mt-1 h-full min-h-[2rem] w-1 shrink-0 rounded-full bg-gradient-to-b from-sky-500 to-violet-500" />
              <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ContactPage() {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  })

  const { submitContactForm, isSubmitting, isSuccess, error, resetForm, isRateLimited } = useContactSubmission()

  useEffect(() => {
    if (!isSuccess) return
    const timer = setTimeout(() => {
      resetForm()
    }, 5000)
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
    } catch {
      // handled by mutation + store
    }
  }

  return (
    <div className="min-w-0 overflow-x-hidden">
      {/* Hero */}
      <section className="relative border-b border-border/50 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-sky-400/12 blur-[100px] dark:bg-sky-500/10" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[280px] w-[320px] rounded-full bg-violet-400/10 blur-[90px] dark:bg-violet-500/8" aria-hidden />

        <div className={cn(container, 'relative py-16 sm:py-20 lg:py-24')}>
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
            <motion.div
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <Badge className="mb-4 inline-flex gap-1.5 border-sky-200/80 bg-sky-100/80 px-3 py-1 text-xs font-semibold text-sky-800 dark:border-sky-800/70 dark:bg-sky-950/60 dark:text-sky-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Let&apos;s connect
              </Badge>
              <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-5xl xl:text-6xl">
                <span className="bg-gradient-to-r from-sky-600 via-blue-500 to-violet-600 bg-clip-text text-transparent dark:from-sky-400 dark:via-blue-400 dark:to-violet-400">
                  Get in touch
                </span>
                <span className="text-foreground"> with our team</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground lg:mx-0 sm:text-lg">
                Questions about Academia, pricing, or a pilot for your department? We&apos;re here to help—usually within one business day.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground lg:justify-start">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden />
                  ~24h response on weekdays
                </span>
                <span className="hidden h-4 w-px bg-border sm:block" />
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden />
                  hello@academia.com
                </span>
              </div>
            </motion.div>

            <motion.div
              className="relative w-full max-w-md flex-shrink-0 lg:max-w-none lg:w-[40%]"
              initial={{ opacity: 0, x: 28, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.06 }}
            >
              <div className="absolute -inset-2 rounded-[1.6rem] bg-gradient-to-br from-sky-400/20 via-blue-500/10 to-violet-500/15 blur-xl" />
              <div className="relative overflow-hidden rounded-[1.5rem] border border-border/60 shadow-2xl">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src="/sign-in-campus2.jpg"
                    alt="Campus building"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-sky-200">We&apos;re global</p>
                      <p className="text-sm font-bold text-white">Campuses on every continent</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-md">
                        <MapPin className="h-4 w-4 text-white" aria-hidden />
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-md">
                        <Phone className="h-4 w-4 text-white" aria-hidden />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact channels */}
      <section className="border-b border-border/50 bg-muted/20 py-16 dark:bg-muted/10 sm:py-20">
        <div className={container}>
          <motion.div
            className="mx-auto mb-12 max-w-2xl text-center"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-3 border-violet-200/80 bg-violet-100/70 px-3 py-1 text-xs font-semibold text-violet-800 dark:border-violet-800/60 dark:bg-violet-950/50 dark:text-violet-200">
              <MessageSquare className="mr-1.5 inline h-3.5 w-3.5" />
              Direct lines
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose the right inbox</h2>
            <p className="mt-3 text-pretty text-muted-foreground sm:text-lg">
              Tap a card to copy the email—we route your message to the right team automatically.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contactInfo.map((info, index) => (
              <ContactCard key={info.title} info={info} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className={container}>
          <motion.div
            className="mx-auto mb-10 max-w-2xl text-center"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-3 border-emerald-200/80 bg-emerald-100/70 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200">
              <Mail className="mr-1.5 inline h-3.5 w-3.5" />
              Send a message
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Write to us</h2>
            <p className="mt-3 text-muted-foreground sm:text-lg">
              Share context and we&apos;ll reply with next steps—demos, security reviews, or general questions.
            </p>
          </motion.div>

          <div className="mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl"
            >
              <div
                className="h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500 transition-[width] duration-300"
                style={{ width: `${formProgress}%` }}
              />
              <Card className="border-0 shadow-none">
                <CardHeader className="space-y-1 border-b border-border/50 bg-muted/20 pb-6 text-center">
                  <CardTitle className="text-xl sm:text-2xl">Contact form</CardTitle>
                  <CardDescription>
                    {formProgress === 100 ? (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">All fields look good—ready to send.</span>
                    ) : (
                      'All fields are required.'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  <AnimatePresence mode="wait">
                    {isSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="py-10 text-center"
                      >
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15">
                          <CheckCircle className="h-9 w-9 text-emerald-600 dark:text-emerald-400" aria-hidden />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Message sent</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                          Thanks for reaching out. We&apos;ll get back to you within 24 hours on business days.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                          <Badge variant="outline" className="rounded-lg px-3 py-1.5 text-xs font-normal">
                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                            Typical reply: &lt; 24h
                          </Badge>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="form"
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="grid gap-6 md:grid-cols-2">
                          <AnimatedInput
                            id="name"
                            label="Full name"
                            register={form.register('name')}
                            value={watchedValues?.name}
                            error={form.formState.errors.name?.message}
                            required
                          />
                          <AnimatedInput
                            id="email"
                            label="Email"
                            type="email"
                            register={form.register('email')}
                            value={watchedValues?.email}
                            error={form.formState.errors.email?.message}
                            required
                          />
                        </div>
                        <AnimatedInput
                          id="subject"
                          label="Subject"
                          register={form.register('subject')}
                          value={watchedValues?.subject}
                          error={form.formState.errors.subject?.message}
                          required
                        />
                        <AnimatedInput
                          id="message"
                          label="Message"
                          register={form.register('message')}
                          value={watchedValues?.message}
                          error={form.formState.errors.message?.message}
                          required
                          isTextarea
                        />
                        {watchedValues?.message && watchedValues.message.length > 0 ? (
                          <p className="text-right text-xs text-muted-foreground">
                            {watchedValues.message.length}/500 characters
                          </p>
                        ) : null}
                        {error ? (
                          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {error}
                          </div>
                        ) : null}
                        <Button
                          type="submit"
                          size="lg"
                          disabled={isSubmitting || isRateLimited}
                          className="group h-12 w-full rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 text-base font-semibold shadow-lg shadow-sky-500/20 hover:from-sky-700 hover:to-blue-700 dark:from-sky-500 dark:to-blue-500"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Sending…
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <Send className="h-4 w-4" />
                              Send message
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </span>
                          )}
                        </Button>
                        {formProgress > 0 && formProgress < 100 ? (
                          <p className="text-center text-xs text-muted-foreground">
                            {Math.round(100 - formProgress)}% left to complete
                          </p>
                        ) : null}
                      </motion.form>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/50 bg-muted/15 py-16 dark:bg-muted/10 sm:py-20">
        <div className={container}>
          <motion.div
            className="mx-auto mb-10 max-w-2xl text-center"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-3 border-amber-200/80 bg-amber-100/70 px-3 py-1 text-xs font-semibold text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200">
              <HelpCircle className="mr-1.5 inline h-3.5 w-3.5" />
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Common questions</h2>
            <p className="mt-3 text-muted-foreground sm:text-lg">Quick answers before you write in.</p>
          </motion.div>
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq, index) => (
              <FAQItem key={faq.question} faq={faq} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="pb-16 sm:pb-20 lg:pb-24">
        <div className={container}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-sky-200/40 bg-gradient-to-br from-sky-600/90 via-blue-600/90 to-violet-700/90 p-8 text-white shadow-2xl shadow-sky-900/25 sm:p-10 dark:border-sky-900/40 dark:from-sky-800 dark:via-blue-800 dark:to-violet-900"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <Badge className="mb-3 border-white/30 bg-white/15 text-white backdrop-blur-sm">
                  <Rocket className="mr-1.5 h-3.5 w-3.5" />
                  Product updates
                </Badge>
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">Subscribe to the newsletter</h3>
                <p className="mt-2 max-w-md text-sm text-sky-100">
                  Release notes, campus stories, and tips for running academic projects—no spam.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <Input
                  placeholder="you@university.edu"
                  type="email"
                  className="h-11 rounded-xl border-white/25 bg-white/10 text-white placeholder:text-sky-200/70 focus-visible:ring-white/30"
                />
                <Button
                  type="button"
                  className="h-11 shrink-0 rounded-xl bg-white font-semibold text-sky-700 hover:bg-white/90"
                >
                  Subscribe
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="relative mt-4 text-xs text-sky-100/80">We respect your privacy. Unsubscribe anytime.</p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

const contactInfo: ContactInfoItem[] = [
  {
    title: 'Sales',
    description: 'Pricing, pilots, and institution-wide rollout.',
    contact: 'sales@academia.com',
    icon: Building,
    accent: 'sky',
  },
  {
    title: 'Support',
    description: 'Account access, bugs, and day-to-day help.',
    contact: 'support@academia.com',
    icon: MessageSquare,
    accent: 'violet',
  },
  {
    title: 'Partnerships',
    description: 'Integrations, resellers, and research collaborations.',
    contact: 'partners@academia.com',
    icon: Users,
    accent: 'emerald',
  },
  {
    title: 'General',
    description: 'Anything else—we read every message.',
    contact: 'hello@academia.com',
    icon: Mail,
    accent: 'amber',
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
