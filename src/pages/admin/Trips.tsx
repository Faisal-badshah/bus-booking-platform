import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Edit, Power, PowerOff, AlertCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

export default function Trips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [deletingTrip, setDeletingTrip] = useState<any>(null);
  const [selectedTrips, setSelectedTrips] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    bus_id: "",
    route_id: "",
    recurrence_type: "fixed" as "fixed" | "daily" | "weekly" | "custom",
    start_date: "",
    end_date: "",
    max_booking_days_ahead: 7,
    recurrence_days: [] as number[],
    departure_time: "",
    arrival_time: "",
    owner_reserved_seats: [] as string[],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTrips();
    fetchBuses();
    fetchRoutes();
  }, []);

  const fetchTrips = async () => {
    const { data, error } = await supabase
      .from("trips")
      .select(`
        *, 
        buses(name, seat_count),
        routes(name, stops)
      `)
      .order("start_date", { ascending: false })
      .order("departure_time", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch trips",
        variant: "destructive",
      });
    } else {
      setTrips(data || []);
    }
  };

  const fetchBuses = async () => {
    const { data } = await supabase.from("buses").select("*");
    setBuses(data || []);
  };

  const fetchRoutes = async () => {
    const { data } = await supabase.from("routes").select("*");
    setRoutes(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.route_id) {
      toast({
        title: "Validation Error",
        description: "Please select a route",
        variant: "destructive",
      });
      return;
    }

    // Validate recurrence days for weekly/custom
    if ((formData.recurrence_type === "weekly" || formData.recurrence_type === "custom") 
        && formData.recurrence_days.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one day for weekly/custom recurrence",
        variant: "destructive",
      });
      return;
    }

    // Validate date range
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast({
        title: "Validation Error",
        description: "End date must be after or equal to start date",
        variant: "destructive",
      });
      return;
    }

    try {
      const tripData = {
        ...formData,
        // For fixed trips, ensure start_date equals end_date
        end_date: formData.recurrence_type === "fixed" ? formData.start_date : formData.end_date,
        // Clear recurrence_days for fixed/daily trips
        recurrence_days: (formData.recurrence_type === "weekly" || formData.recurrence_type === "custom") 
          ? formData.recurrence_days 
          : null,
        // Set legacy trip_date to start_date for compatibility
        trip_date: formData.start_date,
        // Legacy fields for compatibility
        from_city: "",
        to_city: "",
        route: "",
        price: 0,
        available_seats: 0,
      };

      if (editingTrip) {
        const { error } = await supabase
          .from("trips")
          .update(tripData)
          .eq("id", editingTrip.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Trip updated successfully",
        });
      } else {
        const { error } = await supabase.from("trips").insert([tripData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Trip created successfully",
        });
      }

      handleCloseDialog();
      fetchTrips();
    } catch (error: any) {
      console.error("Error saving trip:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save trip",
        variant: "destructive",
      });
    }
  };

  const toggleTripStatus = async (trip: any) => {
    const newStatus = trip.status === "active" ? "disabled" : "active";
    const { error } = await supabase
      .from("trips")
      .update({ status: newStatus })
      .eq("id", trip.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update trip status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Trip ${newStatus === "active" ? "enabled" : "disabled"} successfully`,
      });
      fetchTrips();
    }
  };

  const handleEdit = (trip: any) => {
    setEditingTrip(trip);
    setFormData({
      bus_id: trip.bus_id,
      route_id: trip.route_id,
      recurrence_type: trip.recurrence_type || "fixed",
      start_date: trip.start_date,
      end_date: trip.end_date,
      max_booking_days_ahead: trip.max_booking_days_ahead || 7,
      recurrence_days: trip.recurrence_days || [],
      departure_time: trip.departure_time,
      arrival_time: trip.arrival_time,
      owner_reserved_seats: trip.owner_reserved_seats || [],
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTrip(null);
    setFormData({
      bus_id: "",
      route_id: "",
      recurrence_type: "fixed",
      start_date: "",
      end_date: "",
      max_booking_days_ahead: 7,
      recurrence_days: [],
      departure_time: "",
      arrival_time: "",
      owner_reserved_seats: [],
    });
  };

  const handleDelete = async () => {
    if (!deletingTrip) return;

    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", deletingTrip.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Trip deleted successfully",
      });
      fetchTrips();
    }
    
    setDeletingTrip(null);
  };

  const handleBulkDelete = async () => {
    if (selectedTrips.size === 0) return;

    const { error } = await supabase
      .from("trips")
      .delete()
      .in("id", Array.from(selectedTrips));

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete selected trips",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `${selectedTrips.size} trip(s) deleted successfully`,
      });
      setSelectedTrips(new Set());
      fetchTrips();
    }
  };

  const toggleTripSelection = (tripId: string) => {
    const newSelected = new Set(selectedTrips);
    if (newSelected.has(tripId)) {
      newSelected.delete(tripId);
    } else {
      newSelected.add(tripId);
    }
    setSelectedTrips(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTrips.size === trips.length) {
      setSelectedTrips(new Set());
    } else {
      setSelectedTrips(new Set(trips.map(t => t.id)));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trip Management</h1>
          <div className="flex gap-2">
            {selectedTrips.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedTrips.size})
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingTrip(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Trip
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTrip ? "Edit Trip" : "Add New Trip"}</DialogTitle>
              </DialogHeader>

              {routes.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No routes available. Please create a route first from the Routes page.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="route">Route *</Label>
                  <Select
                    value={formData.route_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, route_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.name} ({route.stops.join(" → ")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bus">Bus *</Label>
                  <Select
                    value={formData.bus_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bus_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses.map((bus) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.name} ({bus.seat_count} seats)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="recurrence_type">Recurrence Type *</Label>
                  <Select
                    value={formData.recurrence_type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, recurrence_type: value, recurrence_days: [] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed (One-time)</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        setFormData({ 
                          ...formData, 
                          start_date: newStartDate,
                          // Auto-set end_date for fixed trips
                          end_date: formData.recurrence_type === "fixed" ? newStartDate : formData.end_date
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      disabled={formData.recurrence_type === "fixed"}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                    />
                  </div>
                </div>

                {(formData.recurrence_type === "weekly" || formData.recurrence_type === "custom") && (
                  <div>
                    <Label>Recurrence Days *</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                        <Button
                          key={idx}
                          type="button"
                          variant={formData.recurrence_days.includes(idx) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const days = formData.recurrence_days.includes(idx)
                              ? formData.recurrence_days.filter(d => d !== idx)
                              : [...formData.recurrence_days, idx].sort();
                            setFormData({ ...formData, recurrence_days: days });
                          }}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="max_booking_days_ahead">Max Booking Days Ahead *</Label>
                  <Input
                    id="max_booking_days_ahead"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.max_booking_days_ahead}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_booking_days_ahead: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departure_time">Departure Time *</Label>
                    <Input
                      id="departure_time"
                      type="time"
                      value={formData.departure_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departure_time: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="arrival_time">Arrival Time *</Label>
                    <Input
                      id="arrival_time"
                      type="time"
                      value={formData.arrival_time}
                      onChange={(e) =>
                        setFormData({ ...formData, arrival_time: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="owner_reserved_seats">
                    Owner Reserved Seats (comma-separated)
                  </Label>
                  <Input
                    id="owner_reserved_seats"
                    placeholder="e.g. 1,2,3"
                    value={formData.owner_reserved_seats.join(",")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        owner_reserved_seats: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={routes.length === 0}>
                    {editingTrip ? "Update Trip" : "Add Trip"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedTrips.size === trips.length && trips.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border cursor-pointer"
                    />
                  </TableHead>
                  <TableHead>Route & Stops</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Booking Window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => {
                  const route = Array.isArray(trip.routes) ? trip.routes[0] : trip.routes;
                  const bus = Array.isArray(trip.buses) ? trip.buses[0] : trip.buses;
                  
                  return (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedTrips.has(trip.id)}
                          onChange={() => toggleTripSelection(trip.id)}
                          className="h-4 w-4 rounded border-border cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{route?.name || "N/A"}</div>
                          <div className="text-sm text-muted-foreground">
                            {route?.stops?.join(" → ") || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{trip.start_date}</div>
                        {trip.end_date !== trip.start_date && (
                          <div className="text-sm text-muted-foreground">to {trip.end_date}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {trip.recurrence_type === "fixed" && "One-time"}
                          {trip.recurrence_type === "daily" && "Daily"}
                          {trip.recurrence_type === "weekly" && "Weekly"}
                          {trip.recurrence_type === "custom" && "Custom days"}
                          {trip.recurrence_days && trip.recurrence_days.length > 0 && (
                            <span className="ml-1">
                              ({["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
                                .filter((_, i) => trip.recurrence_days.includes(i))
                                .join(", ")})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{trip.departure_time}</div>
                        <div className="text-sm text-muted-foreground">
                          to {trip.arrival_time}
                        </div>
                      </TableCell>
                      <TableCell>{bus?.name || "N/A"}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          Max {trip.max_booking_days_ahead}d ahead
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            trip.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {trip.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(trip)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTripStatus(trip)}
                          >
                            {trip.status === "active" ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingTrip(trip)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deletingTrip} onOpenChange={() => setDeletingTrip(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this trip. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
