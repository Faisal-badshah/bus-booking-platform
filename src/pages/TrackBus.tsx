import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Bus, MapPin, Clock, AlertCircle, Navigation, Phone, Users, Gauge, Target, CheckCircle2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom bus icon
const busIcon = new L.DivIcon({
  className: "bus-marker",
  html: `<div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

interface LiveLocation {
  id: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  updated_at: string;
}

interface BookingWithTrip {
  id: string;
  trip_id: string;
  passenger_name: string;
  from_index: number;
  trips: {
    route: string;
    departure_time: string;
    trip_date: string;
    from_city: string;
    to_city: string;
    status: string | null;
    buses: {
      name: string;
      seat_count: number;
    };
    routes: {
      stops: string[];
    };
  };
}

// Component to auto-center map on location update
function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

const TrackBus = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingWithTrip | null>(null);
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [tripStatus, setTripStatus] = useState<"not_started" | "in_progress" | "completed">("not_started");
  
  // Calculate distance from bus to boarding point (mock calculation - in real app use route stops coordinates)
  const [distanceToBoarding, setDistanceToBoarding] = useState<number | null>(null);
  const [eta, setEta] = useState<string | null>(null);

  // Update seconds since last update
  useEffect(() => {
    if (location) {
      const interval = setInterval(() => {
        const lastUpdate = new Date(location.updated_at);
        const now = new Date();
        const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
        setSecondsSinceUpdate(diff);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [location]);

  // Determine trip status
  useEffect(() => {
    if (!location) {
      setTripStatus("not_started");
    } else if (booking?.trips?.status === "completed") {
      setTripStatus("completed");
    } else if (secondsSinceUpdate < 300) { // Active within 5 minutes
      setTripStatus("in_progress");
    } else {
      setTripStatus("not_started");
    }
  }, [location, secondsSinceUpdate, booking]);

  // Calculate ETA based on speed and mock distance
  useEffect(() => {
    if (location && location.speed > 0 && distanceToBoarding !== null) {
      const speedKmh = location.speed * 3.6;
      const hoursToArrival = distanceToBoarding / speedKmh;
      const minutesToArrival = Math.round(hoursToArrival * 60);
      
      if (minutesToArrival < 1) {
        setEta("Arriving now");
      } else if (minutesToArrival < 60) {
        setEta(`~${minutesToArrival} min`);
      } else {
        const hours = Math.floor(minutesToArrival / 60);
        const mins = minutesToArrival % 60;
        setEta(`~${hours}h ${mins}m`);
      }
    } else if (location && location.speed === 0) {
      setEta("Bus stopped");
    } else {
      setEta(null);
    }
  }, [location, distanceToBoarding]);

  // Mock distance calculation (in real app, calculate based on route coordinates)
  useEffect(() => {
    if (location && booking) {
      // Simulated distance - in production, calculate actual distance to boarding stop
      const mockDistance = 5 + Math.random() * 10; // 5-15 km
      setDistanceToBoarding(Number(mockDistance.toFixed(1)));
    }
  }, [location, booking]);

  // Fetch booking and initial location
  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) return;

      try {
        // Check tracking subscription
        const { data: subscription } = await supabase
          .from("tracking_subscription")
          .select("*")
          .limit(1)
          .single();

        if (subscription) {
          const now = new Date();
          const trialEnds = new Date(subscription.trial_ends_at);
          const isTrialExpired = now > trialEnds;
          setTrackingEnabled(subscription.tracking_enabled || (!isTrialExpired && subscription.is_trial_active));
        }

        // Fetch booking with trip info including bus details
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select(`
            id,
            trip_id,
            passenger_name,
            from_index,
            trips (
              route,
              departure_time,
              trip_date,
              from_city,
              to_city,
              status,
              buses (
                name,
                seat_count
              ),
              routes (
                stops
              )
            )
          `)
          .eq("id", bookingId)
          .single();

        if (bookingError) throw bookingError;
        setBooking(bookingData as unknown as BookingWithTrip);

        // Fetch current location
        if (bookingData?.trip_id) {
          const { data: locationData } = await supabase
            .from("live_locations")
            .select("*")
            .eq("trip_id", bookingData.trip_id)
            .single();

          if (locationData) {
            setLocation(locationData as LiveLocation);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load tracking data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  // Subscribe to realtime location updates
  useEffect(() => {
    if (!booking?.trip_id) return;

    const channel = supabase
      .channel(`location-${booking.trip_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_locations",
          filter: `trip_id=eq.${booking.trip_id}`,
        },
        (payload) => {
          if (payload.new) {
            setLocation(payload.new as LiveLocation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.trip_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Booking not found</p>
            <Button onClick={() => navigate("/my-bookings")} className="mt-4">
              Back to My Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trackingEnabled) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Tracking Not Available</p>
            <p className="text-muted-foreground mt-2">
              Bus tracking feature is currently not available.
            </p>
            <Button onClick={() => navigate("/my-bookings")} className="mt-4">
              Back to My Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (tripStatus) {
      case "completed":
        return <Badge className="bg-green-500">Trip Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-primary animate-pulse">Bus En Route</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const getOnlineStatus = () => {
    if (secondsSinceUpdate < 30) return { status: "live", label: "Live" };
    if (secondsSinceUpdate < 45) return { status: "delayed", label: "Slightly Delayed" };
    return { status: "offline", label: "Possibly Offline" };
  };

  const onlineStatus = getOnlineStatus();
  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 4) return "****";
    return "****" + phone.slice(-4);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/my-bookings")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Track Your Bus</h1>
            <p className="text-sm text-muted-foreground">
              {booking.trips.from_city} → {booking.trips.to_city}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Map */}
      <div className="relative h-[45vh]">
        {location ? (
          <MapContainer
            center={[location.latitude, location.longitude]}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.latitude, location.longitude]} icon={busIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>{booking.trips.buses?.name || "Bus"}</strong>
                  <br />
                  Speed: {(location.speed * 3.6).toFixed(0)} km/h
                </div>
              </Popup>
            </Marker>
            <MapUpdater position={[location.latitude, location.longitude]} />
          </MapContainer>
        ) : (
          <div className="h-full bg-muted flex flex-col items-center justify-center">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Tracking Not Started</p>
            <p className="text-sm text-muted-foreground">
              The driver hasn't started tracking yet
            </p>
          </div>
        )}

        {/* Freshness indicator overlay */}
        {location && (
          <div className="absolute top-4 right-4 z-[1000]">
            <Badge 
              variant={onlineStatus.status === "live" ? "default" : onlineStatus.status === "delayed" ? "secondary" : "destructive"}
              className="flex items-center gap-1"
            >
              <span className={`w-2 h-2 rounded-full ${
                onlineStatus.status === "live" ? "bg-green-400 animate-pulse" : 
                onlineStatus.status === "delayed" ? "bg-yellow-400" : "bg-red-400"
              }`} />
              {secondsSinceUpdate}s ago
            </Badge>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* ETA and Distance Card */}
        {location && tripStatus === "in_progress" && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-3 sm:pt-4 p-3 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 flex-shrink-0">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-base sm:text-lg font-bold truncate">{distanceToBoarding} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 flex-shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">ETA</p>
                    <p className="text-base sm:text-lg font-bold truncate">{eta || "Calculating..."}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trip Completed Message */}
        {tripStatus === "completed" && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="pt-3 sm:pt-4 p-3 sm:p-6 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-green-700 dark:text-green-400 text-sm sm:text-base">Trip Completed</p>
                <p className="text-xs sm:text-sm text-muted-foreground">This trip has ended. Thank you for traveling with us!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bus Details Card */}
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Bus Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs sm:text-sm p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bus Number</span>
              <span className="font-medium truncate ml-2">{booking.trips.buses?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Seats</span>
              <span className="font-medium">{booking.trips.buses?.seat_count || "N/A"}</span>
            </div>
            {location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Speed</span>
                <span className="font-medium flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  {(location.speed * 3.6).toFixed(0)} km/h
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Driver Contact</span>
              <span className="font-medium flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {maskPhone("9876543210")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center justify-between">
              <span>Tracking Status</span>
              <Badge variant={onlineStatus.status === "live" ? "default" : onlineStatus.status === "delayed" ? "secondary" : "destructive"} className="text-xs">
                {onlineStatus.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {location ? (
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>Last update: {secondsSinceUpdate}s ago</span>
                </div>
                {onlineStatus.status === "offline" && (
                  <div className="text-amber-600 bg-amber-50 dark:bg-amber-950 p-2 rounded text-xs">
                    Driver may be in an area with poor connectivity
                  </div>
                )}
                <a
                  href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Navigation className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </Button>
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Waiting for driver to start the trip...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trip Details Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trip Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span className="font-medium">{booking.trips.route}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Departure</span>
              <span className="font-medium">{booking.trips.departure_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {new Date(booking.trips.trip_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Passenger</span>
              <span className="font-medium">{booking.passenger_name}</span>
            </div>
            {booking.trips.routes?.stops && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Boarding Point</span>
                <span className="font-medium">
                  {booking.trips.routes.stops[booking.from_index] || "N/A"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrackBus;
