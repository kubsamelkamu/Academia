'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useState, useRef, useMemo, useEffect } from 'react'
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
  Star,
  ThumbsUp,
  UserPlus,
  Zap,
} from 'lucide-react'

type ContactInfoItem = {
  title: string
  description: string
  contact: string
  icon: LucideIcon
}

type ContactCardProps = {
  info: ContactInfoItem
  index: number
  onSelect?: (info: ContactInfoItem) => void
}

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ParticleBackground = () => {
  const particles = useMemo(() => {
    const rand = mulberry32(0xacade1)
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      size: rand() * 4 + 1,
      duration: rand() * 20 + 10,
      driftX: rand() * 20 - 10,
    }))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/10"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, particle.driftX, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

const GradientText = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent bg-300% animate-gradient">
    {children}
  </span>
)

const ContactCard = ({ info, index, onSelect }: ContactCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.15,
        type: "spring",
        stiffness: 100
      }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="cursor-pointer group"
      onClick={() => {
        handleCopy(info.contact)
        onSelect?.(info)
      }}
    >
      <Card className="h-full relative overflow-hidden border-2 transition-colors hover:border-primary/50">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.5,
          }}
          transition={{ duration: 0.3 }}
        />
        
        <motion.div
          className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full"
          animate={{ 
            scale: isHovered ? 1.2 : 1,
            rotate: isHovered ? 5 : 0
          }}
        />

        <CardHeader className="text-center relative z-10">
          <motion.div 
            className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors"
            animate={{ 
              rotate: isHovered ? 360 : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ duration: 0.5 }}
          >
            <info.icon className="h-7 w-7 text-primary" />
          </motion.div>
          <CardTitle className="text-xl mb-2">{info.title}</CardTitle>
          <CardDescription className="text-sm">{info.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="text-center relative z-10">
          <motion.div
            animate={{ scale: isCopied ? 1.05 : 1 }}
            className="inline-block"
          >
            <Badge 
              variant={isCopied ? "default" : "outline"}
              className="mt-2 text-sm font-mono cursor-pointer hover:bg-primary/10 transition-colors"
            >
              {isCopied ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" /> Copied!
                </motion.span>
              ) : (
                info.contact
              )}
            </Badge>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            className="text-xs text-muted-foreground mt-3"
          >
            Click to copy email
          </motion.p>
        </CardContent>
      </Card>
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

