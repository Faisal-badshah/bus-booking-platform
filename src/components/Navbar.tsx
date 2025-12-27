import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bus, Menu, X, User, LogOut, LayoutDashboard, Globe, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  user?: any;
  toggleDarkMode: () => void;
  darkMode: boolean;
}

export const Navbar = ({ user, toggleDarkMode, darkMode }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading } = useUserRole();

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "hi" : "en"));
  };

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
      return [{ to: "/admin", label: language === "en" ? "Admin Dashboard" : "एडमिन डैशबोर्ड" }];
    }
    
    if (role === "staff") {
      return [{ to: "/driver", label: language === "en" ? "Driver Dashboard" : "ड्राइवर डैशबोर्ड" }];
    }
    
    // For regular users and guests
    return [
      { to: "/", label: language === "en" ? "Home" : "होम" },
      { to: "/about", label: language === "en" ? "About" : "के बारे में" },
      { to: "/services", label: language === "en" ? "Services" : "सेवाएं" },
      { to: "/book", label: language === "en" ? "Book Tickets" : "टिकट बुक करें" },
      ...(user ? [{ to: "/my-bookings", label: language === "en" ? "My Bookings" : "मेरी बुकिंग्स" }] : []),
      { to: "/contact", label: language === "en" ? "Contact" : "संपर्क करें" },
    ];
  };

  const navLinks = getNavLinks();

  // Staff-specific header (dark theme with large buttons)
  if (role === "staff" && user) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-background border-b border-border shadow-sm" aria-label="Staff Navigation">
        <div className="flex items-center justify-between py-4 px-4 sm:px-6 gap-4 overflow-x-auto">
          {/* Left: Driver Dashboard Button */}
          <Button 
            size="lg" 
            onClick={() => navigate("/driver")}
            className="gap-3 h-12 px-6 sm:px-8 py-2 flex-shrink-0 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            aria-label={language === "en" ? "Driver Dashboard" : "ड्राइवर डैशबोर्ड"}
          >
            <Bus className="h-5 w-5" aria-hidden="true" />
            <span className="hidden sm:inline font-medium">{language === "en" ? "Driver Dashboard" : "ड्राइवर डैशबोर्ड"}</span>
            <span className="sm:hidden font-medium">{language === "en" ? "Dashboard" : "डैशबोर्ड"}</span>
          </Button>

          {/* Center: Toggle Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Toggle Language">
              <Globe className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} aria-label="Toggle Dark Mode">
              {darkMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </Button>
          </div>

          {/* Right: Logout Button */}
          <Button 
            size="lg" 
            onClick={handleLogout}
            className="gap-3 h-12 px-6 sm:px-8 py-2 flex-shrink-0 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            aria-label={language === "en" ? "Logout" : "लॉगआउट"}
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            <span className="font-medium">{language === "en" ? "Logout" : "लॉगआउट"}</span>
          </Button>
        </div>
      </nav>
    );
  }

  // Admin-specific header (clean dashboard top bar)
  if (role === "admin" && user) {
    return (
      <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm" aria-label="Admin Navigation">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/admin" className="flex items-center gap-2 font-semibold text-xl text-primary" aria-label={language === "en" ? "Admin Dashboard" : "एडमिन डैशबोर्ड"}>
              <LayoutDashboard className="h-6 w-6" aria-hidden="true" />
              <span>{language === "en" ? "Admin Dashboard" : "एडमिन डैशबोर्ड"}</span>
            </Link>

            {/* Desktop - Action Buttons */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Toggle Language">
                <Globe className="h-5 w-5" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleDarkMode} aria-label="Toggle Dark Mode">
                {darkMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
              </Button>
              <Button 
                variant="ghost"
                onClick={() => navigate("/admin")}
                className="gap-2 hidden sm:flex"
                aria-label={language === "en" ? "Dashboard" : "डैशबोर्ड"}
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                {language === "en" ? "Dashboard" : "डैशबोर्ड"}
              </Button>
              <Button 
                variant="outline"
                onClick={handleLogout}
                className="gap-2"
                aria-label={language === "en" ? "Logout" : "लॉगआउट"}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {language === "en" ? "Logout" : "लॉगआउट"}
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Default public header for users and guests
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm" aria-label="Main Navigation">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-semibold text-xl text-primary" aria-label="Ride Bus Home">
            <Bus className="h-6 w-6" aria-hidden="true" />
            <span>Ride Bus</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-secondary/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Toggle Language">
              <Globe className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} aria-label="Toggle Dark Mode">
              {darkMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </Button>
            {user ? (
              <>
                {role === "user" && (
                  <Button variant="ghost" onClick={() => navigate("/my-bookings")} className="gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                    <User className="h-4 w-4" aria-hidden="true" />
                    {language === "en" ? "Profile" : "प्रोफाइल"}
                  </Button>
                )}
                <Button variant="outline" onClick={handleLogout} className="gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                  {language === "en" ? "Logout" : "लॉगआउट"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")} className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                  {language === "en" ? "Login" : "लॉगिन"}
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none" onClick={() => navigate("/auth")}>
                  {language === "en" ? "Sign Up" : "साइन अप"}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden py-4 border-t border-border overflow-hidden"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                      {link.label}
                    </Button>
                  </Link>
                ))}
                <div className="pt-2 border-t border-border mt-2 flex flex-col gap-2">
                  <Button variant="ghost" onClick={toggleLanguage} className="w-full justify-start gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                    <Globe className="h-5 w-5" aria-hidden="true" />
                    {language === "en" ? "हिंदी" : "English"}
                  </Button>
                  <Button variant="ghost" onClick={toggleDarkMode} className="w-full justify-start gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                    {darkMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
                    {darkMode ? (language === "en" ? "Light Mode" : "लाइट मोड") : (language === "en" ? "Dark Mode" : "डार्क मोड")}
                  </Button>
                  {user ? (
                    <>
                      {role === "user" && (
                        <Button variant="ghost" onClick={() => { navigate("/my-bookings"); setMobileMenuOpen(false); }} className="w-full justify-start gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                          <User className="h-4 w-4" aria-hidden="true" />
                          {language === "en" ? "Profile" : "प्रोफाइल"}
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleLogout} className="w-full justify-start gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        {language === "en" ? "Logout" : "लॉगआउट"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} className="w-full justify-start focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                        {language === "en" ? "Login" : "लॉगिन"}
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700 w-full justify-start focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>
                        {language === "en" ? "Sign Up" : "साइन अप"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};