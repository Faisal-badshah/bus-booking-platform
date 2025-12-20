import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, AlertTriangle, Loader2, Save, Plus, Ban, Bus, MapPin, FileText, Settings, Shield, UserPlus, UserMinus, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientLimits {
  client_id: string;
  max_buses: number;
  max_seats_per_bus: number;
  tracking_enabled: boolean;
  tracking_trial_ends_at: string | null;
  plan_name: string | null;
  notes: string | null;
}

interface AdminInfo {
  id: string;
  email: string;
  full_name: string | null;
}

const ClientControl = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<ClientLimits | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Form state
  const [maxBuses, setMaxBuses] = useState(2);
  const [maxSeats, setMaxSeats] = useState(50);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState("");
  const [planName, setPlanName] = useState("free");
  const [notes, setNotes] = useState("");

  // Admin assignment form
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
      fetchAdmins();
    }
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      const { data: limits, error: limitsError } = await supabase
        .from("client_limits")
        .select("*")
        .eq("client_id", clientId)
        .single();

      if (limitsError) throw limitsError;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", clientId)
        .single();

      setClient(limits);
      setProfile(profileData);

      setMaxBuses(limits.max_buses);
      setMaxSeats(limits.max_seats_per_bus);
      setTrackingEnabled(limits.tracking_enabled);
      setTrialEndDate(limits.tracking_trial_ends_at 
        ? new Date(limits.tracking_trial_ends_at).toISOString().split('T')[0] 
        : "");
      setPlanName(limits.plan_name || "free");
      setNotes(limits.notes || "");
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error("Failed to load client data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const { data, error } = await supabase.functions.invoke('manageAdminRole', {
        body: { action: 'list' },
      });

      if (error) throw error;
      
      // Filter admins for this client
      const clientAdmins = (data?.admins || []).filter((a: AdminInfo) => a.id === clientId);
      setAdmins(clientAdmins);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const logAction = async (action: string, oldValue: any, newValue: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !clientId) return;

    await supabase.from("superadmin_logs").insert({
      super_admin_id: user.id,
      client_id: clientId,
      action,
      old_value: oldValue,
      new_value: newValue,
    });
  };

  const handleSave = async () => {
    if (!clientId || !client) return;
    setSaving(true);

    try {
      const updates = {
        max_buses: maxBuses,
        max_seats_per_bus: maxSeats,
        tracking_enabled: trackingEnabled,
        tracking_trial_ends_at: trialEndDate ? new Date(trialEndDate).toISOString() : null,
        plan_name: planName,
        notes,
      };

      const { error } = await supabase
        .from("client_limits")
        .update(updates)
        .eq("client_id", clientId);

      if (error) throw error;

      await logAction("update_limits", client, updates);

      toast.success("Client settings saved successfully");
      fetchClientData();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDisableGPS = async () => {
    if (!clientId || !client) return;

    try {
      const { error } = await supabase
        .from("client_limits")
        .update({
          tracking_enabled: false,
          tracking_trial_ends_at: null,
        })
        .eq("client_id", clientId);

      if (error) throw error;

      await logAction("disable_gps", { 
        tracking_enabled: client.tracking_enabled,
        tracking_trial_ends_at: client.tracking_trial_ends_at
      }, { 
        tracking_enabled: false,
        tracking_trial_ends_at: null
      });

      toast.success("GPS tracking disabled immediately");
      fetchClientData();
    } catch (error) {
      console.error("Error disabling GPS:", error);
      toast.error("Failed to disable GPS");
    }
  };

  const handleGrantBonusBus = async () => {
    if (!clientId || !client) return;

    try {
      const newLimit = maxBuses + 1;
      const { error } = await supabase
        .from("client_limits")
        .update({ max_buses: newLimit })
        .eq("client_id", clientId);

      if (error) throw error;

      await logAction("grant_bonus_bus", { max_buses: maxBuses }, { max_buses: newLimit });

      setMaxBuses(newLimit);
      toast.success("Bonus bus granted (+1)");
      fetchClientData();
    } catch (error) {
      console.error("Error granting bus:", error);
      toast.error("Failed to grant bonus bus");
    }
  };

  const handleAssignAdmin = async () => {
    if (!newAdminEmail) {
      toast.error("Email is required");
      return;
    }

    setAssigning(true);
    try {
      const { data, error } = await supabase.functions.invoke('manageAdminRole', {
        body: {
          action: 'assign',
          email: newAdminEmail,
          password: newAdminPassword || undefined,
          fullName: newAdminName || undefined,
          clientId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Admin assigned successfully");
      setAssignDialogOpen(false);
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminName("");
      fetchAdmins();
    } catch (error) {
      console.error("Error assigning admin:", error);
      toast.error(error instanceof Error ? error.message : "Failed to assign admin");
    } finally {
      setAssigning(false);
    }
  };

  const handleRevokeAdmin = async (adminId: string, adminEmail: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manageAdminRole', {
        body: {
          action: 'revoke',
          userId: adminId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Admin role revoked from ${adminEmail}`);
      fetchAdmins();
    } catch (error) {
      console.error("Error revoking admin:", error);
      toast.error(error instanceof Error ? error.message : "Failed to revoke admin");
    }
  };

  const getTrackingStatusBadge = () => {
    if (trackingEnabled) {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>;
    }
    if (trialEndDate) {
      const trialEnd = new Date(trialEndDate);
      const now = new Date();
      if (trialEnd > now) {
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Trial · {daysLeft}d left</Badge>;
      }
    }
    return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Disabled</Badge>;
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const maskedLocal = local.length > 2 
      ? local.slice(0, 2) + '***' 
      : local[0] + '***';
    return `${maskedLocal}@${domain}`;
  };

  if (loading) {
    return (
      <SuperAdminLayout title="Loading..." description="">
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </SuperAdminLayout>
    );
  }

  if (!client) {
    return (
      <SuperAdminLayout title="Client Not Found" description="">
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription>
            Could not find client with ID: {clientId}
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          onClick={() => navigate("/superadmin/dashboard")}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout 
      title={profile?.full_name || "Client Control"} 
      description={`Managing client: ${clientId?.slice(0, 8)}...`}
    >
      <Button 
        variant="ghost" 
        onClick={() => navigate("/superadmin/dashboard")}
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <Alert className="mb-6 border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 dark:text-amber-400">
          Admins cannot modify these settings themselves. Only SuperAdmin changes take effect.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Client Information</CardTitle>
                  <CardDescription>Basic client details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Client ID</span>
                  <p className="font-mono text-xs mt-1">{clientId?.slice(0, 8)}...</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Plan</span>
                  <div className="mt-1">
                    <Badge variant="outline">{client.plan_name || "free"}</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name</Label>
                <Input
                  id="planName"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="free, starter, pro, enterprise"
                />
              </div>
            </CardContent>
          </Card>

          {/* Fleet Limits */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Fleet Limits</CardTitle>
                  <CardDescription>Configure bus fleet capacity</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxBuses">Max Buses</Label>
                  <Input
                    id="maxBuses"
                    type="number"
                    min={1}
                    max={100}
                    value={maxBuses}
                    onChange={(e) => setMaxBuses(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Total buses allowed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSeats">Max Seats/Bus</Label>
                  <Input
                    id="maxSeats"
                    type="number"
                    min={1}
                    max={100}
                    value={maxSeats}
                    onChange={(e) => setMaxSeats(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Seats per bus
                  </p>
                </div>
              </div>

              <Button 
                variant="secondary" 
                onClick={handleGrantBonusBus}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Grant Bonus Bus (+1)
              </Button>
            </CardContent>
          </Card>

          {/* GPS Tracking */}
          <Card className="border-amber-500/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <MapPin className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">GPS Tracking</CardTitle>
                    <CardDescription>Control live tracking access</CardDescription>
                  </div>
                </div>
                {getTrackingStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label className="text-sm">Tracking Enabled</Label>
                  <p className="text-xs text-muted-foreground">
                    Paid feature access
                  </p>
                </div>
                <Switch
                  checked={trackingEnabled}
                  onCheckedChange={setTrackingEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialEnd">Trial End Date</Label>
                <Input
                  id="trialEnd"
                  type="date"
                  value={trialEndDate}
                  onChange={(e) => setTrialEndDate(e.target.value)}
                />
              </div>

              <Separator />

              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                    <p className="text-xs text-muted-foreground">
                      Immediately revokes GPS access
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Ban className="h-3.5 w-3.5 mr-1.5" />
                        Disable GPS
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disable GPS Tracking?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>This will immediately disable live GPS tracking and clear any trial period.</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDisableGPS}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Disable Now
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Admin Management */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Admin Management</CardTitle>
                    <CardDescription>Manage client administrators</CardDescription>
                  </div>
                </div>
                <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Admin Role</DialogTitle>
                      <DialogDescription>
                        Enter the email of the user to assign as admin. If the user doesn't exist, a new account will be created.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminEmail">Email Address *</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="admin@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminName">Full Name</Label>
                        <Input
                          id="adminName"
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminPassword">Password (for new users)</Label>
                        <Input
                          id="adminPassword"
                          type="password"
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                        <p className="text-xs text-muted-foreground">
                          Required only if creating a new user account
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAssignAdmin} disabled={assigning}>
                        {assigning ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          "Assign Admin"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAdmins ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No admins assigned</p>
                  <p className="text-xs">Click "Assign Admin" to add one</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div 
                      key={admin.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {admin.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {maskEmail(admin.email || "")}
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0">
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Admin Role?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove admin privileges from {admin.full_name || admin.email}.
                              {admins.length === 1 && (
                                <span className="block mt-2 text-amber-600 font-medium">
                                  Warning: This is the last admin for this client!
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleRevokeAdmin(admin.id, admin.email)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke Admin
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Internal Notes</CardTitle>
                  <CardDescription>Private notes (not visible to client)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes here..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Only visible to SuperAdmins
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button - Full Width */}
      <div className="flex justify-end pt-6 pb-8">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </SuperAdminLayout>
  );
};

export default ClientControl;
