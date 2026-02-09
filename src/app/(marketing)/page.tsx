import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Users, FileText, Calendar } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Academic Project Management
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline student projects, advisor assignments, and defense scheduling 
            in one collaborative platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multi-Role Support</CardTitle>
              </CardHeader>
              <CardContent>
                Coordinators, advisors, and students work seamlessly together 
                with role-specific dashboards.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Project Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                Monitor milestones, submissions, and evaluations in real-time 
                with automated notifications.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Defense Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                Coordinate defense dates, committee members, and venue logistics 
                effortlessly.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Built for Academic Institutions
              </h2>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0" />
                  <span>Multi-tenancy support for multiple departments</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0" />
                  <span>Automated workflow notifications</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0" />
                  <span>Comprehensive evaluation tools</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0" />
                  <span>Analytics and reporting dashboards</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg h-96 flex items-center justify-center">
              <span className="text-muted-foreground">[Dashboard Preview Image]</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Academic Workflow?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join universities worldwide using Academia for project management.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
