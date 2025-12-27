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

  const getNavLinks = () => {
    if (loading) return [];
    
    if (role === "admin") {
      return [{ to: "/admin", label: language === "en" ? "Admin Dashboard" : "एडमिन डैशबोर्ड" }];
    }
    
    if (role === "staff") {
      return [{ to: "/driver", label: language === "en" ? "Driver Dashboard" : "ड्राइवर डैशबोर्ड" }];
    }
    
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

  // Consistent Premium Logo Component
  const Logo = () => (
    <Link to="/" className="flex items-center gap-2 font-semibold text-xl text-slate-900 dark:text-white" aria-label="Ride Bus Home">
      <Bus className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
      <span>
        RIDE <span className="text-green-600 dark:text-green-400">BUS</span>
      </span>
    </Link>
  );

  // Staff-specific header
  if (role === "staff" && user) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-background border-b border-border shadow-sm" aria-label="Staff Navigation">
        <div className="flex items-center justify-between py-4 px-4 sm:px-6 gap-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Toggle Language">
              <Globe className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} aria-label="Toggle Dark Mode">
              {darkMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </Button>
            <Button size="lg" onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6">
              <LogOut className="h-5 w-5 mr-2" aria-hidden="true" />
              {language === "en" ? "Logout" : "लॉगआउट"}
            </Button>
          </div>
        </div>
      </nav>
    );
  }

  // Admin-specific header
  if (role === "admin" && user) {
    return (
      <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm" aria-label="Admin Navigation">
        <div className="px-4 sm:px-6 flex items-center justify-between h-16">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleLanguage}>
              <Globe className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {language === "en" ? "Logout" : "लॉगआउट"}
            </Button>
          </div>
        </div>
      </nav>
    );
  }

  // Public navbar (users & guests)
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm" aria-label="Main Navigation">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button variant="ghost" className="hover:text-green-600 dark:hover:text-green-400">
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
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
                  <Button variant="ghost" onClick={() => navigate("/my-bookings")} className="gap-2">
                    <User className="h-4 w-4" aria-hidden="true" />
                    {language === "en" ? "Profile" : "प्रोफाइल"}
                  </Button>
                )}
                <Button variant="outline" onClick={handleLogout}>
                  {language === "en" ? "Logout" : "लॉगआउट"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  {language === "en" ? "Login" : "लॉगिन"}
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => navigate("/auth")}>
                  {language === "en" ? "Sign Up" : "साइन अप"}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-border"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      {link.label}
                    </Button>
                  </Link>
                ))}
                <div className="pt-2 border-t border-border mt-2 space-y-2">
                  <Button variant="ghost" onClick={toggleLanguage} className="w-full justify-start gap-2">
                    <Globe className="h-5 w-5" aria-hidden="true" />
                    {language === "en" ? "हिंदी" : "English"}
                  </Button>
                  <Button variant="ghost" onClick={toggleDarkMode} className="w-full justify-start gap-2">
                    {darkMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </Button>
                  {user ? (
                    <>
                      {role === "user" && (
                        <Button variant="ghost" onClick={() => { navigate("/my-bookings"); setMobileMenuOpen(false); }}>
                          <User className="h-4 w-4 mr-2" aria-hidden="true" />
                          {language === "en" ? "Profile" : "प्रोफाइल"}
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleLogout} className="w-full">
                        {language === "en" ? "Logout" : "लॉगआउट"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>
                        {language === "en" ? "Login" : "लॉगिन"}
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700 w-full" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>
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