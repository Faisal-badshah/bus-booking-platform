import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export const RouteGuard = ({ children, allowedRoles }: RouteGuardProps) => {
  const { role, loading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // Check if current role is allowed
    if (!allowedRoles.includes(role)) {
      // Redirect based on role
      if (role === "super_admin") {
        navigate("/superadmin/dashboard", { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "staff") {
        navigate("/driver", { replace: true });
      } else if (role === "user") {
        navigate("/auth", { replace: true });
      } else {
        // Guest trying to access protected route
        navigate("/auth", { replace: true });
      }
    }
  }, [role, loading, allowedRoles, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only render children if role is allowed
  if (!allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
};
