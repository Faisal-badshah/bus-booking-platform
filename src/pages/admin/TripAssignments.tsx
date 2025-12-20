import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, Trash2, UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
}

interface Trip {
  id: string;
  route: string;
  departure_time: string;
  from_city: string;
  to_city: string;
}

interface Assignment {
  id: string;
  staff_id: string;
  trip_id: string;
  assignment_date: string;
  created_at: string;
  staff_email?: string;
  staff_name?: string;
  trip_route?: string;
  trip_departure?: string;
}

const TripAssignments = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedTrip, setSelectedTrip] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchStaffMembers();
    fetchTrips();
    fetchAssignments();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      // Get users with staff role from user_roles table
      const { data: staffRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "staff");

      if (rolesError) throw rolesError;

      if (!staffRoles || staffRoles.length === 0) {
        setStaffMembers([]);
        return;
      }

      const staffIds = staffRoles.map(r => r.user_id);

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", staffIds);

      if (profilesError) throw profilesError;

      // Map to staff members - we'll use ID as fallback for email
      const members: StaffMember[] = (profiles || []).map(p => ({
        id: p.id,
        email: p.id.substring(0, 8) + "...", // Truncated ID as identifier
        full_name: p.full_name
      }));

      setStaffMembers(members);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to load staff members");
    }
  };

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("id, route, departure_time, from_city, to_city")
        .eq("status", "active")
        .order("departure_time");

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast.error("Failed to load trips");
    }
  };

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("staff_trip_assignments")
        .select(`
          id,
          staff_id,
          trip_id,
          assignment_date,
          created_at
        `)
        .order("assignment_date", { ascending: false });

      if (error) throw error;

      // Enrich with staff and trip info
      const enrichedAssignments: Assignment[] = [];
      
      for (const assignment of data || []) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", assignment.staff_id)
          .single();

        const { data: trip } = await supabase
          .from("trips")
          .select("route, departure_time")
          .eq("id", assignment.trip_id)
          .single();

        enrichedAssignments.push({
          ...assignment,
          staff_name: profile?.full_name || "Unknown",
          staff_email: assignment.staff_id.substring(0, 8) + "...",
          trip_route: trip?.route || "Unknown",
          trip_departure: trip?.departure_time || ""
        });
      }

      setAssignments(enrichedAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedStaff || !selectedTrip || !selectedDate) {
      toast.error("Please select staff, trip, and date");
      return;
    }

    setIsAssigning(true);
    try {
      const assignmentDate = format(selectedDate, "yyyy-MM-dd");

      // Check for duplicate
      const { data: existing } = await supabase
        .from("staff_trip_assignments")
        .select("id")
        .eq("staff_id", selectedStaff)
        .eq("trip_id", selectedTrip)
        .eq("assignment_date", assignmentDate)
        .maybeSingle();

      if (existing) {
        toast.error("This staff is already assigned to this trip on this date");
        return;
      }

      const { error } = await supabase
        .from("staff_trip_assignments")
        .insert({
          staff_id: selectedStaff,
          trip_id: selectedTrip,
          assignment_date: assignmentDate
        });

      if (error) throw error;

      toast.success("Staff assigned successfully");
      setSelectedStaff("");
      setSelectedTrip("");
      fetchAssignments();
    } catch (error: any) {
      console.error("Error assigning staff:", error);
      toast.error(error.message || "Failed to assign staff");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("staff_trip_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Assignment removed");
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to remove assignment");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trip Assignments</h1>
          <p className="text-muted-foreground">
            Assign staff members to trips for tracking and manifest access
          </p>
        </div>

        {/* Assignment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              New Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Staff Member</label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name || staff.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Trip</label>
                <Select value={selectedTrip} onValueChange={setSelectedTrip}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.route} - {trip.departure_time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assignment Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleAssign} 
                  disabled={isAssigning}
                  className="w-full"
                >
                  {isAssigning ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Assign Staff
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Current Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : assignments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No assignments found. Create one above.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Trip Route</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{assignment.staff_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.staff_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{assignment.trip_route}</TableCell>
                      <TableCell>{assignment.trip_departure}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {format(new Date(assignment.assignment_date), "PP")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default TripAssignments;