import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children, sidebarLinks, sidebarTitle }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {sidebarLinks && (
            <Sidebar links={sidebarLinks} title={sidebarTitle} />
          )}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}