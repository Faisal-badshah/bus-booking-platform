import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Clock, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";

interface ClientLimits {
  client_id: string;
  tracking_enabled: boolean;
  tracking_trial_ends_at: string | null;
  plan_name: string;
}

const TrackingSettings = () => {
  const [clientLimits, setClientLimits] = useState<ClientLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientLimits();
  }, []);

  const fetchClientLimits = async () => {
    try {
      const { data, error } = await supabase
        .from("client_limits")
        .select("client_id, tracking_enabled, tracking_trial_ends_at, plan_name")
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      setClientLimits(data);
    } catch (error) {
      console.error("Error fetching client limits:", error);
      toast.error("Failed to load tracking settings");
    } finally {
      setLoading(false);
    }
  };

  const getTrialDaysLeft = () => {
    if (!clientLimits?.tracking_trial_ends_at) return 0;
    const now = new Date();
    const trialEnds = new Date(clientLimits.tracking_trial_ends_at);
    const diffTime = trialEnds.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isTrialExpired = () => {
    if (!clientLimits?.tracking_trial_ends_at) return true;
    const now = new Date();
    const trialEnds = new Date(clientLimits.tracking_trial_ends_at);
    return now > trialEnds;
  };

  const isTrackingActive = () => {
    if (!clientLimits) return false;
    if (clientLimits.tracking_enabled) return true;
    return !isTrialExpired();
  };

  const getTrackingStatus = (): { label: string; variant: "default" | "destructive" | "secondary" } => {
    if (!clientLimits) return { label: "Not Configured", variant: "secondary" };
    if (clientLimits.tracking_enabled) return { label: "Enabled", variant: "default" };
    if (!isTrialExpired()) return { label: `Trial (${getTrialDaysLeft()} days left)`, variant: "secondary" };
    return { label: "Disabled", variant: "destructive" };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const trialDaysLeft = getTrialDaysLeft();
  const trialExpired = isTrialExpired();
  const trackingActive = isTrackingActive();
  const status = getTrackingStatus();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tracking Settings</h1>
          <p className="text-muted-foreground">
            Manage real-time bus tracking for your passengers
          </p>
        </div>

        {/* Current Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Tracking Status
            </CardTitle>
            <CardDescription>
              Current GPS tracking status for your fleet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Plan</span>
              <span className="text-sm capitalize">{clientLimits?.plan_name || "Free"}</span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              {trackingActive ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">
                    Tracking is active. Drivers can share their location with passengers.
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm">
                    Tracking is disabled. GPS updates will be rejected.
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trial Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Trial Status
            </CardTitle>
            <CardDescription>
              Your 60-day free trial for real-time bus tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Trial Status</span>
              <Badge variant={trialExpired ? "destructive" : "default"}>
                {trialExpired ? "Expired" : "Active"}
              </Badge>
            </div>

            {!trialExpired && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Days Remaining</span>
                <span className="text-2xl font-bold text-primary">
                  {trialDaysLeft}
                </span>
              </div>
            )}

            {clientLimits?.tracking_trial_ends_at && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Expires</span>
                <span>
                  {new Date(clientLimits.tracking_trial_ends_at).toLocaleDateString()}
                </span>
              </div>
            )}

            {trialExpired && !clientLimits?.tracking_enabled && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your trial has expired. Contact support to enable paid tracking.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Notice Card */}
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-5 w-5" />
              Admin Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tracking can only be enabled permanently by the system administrator. 
              Admins cannot self-enable tracking from this panel. Contact support to 
              upgrade your plan or extend your trial.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => toast.info("Contact support to upgrade your tracking plan")}
            >
              Contact for Upgrade
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default TrackingSettings;
