import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

// Pages
import Home from "./pages/Home";
import StudentOnboarding from "./pages/student/Onboarding";
import ClientOnboarding from "./pages/client/Onboarding";
import StudentDashboard from "./pages/student/Dashboard";
import ClientDashboard from "./pages/client/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminVerifications from "./pages/admin/Verifications";
import AdminUsers from "./pages/admin/Users";
import AdminGigs from "./pages/admin/Gigs";
import AdminProjects from "./pages/admin/Projects";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminReports from "./pages/admin/Reports";
import AdminDisputes from "./pages/admin/Disputes";
import AdminSettings from "./pages/admin/Settings";
import GigsBrowse from "./pages/GigsBrowse";
import GigDetail from "./pages/GigDetail";
import GigCreate from "./pages/student/GigCreate.jsx";
import ProjectsBrowse from "./pages/ProjectsBrowse";
import ProjectCreate from "./pages/client/ProjectCreate";
import Messages from "./pages/Messages";
import Payments from "./pages/Payments";
import GetStarted from "./pages/GetStarted";
import StudentProfile from "./pages/student/Profile";
import Checkout from "./pages/Checkout";
import OrderWorkspace from "./pages/OrderWorkspace";
import StudentMyOrders from "./pages/student/MyOrders";
import ClientMyOrders from "./pages/client/MyOrders";

const AuthenticatedApp = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading StudiHire...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/get-started" element={<GetStarted />} />
      <Route path="/gigs" element={<GigsBrowse />} />
      <Route path="/gigs/:id" element={<GigDetail />} />
      <Route path="/projects" element={<ProjectsBrowse />} />

      {/* Onboarding */}
      <Route path="/student/onboarding" element={<StudentOnboarding />} />
      <Route path="/client/onboarding" element={<ClientOnboarding />} />

      {/* Student */}
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/student/profile" element={<StudentProfile />} />
      <Route path="/student/gigs/new" element={<GigCreate />} />
      <Route path="/student/payments" element={<Payments role="student" />} />
      <Route path="/student/orders" element={<StudentMyOrders />} />

      {/* Client */}
      <Route path="/client/dashboard" element={<ClientDashboard />} />
      <Route path="/client/projects/new" element={<ProjectCreate />} />
      <Route path="/client/payments" element={<Payments role="client" />} />
      <Route path="/client/orders" element={<ClientMyOrders />} />

      {/* Shared */}
      <Route path="/messages" element={<Messages />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order/:id" element={<OrderWorkspace />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/verifications" element={<AdminVerifications />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/gigs" element={<AdminGigs />} />
      <Route path="/admin/projects" element={<AdminProjects />} />
      <Route path="/admin/payments" element={<AdminPayments />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/admin/disputes" element={<AdminDisputes />} />
      <Route path="/admin/settings" element={<AdminSettings />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
