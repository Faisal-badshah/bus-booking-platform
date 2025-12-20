import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bus, Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface NavbarProps {
  user?: any;
}

export const Navbar = ({ user }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading } = useUserRole();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
      description: "Come back soon!",
    });
    navigate("/");
  };

  // Role-based navigation items
  const getNavLinks = () => {
    if (loading) return [];
    
    if (role === "admin") {
      return [{ to: "/admin", label: "Admin Dashboard" }];
    }
    
    if (role === "staff") {
      return [{ to: "/driver", label: "Driver Dashboard" }];
    }
    
    // For regular users and guests
    return [
      { to: "/", label: "Home" },
      { to: "/about", label: "About" },
      { to: "/services", label: "Services" },
      { to: "/book", label: "Book Tickets" },
      ...(user ? [{ to: "/my-bookings", label: "My Bookings" }] : []),
      { to: "/contact", label: "Contact" },
    ];
  };

  const navLinks = getNavLinks();

  // Staff-specific header (dark theme with large buttons)
  if (role === "staff" && user) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-card border-b border-border shadow-md">
        <div className="flex items-center justify-between py-5 px-6 gap-4 overflow-x-auto">
          {/* Left: Driver Dashboard Button */}
          <Button 
            size="lg" 
            onClick={() => navigate("/driver")}
            className="gap-3 h-12 px-8 py-2 flex-shrink-0 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/50 transition-all duration-200 hover:scale-[1.02]"
          >
            <Bus className="h-5 w-5" />
            <span className="hidden sm:inline font-semibold">Driver Dashboard</span>
            <span className="sm:hidden font-semibold">Dashboard</span>
          </Button>

          {/* Right: Logout Button */}
          <Button 
            size="lg" 
            onClick={handleLogout}
            className="gap-3 h-12 px-8 py-2 flex-shrink-0 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg hover:shadow-red-500/50 transition-all duration-200 hover:scale-[1.02]"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-semibold">Logout</span>
          </Button>
        </div>
      </nav>
    );
  }

  // Admin-specific header (clean dashboard top bar)
  if (role === "admin" && user) {
    return (
      <nav className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/admin" className="flex items-center gap-2 font-bold text-xl text-primary">
              <LayoutDashboard className="h-6 w-6" />
              <span>Admin Dashboard</span>
            </Link>

            {/* Desktop - Action Buttons */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost"
                onClick={() => navigate("/admin")}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Default public header for users and guests
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Bus className="h-6 w-6" />
            <span>BusGo</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-secondary">
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {role === "user" && (
                  <Button variant="ghost" onClick={() => navigate("/my-bookings")}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                )}
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Login
                </Button>
                <Button className="bg-accent hover:bg-accent/90" onClick={() => navigate("/auth")}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    {link.label}
                  </Button>
                </Link>
              ))}
              <div className="pt-2 border-t border-border mt-2 flex flex-col gap-2">
                {user ? (
                  <>
                    {role === "user" && (
                      <Button variant="ghost" onClick={() => { navigate("/my-bookings"); setMobileMenuOpen(false); }}>
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>
                      Login
                    </Button>
                    <Button className="bg-accent hover:bg-accent/90" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
