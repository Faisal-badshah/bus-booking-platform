import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Navigation, StopCircle, Loader2 } from "lucide-react";

interface TripTrackerProps {
  tripId: string | null;
  tripInfo?: {
    route: string;
    departure_time: string;
  };
}

export const TripTracker = ({ tripId, tripInfo }: TripTrackerProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendLocation = useCallback(async (position: GeolocationPosition) => {
    if (!tripId) return;

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
        toast.error("Failed to update location");
      } else {
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Error sending location:", err);
    }
  }, [tripId]);

  const startTracking = useCallback(() => {
    if (!tripId) {
      toast.error("Please select a trip first");
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      toast.error("Geolocation not supported");
      return;
    }

    setError(null);
    setIsTracking(true);

    // Watch position for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition(position);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(err.message);
        toast.error(`Location error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    toast.success("Trip tracking started");
  }, [tripId]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsTracking(false);
    setCurrentPosition(null);
    setLastUpdate(null);
    toast.info("Trip tracking stopped");
  }, []);

  // Send location every 10 seconds when tracking
  useEffect(() => {
    if (isTracking && currentPosition) {
      // Send immediately
      sendLocation(currentPosition);

      // Then every 10 seconds
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
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Trip Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tripInfo && (
          <div className="text-sm text-muted-foreground">
            <p><strong>Route:</strong> {tripInfo.route}</p>
            <p><strong>Departure:</strong> {tripInfo.departure_time}</p>
          </div>
        )}

        {!tripId && (
          <p className="text-sm text-muted-foreground">
            Select a trip from the manifest to enable tracking
          </p>
        )}

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        {isTracking && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500 animate-pulse">
                <MapPin className="h-3 w-3 mr-1" />
                Tracking Active
              </Badge>
            </div>

            {currentPosition && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Lat: {currentPosition.coords.latitude.toFixed(6)}</p>
                <p>Lng: {currentPosition.coords.longitude.toFixed(6)}</p>
                {currentPosition.coords.speed && (
                  <p>Speed: {(currentPosition.coords.speed * 3.6).toFixed(1)} km/h</p>
                )}
                {lastUpdate && (
                  <p>Last sent: {lastUpdate.toLocaleTimeString()}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {!isTracking ? (
            <Button
              onClick={startTracking}
              disabled={!tripId}
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Start Trip Tracking
            </Button>
          ) : (
            <Button
              onClick={stopTracking}
              variant="destructive"
              className="w-full"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Stop Tracking
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
