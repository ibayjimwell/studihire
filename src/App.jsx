import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

// Auth Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

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
import StudentOrderWorkspace from "./pages/student/StudentOrderWorkspace";
import ClientMyOrders from "./pages/client/MyOrders";
import ClientApplicants from "./pages/client/Applicants";

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

      {/* Auth Routes - Public */}
      <Route
        path="/auth/login"
        element={user ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/auth/signup"
        element={user ? <Navigate to="/" /> : <Signup />}
      />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />

      {/* Onboarding */}
      <Route
        path="/student/onboarding"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/onboarding"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientOnboarding />
          </ProtectedRoute>
        }
      />

      {/* Student - Protected */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/gigs/new"
        element={
          <ProtectedRoute requiredRole="student">
            <GigCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/payments"
        element={
          <ProtectedRoute requiredRole="student">
            <Payments role="student" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/my-orders"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentMyOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/orders/:id"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentOrderWorkspace />
          </ProtectedRoute>
        }
      />

      {/* Client - Protected */}
      <Route
        path="/client/dashboard"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/projects/new"
        element={
          <ProtectedRoute requiredRole="client">
            <ProjectCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/payments"
        element={
          <ProtectedRoute requiredRole="client">
            <Payments role="client" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/orders"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientMyOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/applicants"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientApplicants />
          </ProtectedRoute>
        }
      />

      {/* Shared - Protected */}
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order/:id"
        element={
          <ProtectedRoute>
            <OrderWorkspace />
          </ProtectedRoute>
        }
      />

      {/* Admin - Protected */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verifications"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminVerifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/gigs"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminGigs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminProjects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminPayments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/disputes"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDisputes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminSettings />
          </ProtectedRoute>
        }
      />

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
