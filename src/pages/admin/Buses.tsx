import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Bus, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { busSchema } from "@/lib/validations/admin";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface BusLimits {
  current_count: number;
  max_buses: number;
  can_add: boolean;
}

export default function Buses() {
  const [buses, setBuses] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", seat_count: 40 });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [busLimits, setBusLimits] = useState<BusLimits | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBuses();
    fetchBusLimits();
  }, []);

  const fetchBusLimits = async () => {
    const { data, error } = await supabase.rpc('check_bus_limit');
    if (!error && data) {
      setBusLimits(data as unknown as BusLimits);
    }
  };

  const fetchBuses = async () => {
    const { data, error } = await supabase
      .from("buses")
      .select("*, trips(count)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch buses",
        variant: "destructive",
      });
    } else {
      setBuses(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate input
      const validatedData = busSchema.parse(formData);

      if (editingBus) {
        // For editing, use direct update (no limit check needed)
        const { error } = await supabase
          .from("buses")
          .update(validatedData as any)
          .eq("id", editingBus.id);

        if (error) throw error;
        toast({ title: "Success", description: "Bus updated successfully" });
        fetchBuses();
        fetchBusLimits();
        handleCloseDialog();
      } else {
        // For new buses, use the RPC with limit check
        const { data, error } = await supabase.rpc('create_bus_with_limit_check', {
          p_name: validatedData.name,
          p_seat_count: validatedData.seat_count
        });

        if (error) throw error;
        
        const result = data as { success: boolean; error?: string; bus_id?: string };
        
        if (!result.success) {
          toast({
            title: "Limit Reached",
            description: result.error || "Cannot add more buses",
            variant: "destructive",
          });
          return;
        }

        toast({ title: "Success", description: "Bus added successfully" });
        fetchBuses();
        fetchBusLimits();
        handleCloseDialog();
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("buses").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete bus",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Bus deleted successfully" });
      fetchBuses();
      fetchBusLimits();
    }
    setDeleteConfirm(null);
  };

  const handleEdit = (bus: any) => {
    setEditingBus(bus);
    setFormData({ name: bus.name, seat_count: bus.seat_count });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBus(null);
    setFormData({ name: "", seat_count: 40 });
  };

  const limitReached = busLimits && !busLimits.can_add;
  const usagePercent = busLimits 
    ? Math.round((busLimits.current_count / busLimits.max_buses) * 100) 
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Bus Management</h1>
          
          {/* Bus Usage Indicator */}
          {busLimits && (
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2">
              <Bus className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Buses: {busLimits.current_count} / {busLimits.max_buses}
                  </span>
                  {limitReached && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Limit Reached
                    </Badge>
                  )}
                </div>
                <Progress value={usagePercent} className="h-1.5 w-32" />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setEditingBus(null)} 
                disabled={limitReached}
                title={limitReached ? "Bus limit reached. Upgrade to add more buses." : "Add new bus"}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Bus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBus ? "Edit Bus" : "Add New Bus"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Bus Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Volvo Express"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="seat_count">Seat Count</Label>
                  <Input
                    id="seat_count"
                    type="number"
                    value={formData.seat_count}
                    onChange={(e) =>
                      setFormData({ ...formData, seat_count: parseInt(e.target.value) })
                    }
                    min="1"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : editingBus ? "Update" : "Add"} Bus
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Limit Warning Banner */}
        {limitReached && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Bus limit reached</p>
                <p className="text-sm text-muted-foreground">
                  You've reached your maximum of {busLimits?.max_buses} buses. Upgrade your plan to add more buses.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Buses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus Name</TableHead>
                  <TableHead>Seat Count</TableHead>
                  <TableHead>Active Trips</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-medium">{bus.name}</TableCell>
                    <TableCell>{bus.seat_count}</TableCell>
                    <TableCell>{bus.trips?.[0]?.count || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(bus)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setDeleteConfirm(bus.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {buses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No buses added yet. Click "Add Bus" to create your first bus.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the bus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}