const AnimatedInput = ({ id, label, type = "text", register, value = '', error, required, isTextarea = false }: AnimatedInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value.length > 0

  const Component = isTextarea ? Textarea : Input

  return (
    <motion.div
      className="relative"
      animate={{ y: isFocused ? -2 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <Label
        htmlFor={id}
        className={`absolute left-3 transition-all pointer-events-none ${
          isFocused || hasValue
            ? '-top-6 text-xs text-primary'
            : 'top-3 text-muted-foreground'
        }`}
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Component
        id={id}
        type={type}
        {...register}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`mt-1 transition-all duration-200 ${
          isFocused ? 'border-primary ring-2 ring-primary/20' : ''
        } ${error ? 'border-destructive' : ''}`}
        rows={isTextarea ? 5 : undefined}
      />
      {error && (
        <motion.p
          className="text-sm text-destructive mt-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-primary"
        initial={{ width: 0 }}
        animate={{ width: isFocused ? '100%' : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}

const FAQItem = ({ faq, index }: { faq: { question: string; answer: string }, index: number }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className={`overflow-hidden transition-all duration-300 ${
        isOpen ? 'border-primary/30 shadow-lg' : ''
      }`}>
        <button
          className="w-full text-left px-6 py-5 focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between group"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isHovered ? 10 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <HelpCircle className={`h-5 w-5 transition-colors ${
                isOpen ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </motion.div>
            <span className="font-semibold text-lg group-hover:text-primary transition-colors">
              {faq.question}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CardContent className="pt-0 pb-5 px-6">
                <motion.div
                  initial={{ y: -10 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-1 h-8 bg-gradient-to-b from-primary to-purple-500 rounded-full" />
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

export default function ContactPage() {

  const [selectedContact, setSelectedContact] = useState<ContactInfoItem | null>(null)

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

  // Auto-hide success message after 5 seconds.
  // This only resets the mutation/store state (no form.reset here), so it won't cause render loops.
  useEffect(() => {
    if (!isSuccess) return
    const timer = setTimeout(() => {
      resetForm()
    }, 5000)
    return () => clearTimeout(timer)
  }, [isSuccess, resetForm])

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95])
  const watchedValues = useWatch({ control: form.control })

  const formProgress = useMemo(() => {
    const values = watchedValues
    const filledFields = Object.values(values || {}).filter((val) => val && val.trim().length > 0).length
    return (filledFields / 4) * 100
  }, [watchedValues])

  const handleSubmit = async (data: ContactFormData) => {
    try {
      await submitContactForm(data)
      form.reset()
    } catch {
      // Errors are handled by the mutation + store; don't reset the form.
    }
  }

  return (
    <>
      <section ref={heroRef} className="relative overflow-hidden min-h-[70vh] flex items-center">
        <ParticleBackground />
        
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-background via-muted/50 to-primary/5"
          style={{ opacity: heroOpacity }}
        >
          <motion.div 
            className="absolute inset-0"
            style={{ scale: heroScale }}
          >
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </motion.div>
        </motion.div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            >
              <Badge variant="outline" className="mb-6 px-4 py-2 text-base border-primary/30">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                <GradientText>Let&apos;s Connect</GradientText>
              </Badge>
            </motion.div>

            <motion.h1 
              className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Get in{' '}
              <span className="relative inline-block">
                <GradientText>Touch</GradientText>
                <motion.div
                  className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 1 }}
                />
              </span>
            </motion.h1>

            <motion.p 
              className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Have questions about <span className="font-semibold text-primary">Academia</span>? 
              We&apos;re here to help transform your educational journey.
            </motion.p>
          </motion.div>
        </div>
      </section>
      
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4">
              <MessageSquare className="h-4 w-4 mr-2" />
              Connect With Us
            </Badge>
            <h2 className="text-3xl font-bold">Choose How to Reach Us</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Select the department that best fits your needs and we&apos;ll ensure your message reaches the right team
            </p>
          </motion.div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {contactInfo.map((info, index) => (
              <ContactCard 
                key={info.title} 
                info={info} 
                index={index}
                onSelect={setSelectedContact}
              />
            ))}
          </div>

          <AnimatePresence>
            {selectedContact && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 text-center"
              >
                <Badge variant="outline" className="px-4 py-2">
                  <Mail className="h-4 w-4 mr-2" />
                  You selected: {selectedContact.contact}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge variant="secondary" className="mb-4">
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </Badge>
            <h2 className="text-3xl font-bold">Get in Touch Directly</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Fill out the form below and we&apos;ll get back to you within 24 hours
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 shadow-xl overflow-hidden">
                <motion.div 
                  className="h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${formProgress}%` }}
                  transition={{ duration: 0.3 }}
                />

                <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
                  <div className="flex items-center gap-2 justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                    <CardTitle className="text-2xl">Send us a Message</CardTitle>
                  </div>
                  <CardDescription className="text-center">
                    {formProgress === 100 && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="block mt-2 text-green-600"
                      >
                        ✓ All fields completed! Ready to submit.
                      </motion.span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  <AnimatePresence mode="wait">
                    {isSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-center py-12"
                      >
                        <motion.div
                          animate={{ 
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.2, 1.2, 1]
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                        </motion.div>
                        <h3 className="text-2xl font-bold mb-3">Message Sent Successfully!</h3>
                        <p className="text-muted-foreground mb-6">
                          Thank you for contacting Academia. We&apos;ll respond within 24 hours.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                          <Badge variant="outline" className="px-4 py-2">
                            <Clock className="h-4 w-4 mr-2" />
                            Response time: ~2h
                          </Badge>
                          <Badge variant="outline" className="px-4 py-2">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Message sent successfully
                          </Badge>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                          <AnimatedInput
                            id="name"
                            label="Full Name"
                            register={form.register('name')}
                            value={watchedValues?.name}
                            error={form.formState.errors.name?.message}
                            required
                          />
                          <AnimatedInput
                            id="email"
                            label="Email Address"
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
                          label="Your Message"
                          register={form.register('message')}
                          value={watchedValues?.message}
                          error={form.formState.errors.message?.message}
                          required
                          isTextarea
                        />

                        {watchedValues?.message && watchedValues.message.length > 0 && (
                          <motion.div 
                            className="text-xs text-right text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            {watchedValues.message.length}/500 characters
                          </motion.div>
                        )}

                        {error && (
                          <motion.div
                            className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {error}
                          </motion.div>
                        )}

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            type="submit"
                            size="lg"
                            className="w-full group relative overflow-hidden"
                            disabled={isSubmitting || isRateLimited}
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600"
                              initial={{ x: '100%' }}
                              whileHover={{ x: 0 }}
                              transition={{ duration: 0.3 }}
                            />
                            <span className="relative z-10 flex items-center justify-center">
                              {isSubmitting ? (
                                <>
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                  />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                                  Send Message
                                  <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </>
                              )}
                            </span>
                          </Button>
                        </motion.div>

                        {formProgress > 0 && formProgress < 100 && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-center text-muted-foreground"
                          >
                            {100 - formProgress}% more to complete the form
                          </motion.p>
                        )}
                      </motion.form>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4">
              <HelpCircle className="h-4 w-4 mr-2" />
              Got Questions?
            </Badge>
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mt-2">
              Find quick answers to common questions about Academia
            </p>
          </motion.div>

          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={faq.question} faq={faq} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20">
        <div className="container">
          <Card className="border-2 border-primary/20 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <Badge variant="outline" className="mb-4 border-primary/30">
                      <Zap className="h-4 w-4 mr-2 text-primary" />
                      Stay Updated
                    </Badge>
                    <h3 className="text-2xl font-bold mb-3">
                      Subscribe to our <GradientText>Newsletter</GradientText>
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Get the latest updates, features, and educational insights delivered to your inbox.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input 
                        placeholder="Enter your email" 
                        className="flex-1"
                        type="email"
                      />
                      <Button>
                        Subscribe
                        <Rocket className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      We respect your privacy. Unsubscribe at any time.
                    </p>
                  </motion.div>
                </div>
                
                <div className="relative hidden md:block">
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.05, 1.05, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <Mail className="h-32 w-32 text-primary/10" />
                  </motion.div>
                  <div className="grid grid-cols-3 gap-3 relative z-10">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, delay: 0, repeat: Infinity }}
                    >
                      <Star className="h-8 w-8 text-yellow-500/30" />
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, delay: 0.3, repeat: Infinity }}
                    >
                      <ThumbsUp className="h-8 w-8 text-blue-500/30" />
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, delay: 0.6, repeat: Infinity }}
                    >
                      <UserPlus className="h-8 w-8 text-green-500/30" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  )
}

