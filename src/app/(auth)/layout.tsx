import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/30">
      <Header />
      <main className="flex min-h-0 w-full flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  )
}