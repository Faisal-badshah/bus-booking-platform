import { useState, useEffect } from "react";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Users, Bus, MapPin, AlertTriangle, Loader2, ChevronRight, Shield, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminInfo {
  id: string;
  email: string;
  full_name: string | null;
}

interface ClientData {
  client_id: string;
  email: string;
  full_name: string | null;
  max_buses: number;
  bus_count: number;
  tracking_enabled: boolean;
  tracking_trial_ends_at: string | null;
  plan_name: string | null;
  admins: AdminInfo[];
}

const SuperAdminDashboard = () => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Add Admin dialog state
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      // Fetch all client limits
      const { data: limits, error: limitsError } = await supabase
        .from("client_limits")
        .select("*");

      if (limitsError) throw limitsError;

      // Fetch all admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      const adminIds = adminRoles?.map(r => r.user_id) || [];
      
      // Fetch profiles for all admins
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", adminIds);

      if (profilesError) throw profilesError;

      // Fetch bus count
      const { data: buses, error: busesError } = await supabase
        .from("buses")
        .select("id");

      if (busesError) throw busesError;

      const busCount = buses?.length || 0;

      // Fetch admin list with emails using edge function
      const { data: session } = await supabase.auth.getSession();
      let adminsData: AdminInfo[] = [];
      
      if (session?.session?.access_token) {
        const { data: adminList } = await supabase.functions.invoke('manageAdminRole', {
          body: { action: 'list' },
        });
        adminsData = adminList?.admins || [];
      }

      // Build client data with admin info
      const clientData: ClientData[] = (limits || []).map((limit) => {
        const profile = profiles?.find(p => p.id === limit.client_id);
        const clientAdmins = adminsData.filter(a => a.id === limit.client_id);
        
        return {
          client_id: limit.client_id,
          email: profile?.full_name || "Unknown",
          full_name: profile?.full_name,
          max_buses: limit.max_buses,
          bus_count: busCount,
          tracking_enabled: limit.tracking_enabled,
          tracking_trial_ends_at: limit.tracking_trial_ends_at,
          plan_name: limit.plan_name,
          admins: clientAdmins,
        };
      });

      setClients(clientData);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrackingStatus = (client: ClientData) => {
    if (client.tracking_enabled) {
      return { label: "Active", variant: "default" as const, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
    }
    if (client.tracking_trial_ends_at) {
      const trialEnd = new Date(client.tracking_trial_ends_at);
      const now = new Date();
      if (trialEnd > now) {
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { label: "Trial", variant: "secondary" as const, daysLeft, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
      }
    }
    return { label: "Disabled", variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" };
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const maskedLocal = local.length > 2 
      ? local.slice(0, 2) + '***' 
      : local[0] + '***';
    return `${maskedLocal}@${domain}`;
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) {
      toast.error("Email is required");
      return;
    }
    if (!newAdminPassword || newAdminPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setAssigning(true);
    try {
      const { data, error } = await supabase.functions.invoke('manageAdminRole', {
        body: {
          action: 'assign',
          email: newAdminEmail,
          password: newAdminPassword,
          fullName: newAdminName || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Admin created successfully!");
      setAddAdminOpen(false);
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminName("");
      fetchClients();
    } catch (error) {
      console.error("Error adding admin:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add admin");
    } finally {
      setAssigning(false);
    }
  };
  const filteredClients = clients.filter(
    (c) =>
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalClients: clients.length,
    activeTracking: clients.filter(c => c.tracking_enabled).length,
    trialUsers: clients.filter(c => {
      if (!c.tracking_trial_ends_at) return false;
      return new Date(c.tracking_trial_ends_at) > new Date();
    }).length,
  };

  return (
    <SuperAdminLayout 
      title="SuperAdmin Dashboard" 
      description="Manage all clients and their feature access"
    >
      <div className="flex items-center justify-between mb-6">
        <Alert className="flex-1 border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive/90">
            <strong>Warning:</strong> Changes here affect all clients directly.
          </AlertDescription>
        </Alert>
        
        <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
          <DialogTrigger asChild>
            <Button className="ml-4 shrink-0">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
              <DialogDescription>
                Create a new admin user with full access to the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddAdminOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAdmin} disabled={assigning}>
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Admin"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tracking</CardTitle>
            <MapPin className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.activeTracking}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trial Users</CardTitle>
            <Bus className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.trialUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Client Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No clients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const trackingStatus = getTrackingStatus(client);
            const busUsagePercent = client.max_buses > 0 
              ? Math.min((client.bus_count / client.max_buses) * 100, 100) 
              : 0;
            
            return (
              <Card 
                key={client.client_id}
                className="group cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
                onClick={() => navigate(`/superadmin/client/${client.client_id}`)}
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {client.full_name || "Unknown Client"}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {client.plan_name || "free"} plan
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>

                  {/* Bus Usage */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Bus Usage</span>
                      <span className="font-medium text-foreground">
                        {client.bus_count} / {client.max_buses}
                      </span>
                    </div>
                    <Progress 
                      value={busUsagePercent} 
                      className="h-2"
                    />
                  </div>

                  {/* GPS Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">GPS Tracking</span>
                    <Badge 
                      variant="outline"
                      className={cn("text-xs font-medium", trackingStatus.className)}
                    >
                      {trackingStatus.label}
                      {trackingStatus.daysLeft && ` · ${trackingStatus.daysLeft}d left`}
                    </Badge>
                  </div>

                  {/* Admin Count */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Admins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.admins.length > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {client.admins.map(a => maskEmail(a.email || '')).join(', ')}
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-muted/50">
                          No admins
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {client.admins.length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
