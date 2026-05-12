import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-[#ED5F45]/8 to-[#ED5F45]/12 dark:from-slate-950 dark:via-slate-950 dark:to-[#ED5F45]/10">
      <Header />
      <main className="flex min-h-0 w-full flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  )
}