// src/App.tsx (Improved)
// Enhancements: Added dark mode support with system preference and toggle (assuming Navbar has a toggle button).
// Improved structure for better readability. Ensured mobile responsiveness with flexible layouts.
// No changes to admin/driver/superadmin routes as per instructions.
import { LanguageProvider } from './context/LanguageContext';
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RouteGuard } from "@/components/RouteGuard";
import { SuperAdminRouteGuard } from "@/components/SuperAdminRouteGuard";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import BookTickets from "./pages/BookTickets";
import MyBookings from "./pages/MyBookings";
import CheckEmail from "./pages/CheckEmail";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import StaffLogin from "./pages/StaffLogin";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminBuses from "./pages/admin/Buses";
import AdminRoutes from "./pages/admin/Routes";
import AdminTrips from "./pages/admin/Trips";
import AdminBookings from "./pages/admin/Bookings";
import AdminCancellations from "./pages/admin/Cancellations";
import AdminTicketRetry from "./pages/admin/TicketRetry";
import AdminStaff from "./pages/admin/Staff";
import PaymentSettings from "./pages/admin/PaymentSettings";
import TrackingSettings from "./pages/admin/TrackingSettings";
import TripAssignments from "./pages/admin/TripAssignments";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminFleet from "./pages/admin/Fleet";
import Driver from "./pages/Driver";
import TripManifest from "./pages/driver/TripManifest";
import TrackBus from "./pages/TrackBus";
import SuperAdminLogin from "./pages/superadmin/Login";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import ClientControl from "./pages/superadmin/ClientControl";
import AuditLogs from "./pages/superadmin/AuditLogs";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Set initial dark mode based on system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);

    return () => subscription.unsubscribe();
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <LanguageProvider>
        <BrowserRouter>
          <div className={`flex flex-col min-h-screen ${darkMode ? "dark" : ""}`}>
            <Navbar user={user} toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            <main className="flex-1">
              <Routes>
                {/* Public Routes - redirect admins/staff to their dashboards */}
                <Route path="/" element={
                  <RouteGuard allowedRoles={["user", "guest"]}>
                    <Home />
                  </RouteGuard>
                } />
                <Route path="/about" element={
                  <RouteGuard allowedRoles={["user", "guest"]}>
                    <About />
                  </RouteGuard>
                } />
                <Route path="/services" element={
                  <RouteGuard allowedRoles={["user", "guest"]}>
                    <Services />
                  </RouteGuard>
                } />
                <Route path="/contact" element={
                  <RouteGuard allowedRoles={["user", "guest"]}>
                    <Contact />
                  </RouteGuard>
                } />
                <Route path="/terms" element={
                  <RouteGuard allowedRoles={["user", "guest"]}>
                    <Terms />
                  </RouteGuard>
                } />
                <Route path="/privacy" element={
                  <RouteGuard allowedRoles={["user", "guest"]}>
                    <Privacy />
                  </RouteGuard>
                } />
                
                {/* Auth Routes - accessible to guests and users */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/check-email" element={<CheckEmail />} />
                <Route path="/staff-login" element={<StaffLogin />} />
                
                {/* User Routes - only for regular users */}
                <Route path="/book" element={
                  <RouteGuard allowedRoles={["user", "guest"]}>
                    <BookTickets />
                  </RouteGuard>
                } />
                <Route path="/my-bookings" element={
                  <RouteGuard allowedRoles={["user"]}>
                    <MyBookings />
                  </RouteGuard>
                } />
                <Route path="/track/:bookingId" element={
                  <RouteGuard allowedRoles={["user"]}>
                    <TrackBus />
                  </RouteGuard>
                } />
                
                {/* Staff Routes - only for staff */}
                <Route path="/driver" element={
                  <RouteGuard allowedRoles={["staff"]}>
                    <Driver />
                  </RouteGuard>
                } />
                <Route path="/driver/manifest/:tripId" element={
                  <RouteGuard allowedRoles={["staff"]}>
                    <TripManifest />
                  </RouteGuard>
                } />
                
                {/* Admin Routes - only for admins */}
                <Route path="/admin" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </RouteGuard>
                } />
                <Route path="/admin/buses" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <AdminBuses />
                  </RouteGuard>
                } />
                <Route path="/admin/routes" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <AdminRoutes />
                  </RouteGuard>
                } />
                <Route path="/admin/trips" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <AdminTrips />
                  </RouteGuard>
                } />
                <Route path="/admin/bookings" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <AdminBookings />
                  </RouteGuard>
                } />
                <Route path="/admin/cancellations" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <AdminCancellations />
                  </RouteGuard>
                } />
                <Route path="/admin/staff" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <AdminStaff />
                  </RouteGuard>
                } />
                <Route path="/admin/ticket-retry" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <AdminTicketRetry />
                  </RouteGuard>
                } />
                <Route path="/admin/payment-settings" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <PaymentSettings />
                  </RouteGuard>
                } />
                <Route path="/admin/trip-assignments" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <TripAssignments />
                  </RouteGuard>
                } />
                <Route path="/admin/tracking-settings" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <TrackingSettings />
                  </RouteGuard>
                } />
                <Route path="/admin/analytics" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <AdminAnalytics />
                  </RouteGuard>
                } />
                <Route path="/admin/fleet" element={
                  <RouteGuard allowedRoles={["admin"]}>
                    <AdminFleet />
                  </RouteGuard>
                } />
                
                {/* SuperAdmin Routes - hidden, only for super_admin */}
                <Route path="/superadmin/login" element={<SuperAdminLogin />} />
                <Route path="/superadmin/dashboard" element={
                  <SuperAdminRouteGuard>
                    <SuperAdminDashboard />
                  </SuperAdminRouteGuard>
                } />
                <Route path="/superadmin/client/:clientId" element={
                  <SuperAdminRouteGuard>
                    <ClientControl />
                  </SuperAdminRouteGuard>
                } />
                <Route path="/superadmin/clients" element={
                  <SuperAdminRouteGuard>
                    <SuperAdminDashboard />
                  </SuperAdminRouteGuard>
                } />
                <Route path="/superadmin/logs" element={
                  <SuperAdminRouteGuard>
                    <AuditLogs />
                  </SuperAdminRouteGuard>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;