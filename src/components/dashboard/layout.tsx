import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"

// TODO: Replace with actual session data from your auth system
const mockUser = {
  id: "1",
  name: "John Doe",
  email: "john.doe@university.edu",
  role: "advisor" as const, // Change this to test different roles
  avatar: undefined,
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block">
        <Sidebar user={mockUser} />
      </aside>

      {/* Mobile Sidebar */}
      <MobileSidebar user={mockUser} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader notificationCount={3} />
        <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}