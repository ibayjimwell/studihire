import { useState } from "react";
import { Menu, X } from "lucide-react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
  sidebarLinks,
  sidebarTitle,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex gap-4 md:gap-8">
          {/* Mobile sidebar toggle */}
          {sidebarLinks && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden fixed bottom-6 right-6 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Mobile sidebar overlay */}
          {sidebarLinks && sidebarOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-30 top-16"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          {sidebarLinks && (
            <div
              className={`${
                sidebarOpen
                  ? "fixed md:static left-0 top-16 z-40 w-64 h-[calc(100vh-64px)] md:h-auto overflow-y-auto md:overflow-visible bg-background md:bg-transparent"
                  : "hidden md:flex"
              } flex-col gap-1 md:sticky md:top-20 md:self-start`}
            >
              <Sidebar links={sidebarLinks} title={sidebarTitle} />
            </div>
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}
