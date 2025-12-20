import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, X } from "lucide-react";
import { z } from "zod";

const routeSchema = z.object({
  name: z.string().min(1, "Route name is required").max(100),
  stops: z.array(z.string().min(1)).min(2, "At least 2 stops required"),
  base_price_per_segment: z.number().int().min(0),
  prices_per_segment: z.array(z.number().int().min(0)).optional()
});

interface Route {
  id: string;
  name: string;
  stops: string[];
  base_price_per_segment: number;
  prices_per_segment: number[] | null;
}

export default function Routes() {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    stops: ["", ""],
    base_price_per_segment: 50,
    prices_per_segment: [] as number[]
  });

  const [newStop, setNewStop] = useState("");
  const [usePricesPerSegment, setUsePricesPerSegment] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("routes")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading routes:", error);
      toast({
        title: "Error",
        description: "Failed to load routes",
        variant: "destructive"
      });
    } else {
      setRoutes(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      stops: ["", ""],
      base_price_per_segment: 50,
      prices_per_segment: []
    });
    setEditingRoute(null);
    setUsePricesPerSegment(false);
    setNewStop("");
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    const hasPricesPerSegment = route.prices_per_segment && route.prices_per_segment.length > 0;
    setFormData({
      name: route.name,
      stops: route.stops,
      base_price_per_segment: route.base_price_per_segment,
      prices_per_segment: route.prices_per_segment || []
    });
    setUsePricesPerSegment(hasPricesPerSegment);
    setDialogOpen(true);
  };

  const handleAddStop = () => {
    if (newStop.trim()) {
      setFormData({
        ...formData,
        stops: [...formData.stops, newStop.trim()]
      });
      setNewStop("");
    }
  };

  const handleRemoveStop = (index: number) => {
    if (formData.stops.length > 2) {
      setFormData({
        ...formData,
        stops: formData.stops.filter((_, i) => i !== index)
      });
    }
  };

  const handleUpdateStop = (index: number, value: string) => {
    const newStops = [...formData.stops];
    newStops[index] = value;
    setFormData({ ...formData, stops: newStops });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedData = {
      ...formData,
      stops: formData.stops.filter(s => s.trim()),
      prices_per_segment: usePricesPerSegment ? formData.prices_per_segment : null
    };

    // Validate
    try {
      routeSchema.parse(cleanedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
        return;
      }
    }

    if (editingRoute) {
      // Update
      const { error } = await supabase
        .from("routes")
        .update(cleanedData)
        .eq("id", editingRoute.id);

      if (error) {
        console.error("Error updating route:", error);
        toast({
          title: "Error",
          description: "Failed to update route",
          variant: "destructive"
        });
      } else {
        toast({ title: "Success", description: "Route updated successfully" });
        setDialogOpen(false);
        resetForm();
        loadRoutes();
      }
    } else {
      // Create
      const { error } = await supabase
        .from("routes")
        .insert([cleanedData]);

      if (error) {
        console.error("Error creating route:", error);
        toast({
          title: "Error",
          description: "Failed to create route",
          variant: "destructive"
        });
      } else {
        toast({ title: "Success", description: "Route created successfully" });
        setDialogOpen(false);
        resetForm();
        loadRoutes();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;

    const { error } = await supabase
      .from("routes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting route:", error);
      toast({
        title: "Error",
        description: "Failed to delete route",
        variant: "destructive"
      });
    } else {
      toast({ title: "Success", description: "Route deleted successfully" });
      loadRoutes();
    }
  };

  const updatePricePerSegment = (index: number, value: number) => {
    const newPrices = [...formData.prices_per_segment];
    newPrices[index] = value;
    setFormData({ ...formData, prices_per_segment: newPrices });
  };

  useEffect(() => {
    if (usePricesPerSegment && formData.stops.length > 1) {
      const segmentCount = formData.stops.length - 1;
      const newPrices = Array(segmentCount).fill(0).map((_, i) => 
        formData.prices_per_segment[i] || 0
      );
      setFormData({ ...formData, prices_per_segment: newPrices });
    }
  }, [usePricesPerSegment, formData.stops.length]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Routes Management</h1>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRoute ? "Edit Route" : "Add New Route"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Route Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., City A to City B"
                    required
                  />
                </div>

                <div>
                  <Label>Stops (in order)</Label>
                  <div className="space-y-2 mt-2">
                    {formData.stops.map((stop, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={stop}
                          onChange={(e) => handleUpdateStop(index, e.target.value)}
                          placeholder={`Stop ${index + 1}`}
                          required
                        />
                        {formData.stops.length > 2 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveStop(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={newStop}
                        onChange={(e) => setNewStop(e.target.value)}
                        placeholder="Add new stop"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddStop();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddStop}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="usePricesPerSegment"
                    checked={usePricesPerSegment}
                    onChange={(e) => setUsePricesPerSegment(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="usePricesPerSegment">
                    Use different prices for each segment
                  </Label>
                </div>

                {!usePricesPerSegment ? (
                  <div>
                    <Label htmlFor="base_price">Base Price Per Segment</Label>
                    <Input
                      id="base_price"
                      type="number"
                      min="0"
                      value={formData.base_price_per_segment}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        base_price_per_segment: parseInt(e.target.value) || 0 
                      })}
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Price Per Segment</Label>
                    <div className="space-y-2 mt-2">
                      {formData.stops.length > 1 && formData.stops.slice(0, -1).map((stop, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm min-w-[200px]">
                            {stop || `Stop ${index + 1}`} → {formData.stops[index + 1] || `Stop ${index + 2}`}
                          </span>
                          <Input
                            type="number"
                            min="0"
                            value={formData.prices_per_segment[index] || 0}
                            onChange={(e) => updatePricePerSegment(index, parseInt(e.target.value) || 0)}
                            className="w-32"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRoute ? "Update Route" : "Create Route"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">All Routes</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {routes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 px-4">
                No routes found. Create your first route to get started.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Route Name</TableHead>
                      <TableHead className="min-w-[150px]">Stops</TableHead>
                      <TableHead className="min-w-[100px] hidden sm:table-cell">Pricing</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">
                          <span className="truncate block max-w-[120px]">{route.name}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm truncate max-w-[150px] sm:max-w-[200px]">
                            {route.stops.join(" → ")}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {route.prices_per_segment ? (
                            <span className="text-sm">Variable</span>
                          ) : (
                            <span className="text-sm">${route.base_price_per_segment}/seg</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(route)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(route.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
