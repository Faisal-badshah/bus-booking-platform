import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAdminRole } from "@/hooks/useSuperAdminRole";
import { Loader2 } from "lucide-react";

interface SuperAdminRouteGuardProps {
  children: ReactNode;
}

export const SuperAdminRouteGuard = ({ children }: SuperAdminRouteGuardProps) => {
  const { isSuperAdmin, loading } = useSuperAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!isSuperAdmin) {
      navigate("/superadmin/login", { replace: true });
    }
  }, [isSuperAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-destructive" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
};