const contactInfo = [
  {
    title: 'Sales',
    description: 'Interested in Academia for your institution?',
    contact: 'sales@academia.com',
    icon: Building,
  },
  {
    title: 'Support',
    description: 'Need help with your account or platform?',
    contact: 'support@academia.com',
    icon: MessageSquare,
  },
  {
    title: 'Partnerships',
    description: 'Explore collaboration opportunities.',
    contact: 'partners@academia.com',
    icon: Users,
  },
  {
    title: 'General',
    description: 'Any other questions or feedback?',
    contact: 'hello@academia.com',
    icon: Mail,
  },
]

const faqs = [
  {
    question: 'How quickly do you respond to inquiries?',
    answer: 'We typically respond to all inquiries within 24 hours during business days. For urgent matters, our live chat support is available 24/7.',
  },
  {
    question: 'Do you offer personalized demos?',
    answer: 'Yes! We offer personalized demos for institutions interested in Academia. You can schedule a demo through our quick actions panel or contact our sales team directly.',
  },
  {
    question: 'Can I schedule a video call?',
    answer: 'Absolutely! We offer video consultations to better understand your institution\'s needs. Use the contact form above or click the "Schedule a Demo" button in the quick actions panel.',
  },
  {
    question: 'What time zones do you support?',
    answer: 'Academia serves institutions worldwide with 24/7 support in multiple languages. Our team is distributed across different time zones to ensure round-the-clock assistance.',
  },
  {
    question: 'Is there a community forum?',
    answer: 'Yes! We have an active community forum where Academia users share experiences, tips, and best practices. You\'ll receive an invitation after creating your account.',
  },
]