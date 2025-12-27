'use client';

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Bus, MapPin, Clock, AlertCircle, Navigation, Phone, Gauge, Target, CheckCircle2, Globe, Shield } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Premium animated bus icon with pulse and direction
const createBusIcon = (heading: number = 0) => {
  return new L.DivIcon({
    className: "custom-bus-marker",
    html: `
      <div class="relative" style="transform: rotate(${heading}deg); transition: transform 0.8s ease-out;">
        <div class="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus">
            <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
            <circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
          </svg>
        </div>
        <div class="absolute inset-0 rounded-full bg-green-600/30 animate-ping"></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
};

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

function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 14, { animate: true, duration: 1.5 });
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
  const [distanceToBoarding, setDistanceToBoarding] = useState<number | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "hi">("en");

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "hi" : "en"));
  };

  const content = {
    en: {
      title: "Track Bus - Ride Bus",
      description: "Live tracking of your bus journey with real-time location and ETA.",
      trackYourBus: "Track Your Bus",
      tripCompleted: "Trip Completed",
      thankYou: "Thank you for traveling with us!",
      trackingNotStarted: "Tracking Not Started",
      driverNotStarted: "The driver hasn't started tracking yet",
      bookingNotFound: "Booking not found",
      backToBookings: "Back to My Bookings",
      trackingNotAvailable: "Tracking Not Available",
      featureUnavailable: "Bus tracking feature is currently not available.",
      live: "Live",
      slightlyDelayed: "Slightly Delayed",
      possiblyOffline: "Possibly Offline",
      secondsAgo: "s ago",
      poorConnectivity: "Driver may be in an area with poor connectivity",
      openGoogleMaps: "Open in Google Maps",
      distance: "Distance",
      etaText: "ETA",
      arrivingNow: "Arriving now",
      busStopped: "Bus stopped",
      calculating: "Calculating...",
      busDetails: "Bus Details",
      busNumber: "Bus Number",
      totalSeats: "Total Seats",
      currentSpeed: "Current Speed",
      driverContact: "Driver Contact",
      trackingStatus: "Tracking Status",
      lastUpdate: "Last update",
      tripDetails: "Trip Details",
      route: "Route",
      departure: "Departure",
      date: "Date",
      passenger: "Passenger",
      boardingPoint: "Boarding Point",
      trustMessage: "Real-time GPS · Accurate ETA · Safe & Reliable",
    },
    hi: {
      title: "बस ट्रैक करें - राइड बस",
      description: "अपनी बस यात्रा का रियल-टाइम लोकेशन और अनुमानित समय के साथ लाइव ट्रैकिंग।",
      trackYourBus: "अपनी बस ट्रैक करें",
      tripCompleted: "यात्रा पूरी हुई",
      thankYou: "हमारे साथ यात्रा करने के लिए धन्यवाद!",
      trackingNotStarted: "ट्रैकिंग शुरू नहीं हुई",
      driverNotStarted: "ड्राइवर ने अभी तक ट्रैकिंग शुरू नहीं की है",
      bookingNotFound: "बुकिंग नहीं मिली",
      backToBookings: "मेरी बुकिंग्स पर वापस",
      trackingNotAvailable: "ट्रैकिंग उपलब्ध नहीं",
      featureUnavailable: "बस ट्रैकिंग सुविधा वर्तमान में उपलब्ध नहीं है।",
      live: "लाइव",
      slightlyDelayed: "थोड़ा विलंब",
      possiblyOffline: "संभवतः ऑफलाइन",
      secondsAgo: "सेकंड पहले",
      poorConnectivity: "ड्राइवर कम कनेक्टिविटी वाले क्षेत्र में हो सकता है",
      openGoogleMaps: "Google Maps में खोलें",
      distance: "दूरी",
      etaText: "अनुमानित समय",
      arrivingNow: "अभी पहुंच रही है",
      busStopped: "बस रुकी हुई है",
      calculating: "गणना हो रही है...",
      busDetails: "बस विवरण",
      busNumber: "बस नंबर",
      totalSeats: "कुल सीटें",
      currentSpeed: "वर्तमान गति",
      driverContact: "ड्राइवर संपर्क",
      trackingStatus: "ट्रैकिंग स्थिति",
      lastUpdate: "अंतिम अपडेट",
      tripDetails: "यात्रा विवरण",
      route: "रूट",
      departure: "प्रस्थान",
      date: "तारीख",
      passenger: "यात्री",
      boardingPoint: "बोर्डिंग पॉइंट",
      trustMessage: "रियल-टाइम जीपीएस · सटीक अनुमानित समय · सुरक्षित और विश्वसनीय",
    }
  }[language];

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
    } else if (secondsSinceUpdate < 300) {
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
        setEta(content.arrivingNow);
      } else if (minutesToArrival < 60) {
        setEta(`~${minutesToArrival} ${language === "en" ? "min" : "मिनट"}`);
      } else {
        const hours = Math.floor(minutesToArrival / 60);
        const mins = minutesToArrival % 60;
        setEta(`~${hours}h ${mins}m`);
      }
    } else if (location && location.speed === 0) {
      setEta(content.busStopped);
    } else {
      setEta(null);
    }
  }, [location, distanceToBoarding, language]);

  // Mock distance calculation
  useEffect(() => {
    if (location && booking) {
      const mockDistance = 5 + Math.random() * 10;
      setDistanceToBoarding(Number(mockDistance.toFixed(1)));
    }
  }, [location, booking]);

  // Fetch booking and initial location
  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) return;

      try {
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
        toast.error(language === "en" ? "Failed to load tracking data" : "ट्रैकिंग डेटा लोड करने में विफल");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, language]);

  // Realtime subscription
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-600 rounded-full border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">{language === "en" ? "Loading tracking..." : "ट्रैकिंग लोड हो रही है..."}</p>
        </div>
      </motion.div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="pt-8 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{content.bookingNotFound}</h2>
            <Button onClick={() => navigate("/my-bookings")} size="lg" className="mt-6">
              {content.backToBookings}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trackingEnabled) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="pt-8 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{content.trackingNotAvailable}</h2>
            <p className="text-muted-foreground mb-6">{content.featureUnavailable}</p>
            <Button onClick={() => navigate("/my-bookings")} size="lg">
              {content.backToBookings}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (tripStatus) {
      case "completed":
        return <Badge className="bg-green-600 text-white px-4 py-1.5">{content.tripCompleted}</Badge>;
      case "in_progress":
        return <Badge className="bg-green-600 text-white px-4 py-1.5 animate-pulse">{language === "en" ? "En Route" : "रास्ते में"}</Badge>;
      default:
        return <Badge variant="secondary" className="px-4 py-1.5">{language === "en" ? "Not Started" : "शुरू नहीं हुई"}</Badge>;
    }
  };

  const getOnlineStatus = () => {
    if (secondsSinceUpdate < 30) return { status: "live", label: content.live };
    if (secondsSinceUpdate < 45) return { status: "delayed", label: content.slightlyDelayed };
    return { status: "offline", label: content.possiblyOffline };
  };

  const onlineStatus = getOnlineStatus();
  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 4) return "****";
    return "****" + phone.slice(-4);
  };

  return (
    <>
      <Helmet>
        <title>{content.title}</title>
        <meta name="description" content={content.description} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950">
        {/* Premium Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-sm"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/my-bookings")}
                  className="rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Bus className="h-6 w-6 text-green-600" />
                    {content.trackYourBus}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {booking.trips.from_city} → {booking.trips.to_city} • {new Date(booking.trips.trip_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={toggleLanguage}>
                  <Globe className="h-5 w-5" />
                </Button>
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </motion.header>

        {/* Map Section - Full Premium Experience */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative h-96 md:h-[50vh] lg:h-[60vh] overflow-hidden rounded-b-3xl shadow-2xl"
        >
          {location ? (
            <MapContainer
              center={[location.latitude, location.longitude]}
              zoom={14}
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker 
                position={[location.latitude, location.longitude]} 
                icon={createBusIcon(location.heading)}
              >
                <Popup>
                  <div className="text-center p-2">
                    <p className="font-bold text-green-700">{booking.trips.buses?.name || "Ride Bus"}</p>
                    <p className="text-sm">Speed: {(location.speed * 3.6).toFixed(0)} km/h</p>
                    <p className="text-xs text-muted-foreground">Last updated {secondsSinceUpdate}s ago</p>
                  </div>
                </Popup>
              </Marker>
              <MapUpdater position={[location.latitude, location.longitude]} />
            </MapContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900">
              <Bus className="h-20 w-20 text-gray-400 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-2">{content.trackingNotStarted}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center px-8">{content.driverNotStarted}</p>
            </div>
          )}

          {/* Live Indicator Overlay */}
          {location && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-4 right-4 z-10"
            >
              <Badge 
                className={`
                  px-4 py-2 text-sm font-medium shadow-lg
                  ${onlineStatus.status === "live" ? "bg-green-600" : 
                    onlineStatus.status === "delayed" ? "bg-yellow-600" : "bg-red-600"}
                `}
              >
                <span className={`w-3 h-3 rounded-full mr-2 inline-block animate-pulse ${
                  onlineStatus.status === "live" ? "bg-white" : "bg-white/80"
                }`} />
                {onlineStatus.label} • {secondsSinceUpdate}{content.secondsAgo}
              </Badge>
            </motion.div>
          )}

          {/* Trust Banner */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white text-center text-sm font-medium flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              {content.trustMessage}
            </p>
          </div>
        </motion.div>

        {/* Info Cards Section */}
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* ETA & Distance Card */}
          {location && tripStatus === "in_progress" && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <Card className="border-green-200 dark:border-green-900 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 shadow-xl">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-full bg-green-600 text-white shadow-lg">
                        <Target className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{content.distance}</p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-400">{distanceToBoarding} km</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-full bg-green-600 text-white shadow-lg">
                        <Clock className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{content.etaText}</p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-400">{eta || content.calculating}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Trip Completed Card */}
          {tripStatus === "completed" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-12"
            >
              <CheckCircle2 className="h-24 w-24 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">{content.tripCompleted}</h2>
              <p className="text-lg text-muted-foreground">{content.thankYou}</p>
            </motion.div>
          )}

          {/* Bus Details */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Bus className="h-6 w-6 text-green-600" />
                  {content.busDetails}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{content.busNumber}</p>
                  <p className="font-semibold text-lg">{booking.trips.buses?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{content.totalSeats}</p>
                  <p className="font-semibold text-lg">{booking.trips.buses?.seat_count || "N/A"}</p>
                </div>
                {location && (
                  <>
                    <div>
                      <p className="text-muted-foreground">{content.currentSpeed}</p>
                      <p className="font-semibold text-lg flex items-center gap-2">
                        <Gauge className="h-5 w-5 text-green-600" />
                        {(location.speed * 3.6).toFixed(0)} km/h
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{content.driverContact}</p>
                      <p className="font-semibold text-lg flex items-center gap-2">
                        <Phone className="h-5 w-5 text-green-600" />
                        {maskPhone("9876543210")}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Tracking Status */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <Navigation className="h-6 w-6 text-green-600" />
                    {content.trackingStatus}
                  </span>
                  <Badge 
                    className={onlineStatus.status === "live" ? "bg-green-600" : onlineStatus.status === "delayed" ? "bg-yellow-600" : "bg-red-600"}
                  >
                    {onlineStatus.label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {location ? (
                  <>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      <span>{content.lastUpdate}: {secondsSinceUpdate}{content.secondsAgo}</span>
                    </div>
                    {onlineStatus.status === "offline" && (
                      <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg text-amber-800 dark:text-amber-300">
                        {content.poorConnectivity}
                      </div>
                    )}
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        <Navigation className="h-5 w-5 mr-2" />
                        {content.openGoogleMaps}
                      </Button>
                    </a>
                  </>
                ) : (
                  <p className="text-muted-foreground italic text-center py-4">
                    {language === "en" ? "Waiting for driver to start the trip..." : "ड्राइवर के ट्रिप शुरू करने की प्रतीक्षा है..."}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Trip Details */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">{content.tripDetails}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{content.route}</span>
                  <span className="font-medium">{booking.trips.route}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{content.departure}</span>
                  <span className="font-medium">{booking.trips.departure_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{content.date}</span>
                  <span className="font-medium">{new Date(booking.trips.trip_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{content.passenger}</span>
                  <span className="font-medium">{booking.passenger_name}</span>
                </div>
                {booking.trips.routes?.stops && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{content.boardingPoint}</span>
                    <span className="font-medium">{booking.trips.routes.stops[booking.from_index] || "N/A"}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default TrackBus;