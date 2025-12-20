import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Bus, MapPin, Clock, Users, Navigation, ExternalLink, Loader2, Radio, Eye } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
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

// Custom bus icons by status
const createBusIcon = (color: string) => new L.DivIcon({
  className: "bus-marker",
  html: `<div class="w-10 h-10 ${color} rounded-full flex items-center justify-center shadow-lg border-2 border-white">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const greenIcon = createBusIcon("bg-green-500");
const yellowIcon = createBusIcon("bg-yellow-500");
const redIcon = createBusIcon("bg-red-500");

interface FleetVehicle {
  trip_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  updated_at: string;
  staff_id: string;
  route_name: string;
  bus_name: string;
  departure_time: string;
  arrival_time: string;
  from_city: string;
  to_city: string;
  passenger_count: number;
  boarded_count: number;
}

const getStatusInfo = (updatedAt: string) => {
  const secondsAgo = (Date.now() - new Date(updatedAt).getTime()) / 1000;
  if (secondsAgo < 30) return { color: "green", label: "Active", icon: greenIcon };
  if (secondsAgo < 120) return { color: "yellow", label: "Idle", icon: yellowIcon };
  return { color: "red", label: "No Signal", icon: redIcon };
};

// Component to fit map to all markers
function FitBounds({ vehicles }: { vehicles: FleetVehicle[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (vehicles.length > 0) {
      const bounds = L.latLngBounds(vehicles.map(v => [v.latitude, v.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [vehicles, map]);
  
  return null;
}

export default function Fleet() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "cards">("map");

  const fetchFleet = async () => {
    try {
      const { data, error } = await supabase.rpc('get_fleet_overview');
      if (error) throw error;
      setVehicles((data as unknown as FleetVehicle[]) || []);
    } catch (error) {
      console.error("Error fetching fleet:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('fleet-tracking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_locations'
        },
        () => {
          fetchFleet();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchFleet, 15000);
    return () => clearInterval(interval);
  }, []);

  const defaultCenter: [number, number] = vehicles.length > 0 
    ? [vehicles[0].latitude, vehicles[0].longitude] 
    : [20.5937, 78.9629]; // India center

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 h-full min-h-[calc(100vh-200px)]">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Fleet Overview</h1>
            <p className="text-sm text-muted-foreground">Real-time tracking of all active vehicles</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-xs sm:text-sm">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-xs sm:text-sm">Idle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-xs sm:text-sm">No Signal</span>
            </div>
            <div className="flex gap-1 sm:ml-auto">
              <Button 
                variant={viewMode === "map" ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("map")}
              >
                <MapPin className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "cards" ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("cards")}
              >
                <Bus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Vehicles</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {vehicles.filter(v => getStatusInfo(v.updated_at).color === 'green').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Idle Vehicles</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {vehicles.filter(v => getStatusInfo(v.updated_at).color === 'yellow').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">No Signal</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {vehicles.filter(v => getStatusInfo(v.updated_at).color === 'red').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Passengers</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">
                {vehicles.reduce((sum, v) => sum + v.passenger_count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="flex-1 min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-base sm:text-lg">Live Fleet {viewMode === "map" ? "Map" : "Status"}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {vehicles.length > 0 
                ? `Tracking ${vehicles.length} vehicle(s) - Click to view details`
                : "No active vehicles"}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-60px)] sm:h-[calc(100%-80px)] p-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bus className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">No Active Vehicles</p>
                <p className="text-sm">Vehicles will appear here when drivers start tracking</p>
              </div>
            ) : viewMode === "map" ? (
              <div className="h-full w-full rounded-b-lg overflow-hidden min-h-[250px] sm:min-h-[350px]">
                <MapContainer
                  center={defaultCenter}
                  zoom={10}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FitBounds vehicles={vehicles} />
                  {vehicles.map((vehicle) => {
                    const status = getStatusInfo(vehicle.updated_at);
                    return (
                      <Marker
                        key={vehicle.trip_id}
                        position={[vehicle.latitude, vehicle.longitude]}
                        icon={status.icon}
                        eventHandlers={{
                          click: () => setSelectedVehicle(vehicle),
                        }}
                      >
                        <Popup>
                          <div className="text-sm min-w-[150px] sm:min-w-[200px]">
                            <div className="font-bold flex items-center gap-2 mb-2">
                              <Bus className="h-4 w-4" />
                              <span className="truncate">{vehicle.bus_name}</span>
                            </div>
                            <p className="truncate"><strong>Route:</strong> {vehicle.route_name}</p>
                            <p><strong>Speed:</strong> {vehicle.speed?.toFixed(0) || 0} km/h</p>
                            <p><strong>Passengers:</strong> {vehicle.boarded_count}/{vehicle.passenger_count}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Updated {formatDistanceToNow(new Date(vehicle.updated_at))} ago
                            </p>
                            <Button 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => setSelectedVehicle(vehicle)}
                            >
                              View Details
                            </Button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 h-full overflow-auto">
                {vehicles.map((vehicle) => {
                  const status = getStatusInfo(vehicle.updated_at);
                  
                  return (
                    <Card 
                      key={vehicle.trip_id}
                      className={`cursor-pointer transition-all hover:shadow-lg border-l-4 ${
                        status.color === 'green' ? 'border-l-green-500' :
                        status.color === 'yellow' ? 'border-l-yellow-500' : 'border-l-red-500'
                      }`}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                            <Bus className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">{vehicle.bus_name}</span>
                          </CardTitle>
                          <Badge variant={
                            status.color === 'green' ? 'default' :
                            status.color === 'yellow' ? 'secondary' : 'destructive'
                          } className="flex-shrink-0">
                            {status.label}
                          </Badge>
                        </div>
                        <CardDescription className="truncate">{vehicle.route_name}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 p-3 pt-0 sm:p-6 sm:pt-0">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{vehicle.from_city} → {vehicle.to_city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{vehicle.speed?.toFixed(0) || 0} km/h</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{vehicle.boarded_count} / {vehicle.passenger_count} boarded</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">Updated {formatDistanceToNow(new Date(vehicle.updated_at))} ago</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Detail Sheet */}
        <Sheet open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            {selectedVehicle && (
              <>
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle className="flex items-center gap-2">
                      <Bus className="h-5 w-5" />
                      {selectedVehicle.bus_name}
                    </SheetTitle>
                    <Badge variant={
                      getStatusInfo(selectedVehicle.updated_at).color === 'green' ? 'default' :
                      getStatusInfo(selectedVehicle.updated_at).color === 'yellow' ? 'secondary' : 'destructive'
                    }>
                      {getStatusInfo(selectedVehicle.updated_at).label}
                    </Badge>
                  </div>
                  <SheetDescription>{selectedVehicle.route_name}</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Trip Info */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Trip Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Trip ID</p>
                        <p className="font-mono text-xs">{selectedVehicle.trip_id.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Route</p>
                        <p className="font-medium">{selectedVehicle.route_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">From</p>
                        <p className="font-medium">{selectedVehicle.from_city}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">To</p>
                        <p className="font-medium">{selectedVehicle.to_city}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Departure</p>
                        <p className="font-medium">{selectedVehicle.departure_time}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Arrival</p>
                        <p className="font-medium">{selectedVehicle.arrival_time}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Current Location</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Latitude</p>
                        <p className="font-medium">{selectedVehicle.latitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Longitude</p>
                        <p className="font-medium">{selectedVehicle.longitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Speed</p>
                        <p className="font-medium">{selectedVehicle.speed?.toFixed(0) || 0} km/h</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Heading</p>
                        <p className="font-medium">{selectedVehicle.heading?.toFixed(0) || 0}°</p>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Info */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Passenger Manifest</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-secondary rounded-full h-3">
                        <div 
                          className="bg-primary rounded-full h-3 transition-all"
                          style={{ 
                            width: `${selectedVehicle.passenger_count > 0 
                              ? (selectedVehicle.boarded_count / selectedVehicle.passenger_count) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {selectedVehicle.boarded_count} / {selectedVehicle.passenger_count}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedVehicle.passenger_count - selectedVehicle.boarded_count} passengers yet to board
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Tracking Timeline</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Last update: {format(new Date(selectedVehicle.updated_at), "PPpp")}</span>
                      </div>
                      <p className="text-muted-foreground">
                        Updated {formatDistanceToNow(new Date(selectedVehicle.updated_at))} ago
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t space-y-2">
                    <Button asChild className="w-full">
                      <a 
                        href={`https://www.google.com/maps?q=${selectedVehicle.latitude},${selectedVehicle.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Google Maps
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/driver/manifest/${selectedVehicle.trip_id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Driver Manifest
                      </Link>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
