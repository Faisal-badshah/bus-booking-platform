import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TrackingStatus {
  isAllowed: boolean;
  reason: string;
  isLoading: boolean;
  trialDaysLeft: number;
  isTrialActive: boolean;
  isEnabled: boolean;
}

export const useTrackingStatus = () => {
  const [status, setStatus] = useState<TrackingStatus>({
    isAllowed: false,
    reason: "Loading...",
    isLoading: true,
    trialDaysLeft: 0,
    isTrialActive: false,
    isEnabled: false,
  });

  useEffect(() => {
    const fetchTrackingStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("client_limits")
          .select("tracking_enabled, tracking_trial_ends_at, plan_name")
          .limit(1)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching tracking status:", error);
          setStatus({
            isAllowed: false,
            reason: "Failed to check tracking status",
            isLoading: false,
            trialDaysLeft: 0,
            isTrialActive: false,
            isEnabled: false,
          });
          return;
        }

        if (!data) {
          // No client_limits row - trial will be created on first use
          setStatus({
            isAllowed: true,
            reason: "Trial available",
            isLoading: false,
            trialDaysLeft: 60,
            isTrialActive: true,
            isEnabled: false,
          });
          return;
        }

        const now = new Date();
        const trialEnds = data.tracking_trial_ends_at ? new Date(data.tracking_trial_ends_at) : null;
        const trialDaysLeft = trialEnds 
          ? Math.max(0, Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        const isTrialActive = trialEnds ? now <= trialEnds : false;
        const isEnabled = data.tracking_enabled === true;
        const isAllowed = isEnabled || isTrialActive;

        let reason = "";
        if (isEnabled) {
          reason = "Tracking enabled";
        } else if (isTrialActive) {
          reason = `Trial active (${trialDaysLeft} days left)`;
        } else {
          reason = "Tracking trial expired";
        }

        setStatus({
          isAllowed,
          reason,
          isLoading: false,
          trialDaysLeft,
          isTrialActive,
          isEnabled,
        });
      } catch (err) {
        console.error("Error in useTrackingStatus:", err);
        setStatus({
          isAllowed: false,
          reason: "Error checking tracking status",
          isLoading: false,
          trialDaysLeft: 0,
          isTrialActive: false,
          isEnabled: false,
        });
      }
    };

    fetchTrackingStatus();
  }, []);

  return status;
};
