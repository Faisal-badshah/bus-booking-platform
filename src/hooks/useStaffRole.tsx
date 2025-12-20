import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useStaffRole = () => {
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStaffRole();
  }, []);

  const checkStaffRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsStaff(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "staff")
        .maybeSingle();

      if (error) {
        console.error("Error checking staff role:", error);
        setIsStaff(false);
      } else {
        setIsStaff(!!data);
      }
    } catch (error) {
      console.error("Error in checkStaffRole:", error);
      setIsStaff(false);
    } finally {
      setLoading(false);
    }
  };

  return { isStaff, loading };
};
