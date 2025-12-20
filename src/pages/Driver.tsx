import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Bus, Loader2, Users, Clock, Navigation, MapPin, Eye, Ban } from "lucide-react";
import { format } from "date-fns";
import { useTrackingStatus } from "@/hooks/useTrackingStatus";

interface AssignedTrip {
  id: string;
  trip_id: string;
  assignment_date: string;
  trip_route: string;
  trip_departure: string;
  from_city: string;
  to_city: string;
  passengers_count: number;
  is_tracking: boolean;
}

const Driver = () => {
  const navigate = useNavigate();
  const trackingStatus = useTrackingStatus();
  const [staffId, setStaffId] = useState<string | null>(null);
  const [assignedTrips, setAssignedTrips] = useState<AssignedTrip[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [trackingTripId, setTrackingTripId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaffId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setStaffId(user.id);
      }
    };
    fetchStaffId();
  }, []);

  useEffect(() => {
    if (staffId) {
      fetchTodayAssignments();
      checkActiveTracking();
    }
  }, [staffId]);

  const checkActiveTracking = async () => {
    // Check if there's an active tracking session by looking at recent live_locations
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: locations } = await supabase
      .from("live_locations")
      .select("trip_id, updated_at")
      .eq("staff_id", staffId!)
      .gte("updated_at", fiveMinutesAgo)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (locations && locations.length > 0) {
      setTrackingTripId(locations[0].trip_id);
    }
  };

  const fetchTodayAssignments = async () => {
    if (!staffId) return;
    
    setIsLoadingAssignments(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data: assignments, error } = await supabase
        .from("staff_trip_assignments")
        .select("id, trip_id, assignment_date")
        .eq("staff_id", staffId)
        .eq("assignment_date", today);

      if (error) throw error;

      if (!assignments || assignments.length === 0) {
        setAssignedTrips([]);
        setIsLoadingAssignments(false);
        return;
      }

      // Fetch trip details and passenger counts for each assignment
      const enrichedTrips: AssignedTrip[] = [];
      for (const assignment of assignments) {
        const { data: trip } = await supabase
          .from("trips")
          .select("route, departure_time, from_city, to_city")
          .eq("id", assignment.trip_id)
          .single();

        // Count passengers for this trip today
        const { count: passengersCount } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("trip_id", assignment.trip_id)
          .eq("status", "confirmed");

        // Check if tracking is active for this trip
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: trackingData } = await supabase
          .from("live_locations")
          .select("updated_at")
          .eq("trip_id", assignment.trip_id)
          .gte("updated_at", fiveMinutesAgo)
          .limit(1);

        if (trip) {
          enrichedTrips.push({
            id: assignment.id,
            trip_id: assignment.trip_id,
            assignment_date: assignment.assignment_date,
            trip_route: trip.route,
            trip_departure: trip.departure_time,
            from_city: trip.from_city,
            to_city: trip.to_city,
            passengers_count: passengersCount || 0,
            is_tracking: (trackingData && trackingData.length > 0) || false
          });
        }
      }

      setAssignedTrips(enrichedTrips);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load trip assignments");
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const handleViewManifest = (tripId: string) => {
    navigate(`/driver/manifest/${tripId}`);
  };

  const handleStartTracking = (tripId: string) => {
    navigate(`/driver/manifest/${tripId}?startTracking=true`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">Driver Dashboard</h1>
              <p className="text-sm opacity-90">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Tracking Banner */}
      {trackingTripId && (
        <div className="bg-green-500 text-white px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-white rounded-full animate-pulse" />
              <span className="font-medium">Tracking Active</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/driver/manifest/${trackingTripId}`)}
            >
              View Trip
            </Button>
          </div>
        </div>
      )}

      {/* Tracking Disabled Banner */}
      {!trackingStatus.isLoading && !trackingStatus.isAllowed && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 border-b border-destructive/20">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <Ban className="h-5 w-5 flex-shrink-0" />
            <div>
              <span className="font-medium">Tracking Unavailable: </span>
              <span className="text-sm">{trackingStatus.reason}. Contact admin to enable.</span>
            </div>
          </div>
        </div>
      )}

      {/* Trial Status Banner */}
      {!trackingStatus.isLoading && trackingStatus.isTrialActive && !trackingStatus.isEnabled && (
        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-2 border-b">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>Trial Mode: {trackingStatus.trialDaysLeft} days remaining</span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bus className="h-5 w-5" />
          Today's Assigned Trips
        </h2>

        {isLoadingAssignments ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : assignedTrips.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Trips Assigned</h3>
              <p className="text-muted-foreground">
                You don't have any trips assigned for today. Contact your administrator.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignedTrips.map((trip) => (
              <Card key={trip.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Trip Header */}
                  <div className="bg-muted/50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bus className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{trip.trip_route}</span>
                      </div>
                      {trip.is_tracking ? (
                        <Badge className="bg-green-500 text-white">
                          <MapPin className="h-3 w-3 mr-1 animate-pulse" />
                          Tracking Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not Started</Badge>
                      )}
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Route</p>
                          <p className="font-medium">{trip.from_city} → {trip.to_city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Departure</p>
                          <p className="font-medium">{trip.trip_departure}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Passengers Booked</p>
                        <p className="text-2xl font-bold">{trip.passengers_count}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewManifest(trip.trip_id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Manifest
                      </Button>
                      {!trip.is_tracking ? (
                        <Button
                          className="flex-1"
                          onClick={() => handleStartTracking(trip.trip_id)}
                          disabled={!trackingStatus.isAllowed}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Start Tracking
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          className="flex-1"
                          onClick={() => handleViewManifest(trip.trip_id)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Continue Trip
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Driver;