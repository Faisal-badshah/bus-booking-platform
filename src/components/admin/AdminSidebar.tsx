import { NavLink } from "react-router-dom";
import { LayoutDashboard, Bus, Route, Calendar, XCircle, LogOut, MapPin, RefreshCw, Users, CreditCard, Navigation, UserCheck, BarChart3, Map, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AdminSidebarProps {
  onClose?: () => void;
}

export const AdminSidebar = ({ onClose }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/auth");
  };

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/admin/fleet", icon: Map, label: "Fleet Map" },
    { to: "/admin/buses", icon: Bus, label: "Buses" },
    { to: "/admin/routes", icon: MapPin, label: "Routes" },
    { to: "/admin/trips", icon: Route, label: "Trips" },
    { to: "/admin/bookings", icon: Calendar, label: "Bookings" },
    { to: "/admin/cancellations", icon: XCircle, label: "Cancellations" },
    { to: "/admin/staff", icon: Users, label: "Staff" },
    { to: "/admin/trip-assignments", icon: UserCheck, label: "Trip Assignments" },
    { to: "/admin/ticket-retry", icon: RefreshCw, label: "Ticket Retry" },
    { to: "/admin/payment-settings", icon: CreditCard, label: "Payment Settings" },
    { to: "/admin/tracking-settings", icon: Navigation, label: "Tracking Settings" },
  ];

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <aside className="w-64 h-full bg-card border-r border-border flex flex-col shadow-sm">
      <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Management Dashboard</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium text-sm truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border bg-muted/30">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
};
