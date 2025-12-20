import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Bus, 
  Clock, 
  Users, 
  QrCode, 
  Navigation, 
  StopCircle, 
  MapPin,
  Check,
  User,
  Phone,
  Loader2,
  BatteryWarning,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  AlertTriangle,
  Ban
} from "lucide-react";
import { format } from "date-fns";
import { QRScanner } from "@/components/driver/QRScanner";
import { TicketVerification } from "@/components/driver/TicketVerification";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useTrackingStatus } from "@/hooks/useTrackingStatus";

interface Passenger {
  booking_id: string;
  passenger_name: string;
  seat_number: number;
  passenger_phone: string;
  from_index: number;
  to_index: number;
  status: string;
  boarded: boolean;
}

interface TripInfo {
  route: string;
  departure_time: string;
  from_city: string;
  to_city: string;
}

interface VerificationResult {
  success: boolean;
  booking_id?: string;
  passenger_name?: string;
  seat_number?: string;
  status?: string;
  already_boarded?: boolean;
  message?: string;
}

const TripManifest = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startTrackingOnLoad = searchParams.get("startTracking") === "true";

  const { isOnline, saveOfflineAction, cacheManifest, getCachedManifest } = useOfflineSync();
  const trackingStatus = useTrackingStatus();

  const [staffId, setStaffId] = useState<string | null>(null);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isMarking, setIsMarking] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "boarded">("all");

  // Tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [trackingDuration, setTrackingDuration] = useState(0);
  const [pendingLocations, setPendingLocations] = useState(0);
  const [showBatteryWarning, setShowBatteryWarning] = useState(false);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [tripEnded, setTripEnded] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);

  // Offline location cache key
  const LOCATION_CACHE_KEY = `location_cache_${tripId}`;

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // GPS accuracy helper
  const getGpsAccuracy = (accuracy: number | null): { label: string; color: string; icon: React.ReactNode } => {
    if (accuracy === null) return { label: "Unknown", color: "text-muted-foreground", icon: <Signal className="h-4 w-4" /> };
    if (accuracy <= 10) return { label: "Excellent", color: "text-green-500", icon: <SignalHigh className="h-4 w-4 text-green-500" /> };
    if (accuracy <= 30) return { label: "Good", color: "text-emerald-500", icon: <SignalMedium className="h-4 w-4 text-emerald-500" /> };
    if (accuracy <= 100) return { label: "Fair", color: "text-amber-500", icon: <SignalLow className="h-4 w-4 text-amber-500" /> };
    return { label: "Poor", color: "text-red-500", icon: <Signal className="h-4 w-4 text-red-500" /> };
  };

  // Battery warning after 30 minutes
  useEffect(() => {
    if (trackingDuration >= 1800 && !showBatteryWarning) { // 30 min = 1800 seconds
      setShowBatteryWarning(true);
      toast.warning("Tracking has been active for 30+ minutes. Consider battery usage.", {
        duration: 5000,
      });
    }
  }, [trackingDuration, showBatteryWarning]);

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
    if (tripId && staffId) {
      fetchTripData();
      checkExistingTracking();
    }
  }, [tripId, staffId]);

  useEffect(() => {
    if (startTrackingOnLoad && tripId && staffId && !isTracking) {
      startTracking();
    }
  }, [startTrackingOnLoad, tripId, staffId]);

  const checkExistingTracking = async () => {
    if (!tripId || !staffId) return;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("live_locations")
      .select("updated_at")
      .eq("trip_id", tripId)
      .eq("staff_id", staffId)
      .gte("updated_at", fiveMinutesAgo)
      .limit(1);

    if (data && data.length > 0) {
      // Resume tracking
      setIsTracking(true);
      startGeolocationWatch();
    }
  };

  const fetchTripData = async () => {
    if (!tripId) return;

    setIsLoading(true);
    try {
      // Fetch trip info
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("route, departure_time, from_city, to_city")
        .eq("id", tripId)
        .single();

      if (tripError) throw tripError;
      setTripInfo(trip);

      // Fetch passengers
      if (!isOnline) {
        const cached = getCachedManifest();
        if (cached) {
          setPassengers(cached);
          setIsLoading(false);
          return;
        }
      }

      const today = format(new Date(), "yyyy-MM-dd");
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, passenger_name, seat_number, passenger_phone, from_index, to_index, status")
        .eq("trip_id", tripId)
        .eq("status", "confirmed")
        .order("seat_number");

      if (bookingsError) throw bookingsError;

      // Get boarding logs
      const { data: boardingLogs } = await supabase
        .from("boarding_logs")
        .select("booking_id")
        .eq("trip_id", tripId);

      const boardedIds = new Set(boardingLogs?.map((log) => log.booking_id) || []);

      const manifest: Passenger[] = (bookings || []).map((booking) => ({
        booking_id: booking.id,
        passenger_name: booking.passenger_name,
        seat_number: booking.seat_number,
        passenger_phone: booking.passenger_phone,
        from_index: booking.from_index,
        to_index: booking.to_index,
        status: booking.status,
        boarded: boardedIds.has(booking.id),
      }));

      setPassengers(manifest);
      cacheManifest(manifest);
    } catch (error) {
      console.error("Error fetching trip data:", error);
      toast.error("Failed to load trip data");
    } finally {
      setIsLoading(false);
    }
  };

  // Offline location cache functions
  const getCachedLocations = useCallback((): Array<{
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    timestamp: string;
  }> => {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  }, [LOCATION_CACHE_KEY]);

  const cacheLocation = useCallback((position: GeolocationPosition) => {
    const locations = getCachedLocations();
    locations.push({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed: position.coords.speed || 0,
      heading: position.coords.heading || 0,
      timestamp: new Date().toISOString(),
    });
    // Keep only last 30 locations (5 minutes worth at 10s intervals)
    const trimmed = locations.slice(-30);
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(trimmed));
    setPendingLocations(trimmed.length);
  }, [LOCATION_CACHE_KEY, getCachedLocations]);

  const clearCachedLocations = useCallback(() => {
    localStorage.removeItem(LOCATION_CACHE_KEY);
    setPendingLocations(0);
  }, [LOCATION_CACHE_KEY]);

  const syncCachedLocations = useCallback(async () => {
    if (!tripId || !isOnline) return;

    const cached = getCachedLocations();
    if (cached.length === 0) return;

    // Send the most recent cached location
    const latest = cached[cached.length - 1];
    try {
      const { error } = await supabase.functions.invoke("saveLocation", {
        body: {
          trip_id: tripId,
          latitude: latest.latitude,
          longitude: latest.longitude,
          speed: latest.speed,
          heading: latest.heading,
        },
      });

      if (!error) {
        clearCachedLocations();
        toast.success("Location data synced");
      }
    } catch (err) {
      console.error("Failed to sync cached locations:", err);
    }
  }, [tripId, isOnline, getCachedLocations, clearCachedLocations]);

  // Sync cached locations when coming back online
  useEffect(() => {
    if (isOnline && isTracking) {
      syncCachedLocations();
    }
  }, [isOnline, isTracking, syncCachedLocations]);

  // Tracking functions
  const sendLocation = useCallback(async (position: GeolocationPosition) => {
    if (!tripId) return;

    if (!isOnline) {
      // Cache location when offline
      cacheLocation(position);
      setLastUpdate(new Date());
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("saveLocation", {
        body: {
          trip_id: tripId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
        },
      });

      if (error) {
        console.error("Error sending location:", error);
        // Cache on error (network might have dropped)
        cacheLocation(position);
      } else {
        setLastUpdate(new Date());
        // Clear cache on successful send
        if (getCachedLocations().length > 0) {
          clearCachedLocations();
        }
      }
    } catch (err) {
      console.error("Error sending location:", err);
      // Cache on error
      cacheLocation(position);
      setLastUpdate(new Date());
    }
  }, [tripId, isOnline, cacheLocation, getCachedLocations, clearCachedLocations]);

  const startGeolocationWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setTrackingError("Geolocation is not supported");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition(position);
      },
      (err) => {
        setTrackingError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const startTracking = useCallback(() => {
    if (!tripId) {
      toast.error("Trip not found");
      return;
    }

    setTrackingError(null);
    setIsTracking(true);
    setTrackingDuration(0);
    startGeolocationWatch();

    // Start duration counter
    durationRef.current = setInterval(() => {
      setTrackingDuration((prev) => prev + 1);
    }, 1000);

    toast.success("Trip tracking started");
  }, [tripId, startGeolocationWatch]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }

    setIsTracking(false);
    setCurrentPosition(null);
    setLastUpdate(null);
    toast.info("Trip tracking stopped");
  }, []);

  // End trip handler
  const handleEndTrip = useCallback(async () => {
    if (!tripId) return;
    
    stopTracking();
    setTripEnded(true);
    setShowEndTripModal(false);
    
    // Delete live location to signal trip ended
    try {
      await supabase
        .from("live_locations")
        .delete()
        .eq("trip_id", tripId);
      
      // Log trip end event
      await supabase.from("booking_logs").insert({
        event_type: "trip_ended",
        metadata: {
          trip_id: tripId,
          duration_seconds: trackingDuration,
          distance_km: distanceTraveled.toFixed(2),
          staff_id: staffId,
        },
      });
      
      toast.success("Trip ended successfully");
    } catch (error) {
      console.error("Error ending trip:", error);
      toast.error("Failed to end trip properly");
    }
  }, [tripId, stopTracking, trackingDuration, distanceTraveled, staffId]);

  // Update distance traveled when position changes
  useEffect(() => {
    if (currentPosition && isTracking) {
      const { latitude, longitude } = currentPosition.coords;
      if (lastPositionRef.current) {
        const dist = calculateDistance(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          latitude,
          longitude
        );
        // Only add if distance is reasonable (filter GPS jumps)
        if (dist < 1) { // Less than 1km jump
          setDistanceTraveled(prev => prev + dist);
        }
      }
      lastPositionRef.current = { lat: latitude, lng: longitude };
    }
  }, [currentPosition, isTracking]);

  // Send location every 10 seconds
  useEffect(() => {
    if (isTracking && currentPosition) {
      sendLocation(currentPosition);

      intervalRef.current = setInterval(() => {
        if (currentPosition) {
          sendLocation(currentPosition);
        }
      }, 10000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, currentPosition, sendLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
    };
  }, []);

  const handleQRScan = async (qrData: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verifyTicket", {
        body: { qrData },
      });

      if (error) throw error;

      const { data: boardingLog } = await supabase
        .from("boarding_logs")
        .select("id")
        .eq("booking_id", data.booking_id)
        .maybeSingle();

      setVerificationResult({
        ...data,
        already_boarded: !!boardingLog,
        message: boardingLog
          ? "This passenger has already boarded"
          : data.success
          ? "Ticket is valid"
          : "Invalid ticket",
      });

      setShowScanner(false);
    } catch (error: any) {
      setVerificationResult({
        success: false,
        message: error.message || "Failed to verify ticket",
      });
      toast.error("Verification failed");
    }
  };

  const handleMarkBoarded = async () => {
    if (!verificationResult?.booking_id || !staffId || !tripId) return;

    setIsMarking(true);
    try {
      if (!isOnline) {
        saveOfflineAction({
          type: "mark_boarded",
          booking_id: verificationResult.booking_id,
          staff_id: staffId,
          timestamp: new Date().toISOString(),
        });

        setPassengers((prev) =>
          prev.map((p) =>
            p.booking_id === verificationResult.booking_id ? { ...p, boarded: true } : p
          )
        );

        toast.success("Marked as boarded (will sync when online)");
        setVerificationResult(null);
        return;
      }

      const { error } = await supabase.from("boarding_logs").insert({
        booking_id: verificationResult.booking_id,
        trip_id: tripId,
        verification_method: "qr_scan",
        verified_by: staffId,
      });

      if (error) throw error;

      setPassengers((prev) =>
        prev.map((p) =>
          p.booking_id === verificationResult.booking_id ? { ...p, boarded: true } : p
        )
      );

      toast.success("Passenger marked as boarded");
      setVerificationResult(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to mark as boarded");
    } finally {
      setIsMarking(false);
    }
  };

  const handleManualBoard = async (bookingId: string) => {
    if (!staffId || !tripId) return;

    try {
      const { error } = await supabase.from("boarding_logs").insert({
        booking_id: bookingId,
        trip_id: tripId,
        verification_method: "manual",
        verified_by: staffId,
      });

      if (error) throw error;

      setPassengers((prev) =>
        prev.map((p) => (p.booking_id === bookingId ? { ...p, boarded: true } : p))
      );

      toast.success("Passenger marked as boarded");
    } catch (error: any) {
      toast.error(error.message || "Failed to mark as boarded");
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredPassengers = passengers.filter((p) => {
    if (filter === "pending") return !p.boarded;
    if (filter === "boarded") return p.boarded;
    return true;
  });

  const boardedCount = passengers.filter((p) => p.boarded).length;
  const pendingCount = passengers.filter((p) => !p.boarded).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/driver")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold">{tripInfo?.route}</h1>
              <p className="text-sm opacity-90">
                {tripInfo?.from_city} → {tripInfo?.to_city} • {tripInfo?.departure_time}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Ended Banner */}
      {tripEnded && (
        <div className="bg-blue-500 text-white px-4 py-3 sticky top-[60px] z-10">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Check className="h-5 w-5" />
            <div>
              <p className="font-medium">Trip Completed</p>
              <p className="text-xs opacity-90">
                Duration: {formatDuration(trackingDuration)} • Distance: {distanceTraveled.toFixed(1)} km
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Banner */}
      {isTracking && !tripEnded && (
        <div className={`${isOnline ? 'bg-green-500' : 'bg-amber-500'} text-white px-4 py-3 sticky top-[60px] z-10`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-white rounded-full animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {isOnline ? 'Tracking Active' : 'Tracking (Offline)'}
                  </p>
                  {currentPosition && (
                    <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {getGpsAccuracy(currentPosition.coords.accuracy).icon}
                      <span>{getGpsAccuracy(currentPosition.coords.accuracy).label}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-90">
                  Duration: {formatDuration(trackingDuration)} • 
                  Distance: {distanceTraveled.toFixed(1)} km •
                  Last update: {lastUpdate?.toLocaleTimeString() || "—"}
                  {pendingLocations > 0 && ` • ${pendingLocations} cached`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEndTripModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                End Trip
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* End Trip Confirmation Modal */}
      {showEndTripModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <StopCircle className="h-5 w-5" />
                End Trip?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This will stop tracking and mark the trip as completed. QR scanning will be disabled.
              </p>
              <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{formatDuration(trackingDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-medium">{distanceTraveled.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Passengers Boarded:</span>
                  <span className="font-medium">{boardedCount} / {passengers.length}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEndTripModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleEndTrip}
                >
                  End Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Battery Warning */}
      {isTracking && showBatteryWarning && (
        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-2 sticky top-[120px] z-10">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm">
            <BatteryWarning className="h-4 w-4" />
            <span>Extended tracking may drain battery. Keep device plugged in if possible.</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-2 text-xs"
              onClick={() => setShowBatteryWarning(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="py-3">
              <Users className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{passengers.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="py-3">
              <Check className="h-5 w-5 mx-auto text-green-500 mb-1" />
              <p className="text-2xl font-bold">{boardedCount}</p>
              <p className="text-xs text-muted-foreground">Boarded</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="py-3">
              <Clock className="h-5 w-5 mx-auto text-orange-500 mb-1" />
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Tracking Disabled Banner */}
        {!trackingStatus.isLoading && !trackingStatus.isAllowed && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-destructive">
                <Ban className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Tracking Not Available</p>
                  <p className="text-sm text-muted-foreground">
                    {trackingStatus.reason}. Contact admin to enable tracking.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking Control */}
        {!isTracking && !tripEnded && (
          <Card>
            <CardContent className="py-4">
              <Button 
                className="w-full" 
                size="lg" 
                onClick={startTracking}
                disabled={trackingStatus.isLoading || !trackingStatus.isAllowed}
              >
                {trackingStatus.isLoading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Navigation className="h-5 w-5 mr-2" />
                )}
                Start Trip Tracking
              </Button>
              {trackingError && (
                <p className="text-sm text-destructive mt-2 text-center">{trackingError}</p>
              )}
              {trackingStatus.isTrialActive && !trackingStatus.isEnabled && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Trial: {trackingStatus.trialDaysLeft} days remaining
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Live Position (when tracking) */}
        {isTracking && currentPosition && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Live Position
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <p>Lat: {currentPosition.coords.latitude.toFixed(6)}</p>
                <p>Lng: {currentPosition.coords.longitude.toFixed(6)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {currentPosition.coords.speed !== null && (
                  <p>Speed: {(currentPosition.coords.speed * 3.6).toFixed(1)} km/h</p>
                )}
                {currentPosition.coords.accuracy !== null && (
                  <p className="flex items-center gap-1">
                    Accuracy: 
                    <span className={getGpsAccuracy(currentPosition.coords.accuracy).color}>
                      ±{currentPosition.coords.accuracy.toFixed(0)}m
                    </span>
                  </p>
                )}
              </div>
              {currentPosition.coords.accuracy && currentPosition.coords.accuracy > 50 && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Low GPS accuracy. Move to open area for better signal.</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* QR Scanner Section */}
        {showScanner ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Scan Ticket</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowScanner(false)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <QRScanner
                onScanSuccess={handleQRScan}
                onScanError={(error) => console.error("Scan error:", error)}
              />
            </CardContent>
          </Card>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => setShowScanner(true)}
          >
            <QrCode className="h-5 w-5 mr-2" />
            Scan QR Code
          </Button>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <TicketVerification
            result={verificationResult}
            onMarkBoarded={handleMarkBoarded}
            onClear={() => setVerificationResult(null)}
            isMarking={isMarking}
          />
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({passengers.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pending ({pendingCount})
          </Button>
          <Button
            variant={filter === "boarded" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("boarded")}
          >
            Boarded ({boardedCount})
          </Button>
        </div>

        {/* Passenger List */}
        <div className="space-y-2">
          {filteredPassengers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No passengers found
              </CardContent>
            </Card>
          ) : (
            filteredPassengers.map((passenger) => (
              <Card
                key={passenger.booking_id}
                className={passenger.boarded ? "bg-green-50 dark:bg-green-950/20 border-green-200" : ""}
              >
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        passenger.boarded ? "bg-green-500 text-white" : "bg-muted"
                      }`}>
                        {passenger.boarded ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{passenger.passenger_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            Seat {passenger.seat_number}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {passenger.passenger_phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1***$3")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!passenger.boarded && (
                      <Button
                        size="sm"
                        onClick={() => handleManualBoard(passenger.booking_id)}
                      >
                        Board
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TripManifest;