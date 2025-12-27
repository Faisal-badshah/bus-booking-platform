/// <reference types="vite/client" />
'use client';

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Clock, MapPin, Calendar, Globe, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SeatSelector } from "@/components/booking/SeatSelector";
import { MultiPassengerForm, type PassengerData } from "@/components/booking/MultiPassengerForm";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

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
  const [language, setLanguage] = useState<"en" | "hi">("en");
  
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

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "hi" : "en"));
  };

  const content = {
    en: {
      title: "Book Tickets - Ride Bus",
      description: "Book your premium bus tickets in Bihar easily and securely.",
      journeyDetails: "Select Journey Details",
      from: "From",
      to: "To",
      date: "Date",
      search: "Search Trips",
      availableTrips: "Available Trips",
      noTrips: "No trips available for this route and date. Please try different stops or date.",
      selectTrip: "Select Trip",
      selectSeat: "Select Your Seat",
      seatsAvailable: "seats available",
      backToTrips: "Back to Trips",
      continue: "Continue",
      confirmPayment: "Confirm Payment",
      totalFare: "Total Fare",
      onlineRequired: "Online payment is required for this booking.",
      reserved: "Your seats are reserved for 10 minutes. Choose your payment method.",
      payOnline: "Pay Online",
      payOnBus: "Pay on Bus",
      bookingFailed: "Booking Failed",
      paymentFailed: "Payment Failed",
      bookingConfirmed: "Booking Confirmed!",
      seatsReserved: "seats reserved. Pay on the bus.",
      paymentSuccessful: "Payment Successful!",
      seatsConfirmed: "seats confirmed. Tickets will be emailed shortly.",
      trustMessage: "Secure Payments · Instant Confirmation · Full Refund Policy",
    },
    hi: {
      title: "टिकट बुक करें - राइड बस",
      description: "बिहार में अपनी प्रीमियम बस टिकट आसानी और सुरक्षित रूप से बुक करें।",
      journeyDetails: "यात्रा विवरण चुनें",
      from: "से",
      to: "तक",
      date: "तारीख",
      search: "ट्रिप खोजें",
      availableTrips: "उपलब्ध ट्रिप्स",
      noTrips: "इस रूट और तारीख के लिए कोई ट्रिप उपलब्ध नहीं है। कृपया अलग स्टॉप या तारीख आजमाएं।",
      selectTrip: "ट्रिप चुनें",
      selectSeat: "अपनी सीट चुनें",
      seatsAvailable: "सीटें उपलब्ध",
      backToTrips: "ट्रिप्स पर वापस",
      continue: "जारी रखें",
      confirmPayment: "भुगतान की पुष्टि करें",
      totalFare: "कुल किराया",
      onlineRequired: "इस बुकिंग के लिए ऑनलाइन भुगतान आवश्यक है।",
      reserved: "आपकी सीटें 10 मिनट के लिए आरक्षित हैं। अपना भुगतान विधि चुनें।",
      payOnline: "ऑनलाइन भुगतान करें",
      payOnBus: "बस पर भुगतान करें",
      bookingFailed: "बुकिंग विफल",
      paymentFailed: "भुगतान विफल",
      bookingConfirmed: "बुकिंग पुष्टि हुई!",
      seatsReserved: "सीटें आरक्षित। बस पर भुगतान करें।",
      paymentSuccessful: "भुगतान सफल!",
      seatsConfirmed: "सीटें पुष्टि हुई। टिकट ईमेल पर भेजे जाएंगे।",
      trustMessage: "सुरक्षित भुगतान · तत्काल पुष्टि · पूरा रिफंड नीति",
    }
  }[language];

  // Check authentication
  useEffect(() => {
    checkUser();
    loadPaymentSettings();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: content.bookingFailed,
        description: language === "en" ? "Please log in to book tickets" : "टिकट बुक करने के लिए लॉगिन करें",
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
        title: language === "en" ? "Missing Information" : "जानकारी गुम है",
        description: language === "en" ? "Please select from, to, and date" : "कृपया से, तक, और तारीख चुनें",
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
        title: language === "en" ? "Error" : "त्रुटि",
        description: language === "en" ? "Failed to load trips" : "ट्रिप लोड करने में विफल",
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
          title: language === "en" ? "Error" : "त्रुटि",
          description: language === "en" ? "Failed to load seat availability. Please try again." : "सीट उपलब्धता लोड करने में विफल। कृपया फिर से प्रयास करें।",
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
            title: language === "en" ? "Error" : "त्रुटि",
            description: language === "en" ? "Invalid fare calculation. Please try another trip." : "अमान्य किराया गणना। कृपया दूसरी ट्रिप आजमाएं।",
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
        title: language === "en" ? "Error" : "त्रुटि",
        description: language === "en" ? "Failed to load available seats" : "उपलब्ध सीटें लोड करने में विफल",
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
        title: language === "en" ? "No Seats Selected" : "कोई सीट नहीं चुनी गई",
        description: language === "en" ? "Please select at least one seat to continue" : "जारी रखने के लिए कम से कम एक सीट चुनें",
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
        title: content.bookingFailed,
        description: language === "en" ? "Missing required booking information" : "आवश्यक बुकिंग जानकारी गुम है",
        variant: "destructive",
      });
      setBookingLoading(false);
      return;
    }

    // Validate fare before proceeding
    const safeFare = Number(fare) || 0;
    if (safeFare <= 0) {
      toast({
        title: language === "en" ? "Invalid Fare" : "अमान्य किराया",
        description: language === "en" ? "Fare calculation error. Please try selecting the trip again." : "किराया गणना त्रुटि। कृपया ट्रिप फिर चुनें।",
        variant: "destructive",
      });
      setBookingLoading(false);
      return;
    }

    // Validate passenger count matches seat count
    if (passengersData.length !== selectedSeats.length) {
      toast({
        title: content.bookingFailed,
        description: language === "en" ? "Number of passengers must match number of seats selected" : "यात्रियों की संख्या चुनी गई सीटों से मेल खानी चाहिए",
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
            title: language === "en" ? "Seat Unavailable" : "सीट उपलब्ध नहीं",
            description: language === "en" ? `Seat ${data.conflicting_seat} is already booked. Please select different seats.` : `सीट ${data.conflicting_seat} पहले से बुक है। कृपया अलग सीट चुनें।`,
            variant: "destructive",
          });
          setStep(3); // Go back to seat selection
          setBookingLoading(false);
          return;
        }

        toast({
          title: content.bookingFailed,
          description: data.message || language === "en" ? "Unable to complete booking" : "बुकिंग पूरा करने में असमर्थ",
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
        title: language === "en" ? "Booking Summary" : "बुकिंग सारांश",
        description: language === "en" ? "Review your booking details" : "अपने बुकिंग विवरण की समीक्षा करें",
      });

    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: content.bookingFailed,
        description: error.message || language === "en" ? "Please try again" : "कृपया फिर से प्रयास करें",
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
          title: content.paymentFailed,
          description: orderData?.error || language === "en" ? "Unable to create payment order" : "भुगतान ऑर्डर बनाने में असमर्थ",
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
              title: content.paymentSuccessful,
              description: language === "en" ? `Your ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} confirmed. Tickets will be emailed shortly.` : `आपकी ${selectedSeats.length} सीट${selectedSeats.length > 1 ? 'ें' : ''} पुष्टि हुई। टिकट शीघ्र ईमेल किए जाएंगे।`
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
          language === "en" ? 'Proceed with online payment?\n\n' + 'Click OK to continue with payment, or Cancel to go back.' : 'ऑनलाइन भुगतान जारी रखें?\n\n' + 'भुगतान जारी रखने के लिए OK क्लिक करें, या वापस जाने के लिए Cancel.'
        );

        if (!confirmed) {
          toast({
            title: language === "en" ? "Payment Cancelled" : "भुगतान रद्द",
            description: language === "en" ? "Payment was cancelled" : "भुगतान रद्द किया गया",
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
            title: content.paymentSuccessful,
            description: language === "en" ? `Booking confirmed (${webhookData.bookings_confirmed} seat${webhookData.bookings_confirmed > 1 ? 's' : ''}). Tickets sent to email.` : `बुकिंग पुष्टि हुई (${webhookData.bookings_confirmed} सीट${webhookData.bookings_confirmed > 1 ? 'ें' : ''})। टिकट ईमेल पर भेजे गए।`
          });

          // Redirect to My Bookings
          setTimeout(() => {
            navigate('/my-bookings');
          }, 1500);

        } catch (error: any) {
          console.error('Mock payment error:', error);
          toast({
            title: content.paymentFailed,
            description: error.message || language === "en" ? "Failed to process payment" : "भुगतान संसाधित करने में विफल",
            variant: "destructive"
          });
        } finally {
          setBookingLoading(false);
        }
      }

    } catch (error) {
      console.error("Payment confirmation error:", error);
      toast({
        title: language === "en" ? "Error" : "त्रुटि",
        description: error instanceof Error ? error.message : language === "en" ? "Failed to process payment" : "भुगतान संसाधित करने में विफल",
        variant: "destructive"
      });
      setBookingLoading(false);
    }
  };

  const handleOfflineBooking = async () => {
    if (!pendingBookingIds || pendingBookingIds.length === 0) {
      toast({
        title: content.bookingFailed,
        description: language === "en" ? "No pending bookings found" : "कोई लंबित बुकिंग नहीं मिली",
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
            title: content.bookingFailed,
            description: confirmData.message || language === "en" ? "Unable to confirm booking" : "बुकिंग पुष्टि करने में असमर्थ",
            variant: "destructive"
          });
          setBookingLoading(false);
          return;
        }
        
        successCount++;
      }

      if (successCount === pendingBookingIds.length) {
        toast({
          title: content.bookingConfirmed,
          description: language === "en" ? `${successCount} seat${successCount > 1 ? 's' : ''} reserved. Pay on the bus.` : `${successCount} सीट${successCount > 1 ? 'ें' : ''} आरक्षित। बस पर भुगतान करें।`
        });

        setTimeout(() => {
          navigate("/my-bookings");
        }, 2000);
      }

    } catch (error: any) {
      console.error("Offline booking error:", error);
      toast({
        title: content.bookingFailed,
        description: error.message || language === "en" ? "Please try again" : "कृपया फिर से प्रयास करें",
        variant: "destructive"
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading && step === 1) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen bg-background"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </motion.div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{content.title}</title>
        <meta name="description" content={content.description} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground">{content.title}</h1>
          <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Toggle Language">
            <Globe className="h-5 w-5 text-foreground" />
          </Button>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground flex items-center gap-2 mb-8 justify-center"
        >
          <Shield className="h-4 w-4 text-green-600" />
          {content.trustMessage}
        </motion.p>

        {/* Step 1: Select Journey Details */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-none shadow-lg bg-card">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">{content.journeyDetails}</CardTitle>
                <CardDescription className="text-sm sm:text-base">{language === "en" ? "Choose your departure and destination stops" : "अपने प्रस्थान और गंतव्य स्टॉप चुनें"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="from" className="text-sm sm:text-base">{content.from}</Label>
                  <Select value={fromStop} onValueChange={setFromStop}>
                    <SelectTrigger className="h-10 sm:h-12">
                      <SelectValue placeholder={language === "en" ? "Select departure stop" : "प्रस्थान स्टॉप चुनें"} />
                    </SelectTrigger>
                    <SelectContent>
                      {allStops.map(stop => (
                        <SelectItem key={stop} value={stop}>{stop}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="to" className="text-sm sm:text-base">{content.to}</Label>
                  <Select value={toStop} onValueChange={setToStop} disabled={!fromStop}>
                    <SelectTrigger className="h-10 sm:h-12">
                      <SelectValue placeholder={language === "en" ? "Select destination stop" : "गंतव्य स्टॉप चुनें"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableToStops.map(stop => (
                        <SelectItem key={stop} value={stop}>{stop}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date" className="text-sm sm:text-base">{content.date}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-10 sm:h-12"
                  />
                </div>

                <Button 
                  onClick={handleSearchTrips} 
                  className="w-full h-10 sm:h-12 text-base sm:text-lg"
                  disabled={!fromStop || !toStop || !selectedDate || loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {content.search}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Select Trip */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">{content.availableTrips}</h2>
              <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm sm:text-base">
                <MapPin className="h-4 w-4" />
                {fromStop} → {toStop}
                <Calendar className="h-4 w-4 ml-2" />
                {selectedDate}
              </p>
            </div>

            {trips.length === 0 ? (
              <Card className="border-none shadow-md bg-card">
                <CardContent className="p-6 sm:p-8">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm sm:text-base">
                      {content.noTrips}
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
                    if (trip.recurrence_type === "daily") return language === "en" ? "Daily" : "दैनिक";
                    if (trip.recurrence_type === "weekly") return language === "en" ? "Weekly" : "साप्ताहिक";
                    if (trip.recurrence_type === "custom" && trip.recurrence_days) {
                      const days = language === "en" ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] : ["रवि","सोम","मंगल","बुध","गुरु","शुक्र","शनि"];
                      return days.filter((_, i) => trip.recurrence_days.includes(i)).join("/");
                    }
                    return null;
                  };
                  
                  return (
                    <motion.button
                      key={trip.id}
                      onClick={() => handleSelectTrip(trip)}
                      disabled={isLoading}
                      className="w-full text-left group block"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className={`
                        border-none shadow-md hover:shadow-lg transition-all duration-300
                        bg-card ${isExpanded ? 'ring-2 ring-primary' : ''}
                        ${isLoading ? 'opacity-70 cursor-wait' : ''}
                      `}>
                        <CardContent className="p-4 sm:p-6">
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h3 className="font-semibold text-base sm:text-lg text-foreground">{route?.name || 'Route'}</h3>
                                  {getRecurrenceLabel() && (
                                    <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                                      {getRecurrenceLabel()}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    <span>{language === "en" ? "Departs" : "प्रस्थान"} {trip.departure_time}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    <span>{language === "en" ? "Arrives" : "आगमन"} {trip.arrival_time}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <Button 
                                size="sm"
                                className={`
                                  min-w-[100px] sm:min-w-[120px] transition-all duration-200
                                  ${isLoading ? 'cursor-wait' : ''}
                                `}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    {language === "en" ? "Loading..." : "लोड हो रहा..."}
                                  </>
                                ) : (
                                  content.selectTrip
                                )}
                              </Button>
                            </div>

                            {/* Expanded Loading State */}
                            {isExpanded && isLoading && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-3 pt-4 border-t animate-fade-in"
                              >
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-20 w-full" />
                              </motion.div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.button>
                  );
                })}
              </div>
            )}
            
            <div className="max-w-3xl mx-auto mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStep(1);
                  setExpandedTripId(null);
                  setLoadingTripId(null);
                }} 
                className="w-full h-10 sm:h-12 text-base sm:text-lg"
              >
                {language === "en" ? "Back to Search" : "खोज पर वापस"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Select Seat */}
        {step === 3 && selectedTrip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-none shadow-lg bg-card">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">{content.selectSeat}</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {availableSeats.length} {content.seatsAvailable}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {availableSeats.length === 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm sm:text-base">
                      {language === "en" ? "No seats available for this segment. Please try a different trip." : "इस सेगमेंट के लिए कोई सीट उपलब्ध नहीं है। कृपया अलग ट्रिप आजमाएं।"}
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
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-10 sm:h-12 text-base sm:text-lg">
                    {content.backToTrips}
                  </Button>
                  <Button 
                    onClick={handleContinueToPassengerInfo} 
                    disabled={selectedSeats.length === 0}
                    className="flex-1 h-10 sm:h-12 text-base sm:text-lg"
                  >
                    {content.continue}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Passenger Info */}
        {step === 4 && selectedTrip && selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MultiPassengerForm
              seatNumbers={selectedSeats}
              onSubmit={handlePassengerSubmit}
              onBack={() => setStep(3)}
              userProfile={userProfile}
            />
          </motion.div>
        )}

        {/* Step 5: Booking Summary */}
        {step === 5 && selectedTrip && selectedSeats.length > 0 && bookingGroupId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
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
          </motion.div>
        )}

        {/* Step 6: Payment Confirmation */}
        {step === 6 && bookingGroupId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-none shadow-lg bg-card">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">{content.confirmPayment}</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {content.totalFare}: ₹{fare} {language === "en" ? "for" : "के लिए"} {selectedSeats.length} {language === "en" ? `seat${selectedSeats.length > 1 ? 's' : ''}` : `सीट${selectedSeats.length > 1 ? 'ें' : ''}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm sm:text-base">
                    {(forceOnlinePayment || paymentMode === 'online') 
                      ? content.onlineRequired
                      : content.reserved}
                  </AlertDescription>
                </Alert>

                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm sm:text-base">
                  <p><strong>{language === "en" ? "Route" : "रूट"}:</strong> {fromStop} → {toStop}</p>
                  <p><strong>{language === "en" ? "Seats" : "सीटें"}:</strong> {selectedSeats.join(', ')}</p>
                  <p><strong>{language === "en" ? "Passengers" : "यात्री"}:</strong> {passengers.length}</p>
                  <p><strong>{language === "en" ? "Amount" : "राशि"}:</strong> ₹{fare}</p>
                </div>

                {/* Show payment options based on mode */}
                {(forceOnlinePayment || paymentMode === 'online') ? (
                  // Online payment required
                  <Button 
                    onClick={handlePaymentConfirmation} 
                    disabled={bookingLoading}
                    className="w-full h-10 sm:h-12 text-base sm:text-lg"
                  >
                    {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {content.payOnline} (Razorpay)
                  </Button>
                ) : paymentMode === 'hybrid' ? (
                  // Hybrid: Show both options
                  <div className="space-y-3">
                    <Button 
                      onClick={handlePaymentConfirmation} 
                      disabled={bookingLoading}
                      className="w-full h-10 sm:h-12 text-base sm:text-lg"
                      variant="default"
                    >
                      {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {content.payOnline}
                    </Button>
                    <Button 
                      onClick={handleOfflineBooking} 
                      disabled={bookingLoading}
                      className="w-full h-10 sm:h-12 text-base sm:text-lg"
                      variant="outline"
                    >
                      {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {content.payOnBus}
                    </Button>
                  </div>
                ) : (
                  // Offline only
                  <Button 
                    onClick={handleOfflineBooking} 
                    disabled={bookingLoading}
                    className="w-full h-10 sm:h-12 text-base sm:text-lg"
                  >
                    {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {language === "en" ? "Book Now (Pay on Bus)" : "अभी बुक करें (बस पर भुगतान)"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </>
  );
}