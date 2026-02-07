import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Exchange the code/token for a session
      await supabase.auth.exchangeCodeForSession(window.location.href);

      // After session is created, go to home
      navigate("/", { replace: true });
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Verifying your account...</p>
    </div>
  );
}
