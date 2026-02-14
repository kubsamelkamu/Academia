


import type { Metadata } from 'next'
// SEO meta tags for Contact page
export const metadata: Metadata = {
  title: 'Contact | Academia - Academic Project Management',
  description: 'Contact Academia for support, partnership, or general inquiries. We are here to help academic institutions and students succeed.',
  openGraph: {
    title: 'Contact | Academia - Academic Project Management',
    description: 'Contact Academia for support, partnership, or general inquiries. We are here to help academic institutions and students succeed.',
    url: 'https://academia.et/contact',
    siteName: 'Academia',
    images: [
      {
        url: '/favicon.png',
        width: 256,
        height: 256,
        alt: 'Academia Graduation Cap Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact | Academia - Academic Project Management',
    description: 'Contact Academia for support, partnership, or general inquiries. We are here to help academic institutions and students succeed.',
    images: ['/favicon.png'],
    site: '@academia',
  },
}

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Send,
  CheckCircle,
  MessageSquare,
  Users,
  Building,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setSubmitted(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/50 to-primary/5 py-20 md:py-32">
        <motion.div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          animate={{ x: [0, 100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge variant="secondary" className="mb-4 animate-pulse">Get in Touch</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Contact Us
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Have questions about Academia? Need support or want to learn more? We&apos;re here to help.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="cursor-pointer"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <info.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{info.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground">{info.description}</p>
                    <p className="mt-2 font-semibold text-primary">{info.contact}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we&apos;ll get back to you within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                      <p className="text-muted-foreground">Thank you for contacting us. We&apos;ll respond soon.</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={5}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <FAQItem key={faq.question} faq={faq} index={index} />
              ))}
            </div>
          </div>
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
    answer: 'We typically respond to all inquiries within 24 hours during business days.',
  },
  {
    question: 'Do you offer demos?',
    answer: 'Yes! We offer personalized demos for institutions interested in Academia.',
  },
  {
    question: 'Can I schedule a call?',
    answer: 'Absolutely. Use the contact form above or email us to schedule a convenient time.',
  },
  {
    question: 'Are you available internationally?',
    answer: 'Yes, Academia serves institutions worldwide with 24/7 support in multiple languages.',
  },
]

// FAQItem: animated accordion for FAQ
function FAQItem({ faq, index }: { faq: { question: string; answer: string }, index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="overflow-hidden">
        <button
          className="w-full text-left px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="font-semibold text-lg">{faq.question}</span>
          <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {open && (
          <CardContent className="pt-0 pb-4 px-6 text-muted-foreground animate-fade-in">
            {faq.answer}
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}