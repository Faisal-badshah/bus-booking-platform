import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSuperAdminRole = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSuperAdminRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSuperAdminRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSuperAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking super admin role:", error);
        setIsSuperAdmin(false);
      } else {
        setIsSuperAdmin(!!data);
      }
    } catch (error) {
      console.error("Error in checkSuperAdminRole:", error);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { isSuperAdmin, loading };
};
