import { useState, useEffect } from "react";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, History, Search, ArrowUpCircle, ArrowDownCircle, RefreshCw, User } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  super_admin_id: string;
  client_id: string;
  action: string;
  old_value: any;
  new_value: any;
  created_at: string;
}

interface ClientInfo {
  id: string;
  name: string;
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsResponse, limitsResponse] = await Promise.all([
        supabase
          .from("superadmin_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("client_limits")
          .select("client_id")
      ]);

      if (logsResponse.error) throw logsResponse.error;
      setLogs(logsResponse.data || []);

      // Get unique client IDs and fetch profiles
      const clientIds = [...new Set((limitsResponse.data || []).map(l => l.client_id))];
      if (clientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", clientIds);
        
        setClients((profiles || []).map(p => ({ id: p.id, name: p.full_name || "Unknown" })));
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionStyle = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes("disable") || lowerAction.includes("reduce") || lowerAction.includes("revoke")) {
      return {
        bgClass: "bg-destructive/10 border-destructive/20",
        textClass: "text-destructive",
        icon: ArrowDownCircle,
        badgeClass: "bg-destructive/10 text-destructive border-destructive/20"
      };
    }
    if (lowerAction.includes("trial") || lowerAction.includes("update")) {
      return {
        bgClass: "bg-amber-500/10 border-amber-500/20",
        textClass: "text-amber-600",
        icon: RefreshCw,
        badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20"
      };
    }
    if (lowerAction.includes("grant") || lowerAction.includes("enable") || lowerAction.includes("increase")) {
      return {
        bgClass: "bg-emerald-500/10 border-emerald-500/20",
        textClass: "text-emerald-600",
        icon: ArrowUpCircle,
        badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      };
    }
    return {
      bgClass: "bg-muted/50 border-border",
      textClass: "text-muted-foreground",
      icon: History,
      badgeClass: "bg-secondary text-secondary-foreground"
    };
  };

  const formatChange = (oldVal: any, newVal: any) => {
    if (!oldVal && !newVal) return null;
    
    const changes: string[] = [];
    
    if (typeof newVal === "object" && newVal !== null) {
      Object.keys(newVal).forEach(key => {
        const oldValue = oldVal?.[key];
        const newValue = newVal[key];
        if (oldValue !== newValue) {
          const formattedKey = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          changes.push(`${formattedKey}: ${formatValue(oldValue)} → ${formatValue(newValue)}`);
        }
      });
    }
    
    return changes.length > 0 ? changes : null;
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return "None";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        return format(new Date(val), "MMM d, yyyy");
      } catch {
        return val;
      }
    }
    return String(val);
  };

  const formatActionLabel = (action: string) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || clientId.slice(0, 8) + "...";
  };

  // Get unique actions for filter
  const uniqueActions = [...new Set(logs.map(l => l.action))];

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = search === "" || 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      getClientName(log.client_id).toLowerCase().includes(search.toLowerCase());
    const matchesClient = filterClient === "all" || log.client_id === filterClient;
    const matchesAction = filterAction === "all" || log.action === filterAction;
    return matchesSearch && matchesClient && matchesAction;
  });

  return (
    <SuperAdminLayout 
      title="Audit Logs" 
      description="Track all SuperAdmin actions and changes"
    >
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actions or clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{formatActionLabel(action)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16">
          <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No audit logs found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log, index) => {
            const style = getActionStyle(log.action);
            const Icon = style.icon;
            const changes = formatChange(log.old_value, log.new_value);
            const isFirst = index === 0;
            
            return (
              <Card 
                key={log.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-200",
                  style.bgClass,
                  isFirst && "ring-2 ring-primary/20"
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      "shrink-0 p-2.5 rounded-full",
                      style.bgClass
                    )}>
                      <Icon className={cn("h-5 w-5", style.textClass)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <Badge variant="outline" className={style.badgeClass}>
                          {formatActionLabel(log.action)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Client */}
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{getClientName(log.client_id)}</span>
                      </div>

                      {/* Changes */}
                      {changes && changes.length > 0 && (
                        <div className="bg-background/50 rounded-lg p-3 space-y-1">
                          {changes.map((change, i) => (
                            <p key={i} className="text-sm text-muted-foreground">
                              {change}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground shrink-0 sm:text-right">
                      {format(new Date(log.created_at), "MMM d, yyyy")}
                      <br />
                      {format(new Date(log.created_at), "HH:mm")}
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

export default AuditLogs;
