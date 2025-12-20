import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "super_admin" | "admin" | "staff" | "user" | "guest";

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>("guest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRole("guest");
        setLoading(false);
        return;
      }

      // Check for super_admin role first
      const { data: superAdminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (superAdminRole) {
        setRole("super_admin");
        setLoading(false);
        return;
      }

      // Check for admin role
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (adminRole) {
        setRole("admin");
        setLoading(false);
        return;
      }

      // Check for staff role
      const { data: staffRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "staff")
        .maybeSingle();

      if (staffRole) {
        setRole("staff");
        setLoading(false);
        return;
      }

      // Default to regular user
      setRole("user");
    } catch (error) {
      console.error("Error checking user role:", error);
      setRole("guest");
    } finally {
      setLoading(false);
    }
  };

  return { role, loading };
};
