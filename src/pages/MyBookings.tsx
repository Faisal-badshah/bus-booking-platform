import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Ticket, Download, Eye, Users, Armchair, MapPin, Globe, Shield } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

interface BookingGroup {
  booking_group_id: string;
  bookings: any[];
  trip: any;
  totalAmount: number;
  status: string;
}

export default function MyBookings() {
  const [user, setUser] = useState<any>(null);
  const [bookingGroups, setBookingGroups] = useState<BookingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "hi" : "en"));
  };

  const content = {
    en: {
      title: "My Bookings - Ride Bus",
      description: "View and manage your premium bus bookings with Ride Bus.",
      myBookings: "My Bookings",
      noBookings: "No bookings yet",
      startJourney: "Start your journey by booking your first ticket",
      bookTickets: "Book Tickets",
      busRoute: "Bus Route",
      passengers: "passengers",
      travelDate: "Travel Date",
      departureTime: "Departure Time",
      selectedSeats: "Selected Seats",
      totalAmount: "Total Amount",
      passengerDetails: "Passenger Details",
      seat: "Seat",
      viewTicket: "View Ticket",
      downloadTickets: "Download Tickets",
      ticketsGenerating: "Tickets generating...",
      trackBus: "Track My Bus",
      requestCancellation: "Request Cancellation",
      confirmCancel: "Request Cancellation",
      sureCancel: "Are you sure you want to cancel this booking for",
      passengerS: "passenger",
      refund: "You will receive 80% refund of the total amount.",
      refundAmount: "Refund amount",
      noKeep: "No, keep booking",
      yesCancel: "Yes, cancel booking",
      cancellationRequested: "Cancellation requested",
      requestSubmitted: "Cancellation request submitted for",
      seatS: "seat",
      requestFailed: "Request failed",
      trustMessage: "Secure Bookings · Easy Management · Full Support",
    },
    hi: {
      title: "मेरी बुकिंग्स - राइड बस",
      description: "राइड बस के साथ अपनी प्रीमियम बस बुकिंग्स देखें और प्रबंधित करें।",
      myBookings: "मेरी बुकिंग्स",
      noBookings: "अभी कोई बुकिंग नहीं",
      startJourney: "अपनी पहली टिकट बुक करके अपनी यात्रा शुरू करें",
      bookTickets: "टिकट बुक करें",
      busRoute: "बस रूट",
      passengers: "यात्री",
      travelDate: "यात्रा तारीख",
      departureTime: "प्रस्थान समय",
      selectedSeats: "चुनी गई सीटें",
      totalAmount: "कुल राशि",
      passengerDetails: "यात्री विवरण",
      seat: "सीट",
      viewTicket: "टिकट देखें",
      downloadTickets: "टिकट डाउनलोड करें",
      ticketsGenerating: "टिकट उत्पन्न हो रहे हैं...",
      trackBus: "मेरी बस ट्रैक करें",
      requestCancellation: "रद्दीकरण अनुरोध",
      confirmCancel: "रद्दीकरण अनुरोध",
      sureCancel: "क्या आप इस बुकिंग को रद्द करना चाहते हैं",
      passengerS: "यात्री के लिए",
      refund: "आपको कुल राशि का 80% रिफंड मिलेगा।",
      refundAmount: "रिफंड राशि",
      noKeep: "नहीं, बुकिंग रखें",
      yesCancel: "हां, बुकिंग रद्द करें",
      cancellationRequested: "रद्दीकरण अनुरोधित",
      requestSubmitted: "रद्दीकरण अनुरोध सबमिट किया गया",
      seatS: "सीट के लिए",
      requestFailed: "अनुरोध विफल",
      trustMessage: "सुरक्षित बुकिंग्स · आसान प्रबंधन · पूरा समर्थन",
    }
  }[language];

  // Check tracking subscription
  useEffect(() => {
    const checkTracking = async () => {
      const { data } = await supabase
        .from("tracking_subscription")
        .select("*")
        .limit(1)
        .single();

      if (data) {
        const now = new Date();
        const trialEnds = new Date(data.trial_ends_at);
        const isTrialExpired = now > trialEnds;
        setTrackingEnabled(data.tracking_enabled || (!isTrialExpired && data.is_trial_active));
      }
    };
    checkTracking();
  }, []);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        variant: "destructive",
        title: language === "en" ? "Authentication required" : "प्रमाणीकरण आवश्यक",
        description: language === "en" ? "Please login to view bookings" : "बुकिंग्स देखने के लिए लॉगिन करें",
      });
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchBookings(session.user.id);
  };

  const fetchBookings = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        trips:trip_id (
          *,
          buses:bus_id (*),
          routes:route_id (*)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: language === "en" ? "Error loading bookings" : "बुकिंग्स लोड करने में त्रुटि",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    // Group bookings by booking_group_id
    const grouped = (data || []).reduce((acc: { [key: string]: BookingGroup }, booking: any) => {
      const groupId = booking.booking_group_id || booking.id;
      
      if (!acc[groupId]) {
        acc[groupId] = {
          booking_group_id: groupId,
          bookings: [],
          trip: booking.trips,
          totalAmount: 0,
          status: booking.status
        };
      }
      
      acc[groupId].bookings.push(booking);
      acc[groupId].totalAmount += parseFloat(booking.total_amount);
      
      // Use most severe status (cancelled > cancellation_requested > confirmed > pending)
      if (booking.status === 'cancelled' || acc[groupId].status !== 'cancelled') {
        acc[groupId].status = booking.status;
      }
      
      return acc;
    }, {});

    setBookingGroups(Object.values(grouped));
    setLoading(false);
  };

  const handleCancelRequest = async (bookingGroupId: string, bookings: any[]) => {
    try {
      const firstBooking = bookings[0];
      const refundAmount = bookings.reduce((sum, b) => sum + parseFloat(b.total_amount), 0) * 0.8;

      // Update all bookings in the group
      for (const booking of bookings) {
        await supabase.from("bookings").update({
          status: "cancellation_requested",
        }).eq("id", booking.id);

        await supabase.from("cancellations").insert({
          booking_id: booking.id,
          refund_amount: parseFloat(booking.total_amount) * 0.8,
          status: "pending",
        });
      }

      toast({
        title: content.cancellationRequested,
        description: `${content.requestSubmitted} ${bookings.length} ${bookings.length > 1 ? content.passengers : content.passengerS}`,
      });

      if (user) {
        fetchBookings(user.id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: content.requestFailed,
        description: error.message,
      });
    }
  };

  const handlePreviewTicket = (ticketUrl: string) => {
    // Open PDF in new tab to avoid Chrome blocking iframes
    window.open(ticketUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-600 text-white">{language === "en" ? "Confirmed" : "पुष्टि हुई"}</Badge>;
      case "cancelled":
        return <Badge variant="destructive">{language === "en" ? "Cancelled" : "रद्द"}</Badge>;
      case "cancellation_requested":
        return <Badge variant="secondary">{language === "en" ? "Cancellation Pending" : "रद्दीकरण लंबित"}</Badge>;
      case "pending_payment":
        return <Badge variant="outline">{language === "en" ? "Pending Payment" : "भुगतान लंबित"}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-background"
      >
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
          <p className="text-muted-foreground text-lg">{language === "en" ? "Loading your bookings..." : "आपकी बुकिंग्स लोड हो रही हैं..."}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{content.title}</title>
        <meta name="description" content={content.description} />
      </Helmet>

      <div className="min-h-screen py-12 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{content.myBookings}</h1>
              <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Toggle Language">
                <Globe className="h-5 w-5" />
              </Button>
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground flex items-center gap-2 mb-8 justify-center"
            >
              <Shield className="h-4 w-4 text-green-600" />
              {content.trustMessage}
            </motion.p>

            {bookingGroups.length === 0 ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Card className="border-none shadow-xl bg-card">
                  <CardContent className="pt-12 text-center py-16">
                    <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                    <h2 className="text-2xl font-semibold mb-3">{content.noBookings}</h2>
                    <p className="text-muted-foreground mb-8">{content.startJourney}</p>
                    <Button onClick={() => navigate("/book")} size="lg" className="bg-green-600 hover:bg-green-700">
                      {content.bookTickets}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-8">
                {bookingGroups.map((group) => {
                  const trip = Array.isArray(group.trip) ? group.trip[0] : group.trip;
                  const route = trip?.routes ? (Array.isArray(trip.routes) ? trip.routes[0] : trip.routes) : null;
                  const allSeats = group.bookings.map(b => b.seat_number).sort((a, b) => a - b);
                  const hasTicket = group.bookings.some(b => b.ticket_url);
                  const firstTicketUrl = group.bookings.find(b => b.ticket_url)?.ticket_url;

                  return (
                    <motion.div
                      key={group.booking_group_id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                    >
                      <Card className="border-none shadow-xl bg-card overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/50">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-xl">{route?.name || trip?.route || content.busRoute}</CardTitle>
                                {group.bookings.length > 1 && (
                                  <Badge variant="outline" className="gap-1 text-sm">
                                    <Users className="h-3 w-3" />
                                    {group.bookings.length} {content.passengers}
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="text-base">
                                {trip?.from_city} → {trip?.to_city}
                              </CardDescription>
                            </div>
                            {getStatusBadge(group.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm text-muted-foreground">{content.travelDate}</p>
                              <p className="text-lg font-medium">{format(new Date(trip?.trip_date), "PPP")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">{content.departureTime}</p>
                              <p className="text-lg font-medium">{trip?.departure_time}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Armchair className="h-4 w-4" />
                                {content.selectedSeats}
                              </p>
                              <p className="text-lg font-medium">{allSeats.join(", ")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">{content.totalAmount}</p>
                              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                                ₹{group.totalAmount.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">{content.passengerDetails}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {group.bookings.map((booking, idx) => (
                                <div key={booking.id} className="bg-muted/50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm">
                                  <div className="flex justify-between mb-3">
                                    <span className="font-medium text-base">{booking.passenger_name}</span>
                                    <Badge variant="outline" className="text-sm">
                                      {content.seat} {booking.seat_number}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <p>{booking.passenger_email}</p>
                                    <p>{booking.passenger_phone}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-6">
                            {group.status === "confirmed" && hasTicket && (
                              <>
                                <Button
                                  variant="outline"
                                  size="lg"
                                  onClick={() => handlePreviewTicket(firstTicketUrl)}
                                  className="flex-1 min-w-[150px]"
                                >
                                  <Eye className="h-5 w-5 mr-2" />
                                  {content.viewTicket}
                                </Button>

                                <Button
                                  variant="default"
                                  size="lg"
                                  onClick={() => window.open(firstTicketUrl, '_blank')}
                                  className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700"
                                >
                                  <Download className="h-5 w-5 mr-2" />
                                  {content.downloadTickets}
                                </Button>
                              </>
                            )}

                            {group.status === "confirmed" && !hasTicket && (
                              <Badge variant="secondary" className="text-sm px-4 py-2">{content.ticketsGenerating}</Badge>
                            )}

                            {group.status === "confirmed" && trackingEnabled && (
                              <Button
                                variant="outline"
                                size="lg"
                                onClick={() => navigate(`/track/${group.bookings[0].id}`)}
                                className="flex-1 min-w-[150px]"
                              >
                                <MapPin className="h-5 w-5 mr-2" />
                                {content.trackBus}
                              </Button>
                            )}

                            {group.status === "confirmed" && (
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="lg" className="flex-1 min-w-[150px]">
      {content.requestCancellation}
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent className="rounded-xl">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-xl">{content.confirmCancel}</AlertDialogTitle>
      <AlertDialogDescription className="text-base">
        {content.sureCancel} {group.bookings.length} {group.bookings.length > 1 ? content.passengers : content.passengerS}? 
        <br />
        {content.refund}
        <br />
        {content.refundAmount}: ₹{(group.totalAmount * 0.8).toFixed(2)}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter className="flex-col sm:flex-row gap-3">
      <AlertDialogCancel className="w-full sm:w-auto">{content.noKeep}</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => handleCancelRequest(group.booking_group_id, group.bookings)}
        className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
      >
        {content.yesCancel}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}