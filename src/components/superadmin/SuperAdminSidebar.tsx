import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, Shield, History, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/superadmin/dashboard" },
  { icon: Users, label: "Clients", path: "/superadmin/clients" },
  { icon: History, label: "Audit Logs", path: "/superadmin/logs" },
];

const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/superadmin/login");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="p-2 rounded-lg bg-destructive/10">
          <Shield className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-foreground">SuperAdmin</h2>
          <p className="text-xs text-muted-foreground">System Control</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onItemClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-destructive/10 text-destructive"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="pt-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export const SuperAdminSidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-card">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <SidebarContent onItemClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <div className="w-64 bg-card border-r border-border min-h-screen p-4 hidden md:block">
        <SidebarContent />
      </div>
    </>
  );
};
