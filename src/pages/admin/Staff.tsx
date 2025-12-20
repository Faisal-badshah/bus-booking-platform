import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Staff = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Fetch all staff members
  const { data: staffList, isLoading } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      // Fetch user_roles for staff
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .eq("role", "staff")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;
      if (!userRoles || userRoles.length === 0) return [];

      // Get all staff user_ids
      const userIds = userRoles.map(role => role.user_id);

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const staffData = userRoles.map(role => ({
        ...role,
        profiles: profiles?.find(p => p.id === role.user_id) || null
      }));

      return staffData;
    },
  });

  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('createStaffAccount', {
        body: {
          email,
          password,
          phone,
          fullName,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to create staff account");

      return data.user;
    },
    onSuccess: () => {
      toast.success("Staff member created successfully");
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      setOpen(false);
      setEmail("");
      setPhone("");
      setPassword("");
      setFullName("");
    },
    onError: (error: any) => {
      console.error("Error creating staff:", error);
      toast.error(error.message || "Failed to create staff member");
    },
  });

  // Remove staff mutation
  const removeStaffMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "staff");

      if (error) throw error;
      return userId;
    },
    onSuccess: () => {
      toast.success("Staff role removed successfully");
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
    },
    onError: (error: any) => {
      console.error("Error removing staff role:", error);
      toast.error(error.message || "Failed to remove staff role");
    },
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    createStaffMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground">
              Manage driver and conductor accounts
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Staff Account</DialogTitle>
                <DialogDescription>
                  Add a new staff member with driver portal access
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createStaffMutation.isPending}
                >
                  {createStaffMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Staff Account"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>
              All staff members with driver portal access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList && staffList.length > 0 ? (
                    staffList.map((staff: any) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">
                          {staff.profiles?.full_name || "N/A"}
                        </TableCell>
                        <TableCell>{staff.profiles?.phone || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Staff</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(staff.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStaffMutation.mutate(staff.user_id)}
                            disabled={removeStaffMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No staff members found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Staff;
