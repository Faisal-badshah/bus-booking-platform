import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Clock, MapPin, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SeatSelector } from "@/components/booking/SeatSelector";
import { MultiPassengerForm, type PassengerData } from "@/components/booking/MultiPassengerForm";
import { BookingSummary } from "@/components/booking/BookingSummary";

const passengerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(20)
});

interface Trip {
  id: string;
  trip_date: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  route_id: string;
  recurrence_type?: string;
  recurrence_days?: number[];
  routes: {
    id: string;
    name: string;
    stops: string[];
  };
}

export default function BookTickets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Step 1: Select stops and date
  const [allStops, setAllStops] = useState<string[]>([]);
  const [fromStop, setFromStop] = useState("");
  const [toStop, setToStop] = useState("");
  const [availableToStops, setAvailableToStops] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  
  // Step 2: Select trip
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [loadingTripId, setLoadingTripId] = useState<string | null>(null);
  
  // Step 3: Select seats
  const [availableSeats, setAvailableSeats] = useState<number[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [fromIndex, setFromIndex] = useState(0);
  const [toIndex, setToIndex] = useState(0);
  const [totalSeats, setTotalSeats] = useState(40);
  const [maxSeatsPerBooking, setMaxSeatsPerBooking] = useState(6);
  
  // Step 4: Passenger info
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [fare, setFare] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [pendingBookingIds, setPendingBookingIds] = useState<string[]>([]);
  const [bookingGroupId, setBookingGroupId] = useState<string | null>(null);
  
  // Payment mode settings
  const [paymentMode, setPaymentMode] = useState<'offline' | 'online' | 'hybrid'>('offline');
  const [forceOnlinePayment, setForceOnlinePayment] = useState(false);
  const [useRealGateway, setUseRealGateway] = useState(false);

  // Check authentication
  useEffect(() => {
    checkUser();
    loadPaymentSettings();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book tickets",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    
    setUserId(user.id);
    
    // Load user profile to prefill passenger info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();
    
    setUserProfile({
      full_name: profile?.full_name || "",
      email: user.email || "",
      phone: profile?.phone || ""
    });
    
    setLoading(false);
  };

  const loadPaymentSettings = async () => {
    try {
      // Try direct table access first (works for authenticated users)
      const { data, error } = await supabase
        .from('system_settings')
        .select('booking_mode, max_seats_per_booking')
        .single();

      if (!error && data) {
        setPaymentMode(data.booking_mode as 'offline' | 'online' | 'hybrid');
        setMaxSeatsPerBooking(data.max_seats_per_booking || 6);
        return;
      }
      
      // Fallback to edge function for unauthenticated users
      const { data: publicSettings, error: fnError } = await supabase.functions.invoke('getPublicSettings');
      
      if (!fnError && publicSettings) {
        setPaymentMode(publicSettings.booking_mode as 'offline' | 'online' | 'hybrid');
        setMaxSeatsPerBooking(publicSettings.max_seats_per_booking || 6);
      } else {
        // Safe defaults
        setPaymentMode('offline');
        setMaxSeatsPerBooking(6);
      }
    } catch (error: any) {
      console.error('Error loading payment settings:', error);
      setPaymentMode('offline');
      setMaxSeatsPerBooking(6);
    }
  };

  const determineEffectivePaymentMode = async () => {
    if (!selectedTrip || !selectedDate) return;

    try {
      // Try direct table access first (works for authenticated users)
      let settings: any = null;
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('use_real_payment_gateway, festival_force_online, online_payment_weekends, online_payment_disable_from, online_payment_disable_to')
        .single();

      if (!error && data) {
        settings = data;
        // use_real_payment_gateway is only available to authenticated users
        setUseRealGateway(data.use_real_payment_gateway || false);
      } else {
        // Fallback to edge function for unauthenticated users
        const { data: publicSettings } = await supabase.functions.invoke('getPublicSettings');
        if (publicSettings) {
          settings = publicSettings;
          // Public settings don't include use_real_payment_gateway (sensitive)
          setUseRealGateway(false);
        }
      }

      if (!settings) {
        setForceOnlinePayment(false);
        return;
      }

      // Rule 1: Festival mode overrides everything
      if (settings.festival_force_online) {
        setForceOnlinePayment(true);
        return;
      }

      // Rule 2: Weekend check
      const tripDateObj = new Date(selectedDate);
      const dayOfWeek = tripDateObj.getDay();
      if (settings.online_payment_weekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        setForceOnlinePayment(true);
        return;
      }

      // Rule 4: Time range check
      if (settings.online_payment_disable_from && settings.online_payment_disable_to) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (currentTime >= settings.online_payment_disable_from && 
            currentTime <= settings.online_payment_disable_to) {
          setForceOnlinePayment(true);
          return;
        }
      }

      setForceOnlinePayment(false);
    } catch (error) {
      console.error('Error determining payment mode:', error);
      setForceOnlinePayment(false);
    }
  };

  // Load all unique stops from all routes
  useEffect(() => {
    loadAllStops();
  }, []);

  const loadAllStops = async () => {
    const { data: routes } = await supabase
      .from("routes")
      .select("stops");
    
    if (routes) {
      const uniqueStops = new Set<string>();
      routes.forEach((route: any) => {
        if (route.stops) {
          route.stops.forEach((stop: string) => uniqueStops.add(stop));
        }
      });
      setAllStops(Array.from(uniqueStops).sort());
    }
  };

  // When FROM stop is selected, load available TO stops
  useEffect(() => {
    if (fromStop) {
      loadAvailableToStops(fromStop);
    } else {
      setAvailableToStops([]);
      setToStop("");
    }
  }, [fromStop]);

  const loadAvailableToStops = async (from: string) => {
    const { data: routes } = await supabase
      .from("routes")
      .select("stops");
    
    if (routes) {
      const possibleToStops = new Set<string>();
      
      routes.forEach((route: any) => {
        if (route.stops) {
          const fromIdx = route.stops.indexOf(from);
          if (fromIdx !== -1) {
            // Add all stops after the from stop
            for (let i = fromIdx + 1; i < route.stops.length; i++) {
              possibleToStops.add(route.stops[i]);
            }
          }
        }
      });
      
      setAvailableToStops(Array.from(possibleToStops).sort());
    }
  };

  // Load trips when FROM, TO, and DATE are selected using searchTrips edge function
  const handleSearchTrips = async () => {
    if (!fromStop || !toStop || !selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please select from, to, and date",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('searchTrips', {
        body: { 
          from_stop: fromStop,
          to_stop: toStop,
          search_date: selectedDate
        }
      });

      if (error) throw error;

      setTrips(data.trips || []);
      setStep(2);
    } catch (error) {
      console.error("Error loading trips:", error);
      toast({
        title: "Error",
        description: "Failed to load trips",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  // When a trip is selected, load available seats
  const handleSelectTrip = async (trip: Trip) => {
    // Instant visual feedback: expand card immediately
    setExpandedTripId(trip.id);
    setLoadingTripId(trip.id);
    setSelectedTrip(trip);
    
    // Determine effective payment mode based on rules
    await determineEffectivePaymentMode();

    const route = Array.isArray(trip.routes) ? trip.routes[0] : trip.routes;
    const stops = route?.stops || [];
    
    const fromIdx = stops.indexOf(fromStop);
    const toIdx = stops.indexOf(toStop);
    
    setFromIndex(fromIdx);
    setToIndex(toIdx);

    // Fetch bus details to get total seat count
    try {
      const { data: busData } = await supabase
        .from("trips")
        .select("buses:bus_id(seat_count)")
        .eq("id", trip.id)
        .single();
      
      const bus = Array.isArray(busData?.buses) ? busData.buses[0] : busData?.buses;
      setTotalSeats(bus?.seat_count || 40);
    } catch (error) {
      console.error("Error loading bus info:", error);
    }

    // Call available-seats edge function
    try {
      const { data, error } = await supabase.functions.invoke('available-seats', {
        body: { 
          trip_id: trip.id,
          from_index: fromIdx,
          to_index: toIdx,
          trip_date: trip.trip_date
        }
      });

      if (error) {
        console.error('Error fetching available seats:', error);
        toast({
          title: "Error",
          description: "Failed to load seat availability. Please try again.",
          variant: "destructive",
        });
        setLoadingTripId(null);
        setExpandedTripId(null);
        return;
      }

      if (data) {
        setAvailableSeats(data.available_seats || []);
        
        // Safe fare extraction with validation
        const fareValue = Number(data.fare_per_seat) || 0;
        if (fareValue <= 0) {
          console.error('Invalid fare from backend:', data.fare_per_seat);
          toast({
            title: "Error",
            description: "Invalid fare calculation. Please try another trip.",
            variant: "destructive",
          });
          setLoadingTripId(null);
          setExpandedTripId(null);
          return;
        }
        
        setFare(fareValue);
        setLoadingTripId(null);
        setStep(3);
      }
    } catch (error) {
      console.error("Error loading seats:", error);
      toast({
        title: "Error",
        description: "Failed to load available seats",
        variant: "destructive"
      });
      setLoadingTripId(null);
      setExpandedTripId(null);
    }
  };

  const handleSeatsSelect = (seats: number[]) => {
    setSelectedSeats(seats);
  };

  const handleContinueToPassengerInfo = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "No Seats Selected",
        description: "Please select at least one seat to continue",
        variant: "destructive"
      });
      return;
    }
    setStep(4);
  };

  const handlePassengerSubmit = (passengersData: PassengerData[]) => {
    setPassengers(passengersData);
    handleBooking(passengersData);
  };

  const handleBooking = async (passengersData: PassengerData[]) => {
    if (!userId || !selectedTrip || selectedSeats.length === 0 || !fromStop || !toStop) {
      toast({
        title: "Error",
        description: "Missing required booking information",
        variant: "destructive",
      });
      setBookingLoading(false);
      return;
    }

    // Validate fare before proceeding
    const safeFare = Number(fare) || 0;
    if (safeFare <= 0) {
      toast({
        title: "Invalid Fare",
        description: "Fare calculation error. Please try selecting the trip again.",
        variant: "destructive",
      });
      setBookingLoading(false);
      return;
    }

    // Validate passenger count matches seat count
    if (passengersData.length !== selectedSeats.length) {
      toast({
        title: "Error",
        description: "Number of passengers must match number of seats selected",
        variant: "destructive",
      });
      setBookingLoading(false);
      return;
    }

    setBookingLoading(true);

    try {
      // Step 1: Create booking with pending_payment status
      const { data, error } = await supabase.functions.invoke('createBookingSegment', {
        body: {
          user_id: userId,
          trip_id: selectedTrip.id,
          seat_numbers: selectedSeats,
          from_stop: fromStop,
          to_stop: toStop,
          trip_date: selectedTrip.trip_date,
          passengers: passengersData
        }
      });

      if (error) {
        console.error('Booking error:', error);
        throw error;
      }

      if (!data.success) {
        // Check for seat conflict
        if (data.reason === 'seat_taken') {
          toast({
            title: "Seat Unavailable",
            description: `Seat ${data.conflicting_seat} is already booked. Please select different seats.`,
            variant: "destructive",
          });
          setStep(3); // Go back to seat selection
          setBookingLoading(false);
          return;
        }

        toast({
          title: "Booking Failed",
          description: data.message || "Unable to complete booking",
          variant: "destructive"
        });
        setBookingLoading(false);
        return;
      }

      // Store booking IDs and group ID
      const bookingIds = data.bookings?.map((b: any) => b.id) || [];
      setPendingBookingIds(bookingIds);
      setBookingGroupId(data.booking_group_id);
      
      // Validate fare from backend
      const totalFare = Number(data.fare_total) || 0;
      if (totalFare > 0) {
        setFare(totalFare / selectedSeats.length); // Set per-seat fare
      }
      
      // Step 2: Show booking summary
      setStep(5); // Move to booking summary step
      
      toast({
        title: "Booking Summary",
        description: "Review your booking details",
      });

    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePaymentConfirmation = async () => {
    if (pendingBookingIds.length === 0 || !bookingGroupId) return;

    setBookingLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      console.log('Creating Razorpay order:', {
        booking_group_id: bookingGroupId,
        amount: fare,
        user_id: user?.id
      });

      // Determine which payment provider to use
      const functionName = useRealGateway ? 'createRazorpayOrder' : 'mockPaymentProvider/create-order';
      console.log('Using payment provider:', functionName, 'Real gateway:', useRealGateway);

      // Step 3: Create payment order (Razorpay or Mock)
      const { data: orderData, error: orderError } = await supabase.functions.invoke(functionName, {
        body: {
          booking_group_id: bookingGroupId,
          amount: fare,
          currency: 'INR',
          user_id: user?.id
        }
      });

      console.log('Order creation response:', orderData);

      if (orderError || !orderData?.success) {
        console.error('Order creation failed:', orderError || orderData);
        toast({
          title: "Payment Failed",
          description: orderData?.error || "Unable to create payment order",
          variant: "destructive"
        });
        setBookingLoading(false);
        return;
      }

      const { order_id, amount, currency } = orderData;
      console.log('Order created successfully:', { order_id, amount, currency });

      if (useRealGateway) {
        // Use real Razorpay
        // Step 4: Open Razorpay checkout
        const firstPassenger = passengers[0];
        const razorpayOptions = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: amount,
          currency: currency,
          name: "Bus Booking",
          description: `Booking for ${selectedTrip?.routes?.name || 'trip'}`,
          order_id: order_id,
          prefill: {
            name: firstPassenger?.passenger_name || '',
            email: firstPassenger?.passenger_email || '',
            contact: firstPassenger?.passenger_phone || ''
          },
          theme: {
            color: "#3399cc"
          },
          handler: function (response: any) {
            console.log('Razorpay payment success:', response);
            toast({
              title: "Payment Successful!",
              description: `Your ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} confirmed. Tickets will be emailed shortly.`
            });
            
            setTimeout(() => {
              navigate("/my-bookings");
            }, 2000);
          },
          modal: {
            ondismiss: function() {
              console.log('Razorpay checkout dismissed');
              setBookingLoading(false);
            }
          }
        };

        console.log('Opening Razorpay checkout with options:', {
          ...razorpayOptions,
          key: '***' // Hide key in logs
        });

        // @ts-ignore - Razorpay is loaded via script tag
        const razorpay = new window.Razorpay(razorpayOptions);
        razorpay.open();
      } else {
        // Use mock provider - simulate payment flow
        console.log('Using mock payment provider');
        
        // Show confirmation
        const confirmed = window.confirm(
          'Proceed with online payment?\n\n' +
          'Click OK to continue with payment, or Cancel to go back.'
        );

        if (!confirmed) {
          toast({
            title: "Payment Cancelled",
            description: "Payment was cancelled",
            variant: "destructive"
          });
          setBookingLoading(false);
          return;
        }

        // Simulate payment capture
        try {
          const { data: captureData, error: captureError } = await supabase.functions.invoke(
            'mockPaymentProvider/capture',
            {
              body: {
                order_id: order_id,
                simulate: 'success'
              }
            }
          );

          if (captureError) throw captureError;

          console.log('Mock payment captured:', captureData);

          // Trigger webhook simulation to confirm booking
          const { data: webhookData, error: webhookError } = await supabase.functions.invoke(
            'mockPaymentProvider/simulate-webhook',
            {
              body: {
                booking_group_id: bookingGroupId,
                amount: fare,
                order_id: order_id,
                outcome: 'success'
              }
            }
          );

          if (webhookError) throw webhookError;

          console.log('Mock webhook processed:', webhookData);

          toast({
            title: "Payment Successful!",
            description: `Booking confirmed (${webhookData.bookings_confirmed} seat${webhookData.bookings_confirmed > 1 ? 's' : ''}). Tickets sent to email.`,
          });

          // Redirect to My Bookings
          setTimeout(() => {
            navigate('/my-bookings');
          }, 1500);

        } catch (error: any) {
          console.error('Mock payment error:', error);
          toast({
            title: "Payment Failed",
            description: error.message || "Failed to process payment",
            variant: "destructive"
          });
        } finally {
          setBookingLoading(false);
        }
      }

    } catch (error) {
      console.error("Payment confirmation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      });
      setBookingLoading(false);
    }
  };

  const handleOfflineBooking = async () => {
    if (!pendingBookingIds || pendingBookingIds.length === 0) {
      toast({
        title: "Error",
        description: "No pending bookings found",
        variant: "destructive",
      });
      setBookingLoading(false);
      return;
    }

    setBookingLoading(true);

    try {
      const paymentReference = `OFFLINE-${Date.now()}`;
      let successCount = 0;
      
      // Confirm all bookings in the group
      for (const bookingId of pendingBookingIds) {
        const { data: confirmData, error: confirmError } = await supabase.functions.invoke('confirmBooking', {
          body: {
            booking_id: bookingId,
            payment_reference: paymentReference
          }
        });

        if (confirmError) {
          console.error(`Error confirming booking ${bookingId}:`, confirmError);
          throw confirmError;
        }

        if (!confirmData.success) {
          toast({
            title: "Booking Failed",
            description: confirmData.message || "Unable to confirm booking",
            variant: "destructive"
          });
          setBookingLoading(false);
          return;
        }
        
        successCount++;
      }

      if (successCount === pendingBookingIds.length) {
        toast({
          title: "Booking Confirmed!",
          description: `${successCount} seat${successCount > 1 ? 's' : ''} reserved. Pay on the bus.`,
        });

        setTimeout(() => {
          navigate("/my-bookings");
        }, 2000);
      }

    } catch (error: any) {
      console.error("Offline booking error:", error);
      toast({
        title: "Confirmation Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading && step === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Book Your Ticket</h1>

      {/* Step 1: Select From, To, Date */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Journey Details</CardTitle>
            <CardDescription>Choose your departure and destination stops</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="from">From</Label>
              <Select value={fromStop} onValueChange={setFromStop}>
                <SelectTrigger>
                  <SelectValue placeholder="Select departure stop" />
                </SelectTrigger>
                <SelectContent>
                  {allStops.map(stop => (
                    <SelectItem key={stop} value={stop}>{stop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="to">To</Label>
              <Select value={toStop} onValueChange={setToStop} disabled={!fromStop}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination stop" />
                </SelectTrigger>
                <SelectContent>
                  {availableToStops.map(stop => (
                    <SelectItem key={stop} value={stop}>{stop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <Button 
              onClick={handleSearchTrips} 
              className="w-full"
              disabled={!fromStop || !toStop || !selectedDate || loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Search Trips
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Trip */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Available Trips</h2>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" />
              {fromStop} → {toStop}
              <Calendar className="h-4 w-4 ml-2" />
              {selectedDate}
            </p>
          </div>

          {trips.length === 0 ? (
            <Card className="backdrop-blur-sm bg-card/50 border-2">
              <CardContent className="p-8">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No trips available for this route and date. Please try different stops or date.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {trips.map(trip => {
                const route = Array.isArray(trip.routes) ? trip.routes[0] : trip.routes;
                const isExpanded = expandedTripId === trip.id;
                const isLoading = loadingTripId === trip.id;
                
                const getRecurrenceLabel = () => {
                  if (trip.recurrence_type === "daily") return "Daily";
                  if (trip.recurrence_type === "weekly") return "Weekly";
                  if (trip.recurrence_type === "custom" && trip.recurrence_days) {
                    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                    return days.filter((_, i) => trip.recurrence_days.includes(i)).join("/");
                  }
                  return null;
                };
                
                return (
                  <button
                    key={trip.id}
                    onClick={() => handleSelectTrip(trip)}
                    disabled={isLoading}
                    className="w-full text-left group"
                  >
                    <Card className={`
                      backdrop-blur-sm bg-card/80 border-2 
                      transition-all duration-300 ease-in-out
                      shadow-lg hover:shadow-xl
                      ${isExpanded ? 'ring-2 ring-primary scale-[1.02]' : 'hover:scale-[1.01]'}
                      ${isLoading ? 'opacity-70' : ''}
                    `}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-bold text-lg">{route?.name || 'Route'}</h3>
                                {getRecurrenceLabel() && (
                                  <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                                    {getRecurrenceLabel()}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" />
                                  <span>Departs {trip.departure_time}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" />
                                  <span>Arrives {trip.arrival_time}</span>
                                </div>
                              </div>
                            </div>
                            
                            <Button 
                              size="lg"
                              className={`
                                min-w-[120px] transition-all duration-200
                                ${isLoading ? 'cursor-wait' : ''}
                              `}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Loading...
                                </>
                              ) : (
                                'Select Trip'
                              )}
                            </Button>
                          </div>

                          {/* Expanded Loading State */}
                          {isExpanded && isLoading && (
                            <div className="space-y-3 pt-4 border-t animate-fade-in">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-20 w-full" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          )}
          
          <div className="max-w-3xl mx-auto">
            <Button 
              variant="outline" 
              onClick={() => {
                setStep(1);
                setExpandedTripId(null);
                setLoadingTripId(null);
              }} 
              className="w-full"
              size="lg"
            >
              Back to Search
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Select Seat */}
      {step === 3 && selectedTrip && (
        <Card>
          <CardHeader>
            <CardTitle>Select Your Seat</CardTitle>
            <CardDescription>
              {availableSeats.length} seats available
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {availableSeats.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No seats available for this segment. Please try a different trip.
                </AlertDescription>
              </Alert>
            ) : (
              <SeatSelector
                totalSeats={totalSeats}
                availableSeats={availableSeats}
                selectedSeats={selectedSeats}
                onSeatsSelect={handleSeatsSelect}
                maxSeats={maxSeatsPerBooking}
                farePerSeat={fare}
              />
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back to Trips
              </Button>
              <Button 
                onClick={handleContinueToPassengerInfo} 
                disabled={selectedSeats.length === 0}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Passenger Info */}
      {step === 4 && selectedTrip && selectedSeats.length > 0 && (
        <MultiPassengerForm
          seatNumbers={selectedSeats}
          onSubmit={handlePassengerSubmit}
          onBack={() => setStep(3)}
          userProfile={userProfile}
        />
      )}

      {/* Step 5: Booking Summary */}
      {step === 5 && selectedTrip && selectedSeats.length > 0 && bookingGroupId && (
        <BookingSummary
          tripDetails={{
            routeName: selectedTrip.routes.name,
            fromStop: fromStop,
            toStop: toStop,
            tripDate: selectedTrip.trip_date,
            departureTime: selectedTrip.departure_time,
            arrivalTime: selectedTrip.arrival_time,
            busName: "Bus"
          }}
          passengers={passengers.map((p, i) => ({
            ...p,
            name: p.passenger_name,
            email: p.passenger_email,
            phone: p.passenger_phone,
            seatNumber: selectedSeats[i]
          }))}
          farePerSeat={fare}
          onConfirm={() => setStep(6)}
          onBack={() => setStep(4)}
          loading={false}
          bookingMode={paymentMode === 'offline' && !forceOnlinePayment ? 'offline' : 'online'}
        />
      )}

      {/* Step 6: Payment Confirmation */}
      {step === 6 && bookingGroupId && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Payment</CardTitle>
            <CardDescription>
              Total Fare: ₹{fare} for {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {(forceOnlinePayment || paymentMode === 'online') 
                  ? 'Online payment is required for this booking.'
                  : 'Your seats are reserved for 10 minutes. Choose your payment method.'}
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p><strong>Route:</strong> {fromStop} → {toStop}</p>
              <p><strong>Seats:</strong> {selectedSeats.join(', ')}</p>
              <p><strong>Passengers:</strong> {passengers.length}</p>
              <p><strong>Amount:</strong> ₹{fare}</p>
            </div>

            {/* Show payment options based on mode */}
            {(forceOnlinePayment || paymentMode === 'online') ? (
              // Online payment required
              <Button 
                onClick={handlePaymentConfirmation} 
                disabled={bookingLoading}
                className="w-full"
              >
                {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Pay Online (Razorpay)
              </Button>
            ) : paymentMode === 'hybrid' ? (
              // Hybrid: Show both options
              <div className="space-y-3">
              <Button 
                onClick={handlePaymentConfirmation} 
                disabled={bookingLoading}
                className="w-full"
                variant="default"
              >
                {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Pay Online
              </Button>
                <Button 
                  onClick={handleOfflineBooking} 
                  disabled={bookingLoading}
                  className="w-full"
                  variant="outline"
                >
                  {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Pay on Bus
                </Button>
              </div>
            ) : (
              // Offline only
              <Button 
                onClick={handleOfflineBooking} 
                disabled={bookingLoading}
                className="w-full"
              >
                {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Book Now (Pay on Bus)
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
