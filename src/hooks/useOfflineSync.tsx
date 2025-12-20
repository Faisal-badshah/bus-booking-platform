import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OfflineAction {
  id: string;
  type: "mark_boarded";
  booking_id: string;
  staff_id: string;
  timestamp: string;
}

const OFFLINE_ACTIONS_KEY = "driver_offline_actions";
const MANIFEST_CACHE_KEY = "driver_manifest_cache";

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored");
      syncOfflineActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Working offline - changes will sync when online");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const saveOfflineAction = (action: Omit<OfflineAction, "id">) => {
    const actions = getOfflineActions();
    const newAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
    };
    actions.push(newAction);
    localStorage.setItem(OFFLINE_ACTIONS_KEY, JSON.stringify(actions));
  };

  const getOfflineActions = (): OfflineAction[] => {
    const stored = localStorage.getItem(OFFLINE_ACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  const clearOfflineActions = () => {
    localStorage.removeItem(OFFLINE_ACTIONS_KEY);
  };

  const cacheManifest = (manifest: any[]) => {
    const cache = {
      data: manifest,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify(cache));
  };

  const getCachedManifest = () => {
    const stored = localStorage.getItem(MANIFEST_CACHE_KEY);
    if (!stored) return null;
    const cache = JSON.parse(stored);
    return cache.data;
  };

  const syncOfflineActions = async () => {
    if (syncInProgress) return;

    const actions = getOfflineActions();
    if (actions.length === 0) return;

    setSyncInProgress(true);

    try {
      for (const action of actions) {
        if (action.type === "mark_boarded") {
          const { error } = await supabase.from("boarding_logs").insert({
            booking_id: action.booking_id,
            trip_id: "",
            verification_method: "qr_scan",
            verified_by: action.staff_id,
            boarded_at: action.timestamp,
          });

          if (error) {
            console.error("Failed to sync action:", error);
            continue;
          }
        }
      }

      clearOfflineActions();
      toast.success("Offline actions synced successfully");
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to sync offline actions");
    } finally {
      setSyncInProgress(false);
    }
  };

  return {
    isOnline,
    saveOfflineAction,
    getOfflineActions,
    cacheManifest,
    getCachedManifest,
    syncOfflineActions,
    syncInProgress,
  };
};
