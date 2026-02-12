'use client'

import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { useState } from 'react'

export default function PricingPage() {
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual')
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
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Choose the perfect plan for your institution. Start free and scale as you grow.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className="text-sm text-muted-foreground">Billed</span>
              <button
                className={`px-4 py-2 rounded-full border transition-colors ${billing === 'annual' ? 'bg-primary text-white border-primary' : 'bg-background border-muted-foreground text-muted-foreground'}`}
                onClick={() => setBilling('annual')}
                aria-pressed={billing === 'annual'}
              >
                Annually
              </button>
              <button
                className={`px-4 py-2 rounded-full border transition-colors ${billing === 'monthly' ? 'bg-primary text-white border-primary' : 'bg-background border-muted-foreground text-muted-foreground'}`}
                onClick={() => setBilling('monthly')}
                aria-pressed={billing === 'monthly'}
              >
                Monthly
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">14-day free trial • No credit card required</p>
          </motion.div>
        </div>
      </section>
      <section className="pb-20">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-2 lg:max-w-4xl lg:mx-auto">
            {plans.map((plan, index) => {
              const price = plan.price === 0
                ? 0
                : billing === 'annual'
                  ? plan.price
                  : Math.round(plan.price * 1.2)
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                >
                  <Card className={plan.popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'hover:shadow-lg transition-shadow'}>
                    <CardHeader>
                      {plan.popular && (
                        <Badge className="mb-2 w-fit animate-pulse">Most Popular</Badge>
                      )}
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">{price === 0 ? 'Free' : `$${price}`}</span>
                        {price > 0 && (
                          <span className="text-muted-foreground">/month</span>
                        )}
                      </div>
                      {plan.price > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {billing === 'annual'
                            ? 'Billed annually for best rate'
                            : `Billed monthly, cancel anytime`}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature.name} className="flex items-start gap-3">
                            {feature.included ? (
                              <Check className="h-5 w-5 shrink-0 text-primary" />
                            ) : (
                              <X className="h-5 w-5 shrink-0 text-muted-foreground" />
                            )}
                            <span className={feature.included ? '' : 'text-muted-foreground line-through'}>
                              {feature.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        size="lg"
                        variant={plan.popular ? 'default' : 'outline'}
                        asChild
                      >
                        <Link href="/register/department">
                          {plan.cta}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section - Animated Accordion */}
      <section className="bg-muted py-20">
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

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-2 border-primary/20">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-4">
                  Need a custom plan?
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Contact our sales team for enterprise pricing and custom features
                </p>
                <Button size="lg" className="px-8 py-3 text-lg" asChild>
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  )
}

// FAQItem: animated accordion for FAQ
import { useState as useReactState } from 'react'
function FAQItem({ faq, index }: { faq: { question: string; answer: string }, index: number }) {
  const [open, setOpen] = useReactState(false)
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

const plans = [
  {
    name: 'Free',
    description: 'Perfect for small departments getting started',
    price: 0,
    cta: 'Get Started Free',
    popular: false,
    features: [
      { name: 'Up to 50 active projects', included: true },
      { name: 'Up to 5 advisors', included: true },
      { name: 'Basic project tracking', included: true },
      { name: 'Email notifications', included: true },
      { name: 'Community support', included: true },
      { name: 'Defense scheduling', included: false },
      { name: 'Analytics dashboard', included: false },
      { name: 'Custom workflows', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  {
    name: 'Premium',
    description: 'For departments needing advanced features and support',
    price: 199,
    cta: 'Start Free Trial',
    popular: true,
    features: [
      { name: 'Unlimited projects', included: true },
      { name: 'Unlimited advisors', included: true },
      { name: 'Advanced project tracking', included: true },
      { name: 'Email & SMS notifications', included: true },
      { name: 'Priority support', included: true },
      { name: 'Defense scheduling', included: true },
      { name: 'Analytics dashboard', included: true },
      { name: 'Custom workflows', included: true },
      { name: 'Dedicated account manager', included: true },
    ],
  },
]

const faqs = [
  {
    question: 'Can I change plans later?',
    answer: 'Yes! You can upgrade from Free to Premium at any time. Changes take effect immediately.',
  },
  {
    question: 'What happens after the free trial?',
    answer: 'You can continue using the Free plan indefinitely, or upgrade to Premium to unlock advanced features.',
  },
  {
    question: 'How is billing handled?',
    answer: 'We bill annually by default for the best rate, but monthly billing is also available. All payments are processed securely.',
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No setup fees ever. You only pay for your Premium subscription, and you can cancel anytime.',
  },
  {
    question: 'Do you offer educational discounts?',
    answer: 'Yes! We offer special pricing for educational institutions. Contact our sales team to learn more.',
  },
]