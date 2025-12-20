import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Ticket, Download, Eye, Users, Armchair, MapPin } from "lucide-react";
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
  const navigate = useNavigate();
  const { toast } = useToast();

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
        title: "Authentication required",
        description: "Please login to view bookings",
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
        title: "Error loading bookings",
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
        title: "Cancellation requested",
        description: `Cancellation request submitted for ${bookings.length} seat${bookings.length > 1 ? 's' : ''}`,
      });

      if (user) {
        fetchBookings(user.id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Request failed",
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
        return <Badge className="bg-primary">Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "cancellation_requested":
        return <Badge variant="secondary">Cancellation Pending</Badge>;
      case "pending_payment":
        return <Badge variant="outline">Pending Payment</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground mb-8">View and manage your bus ticket bookings</p>

          {bookingGroups.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No bookings yet</p>
                <p className="text-muted-foreground mb-6">Start your journey by booking your first ticket</p>
                <Button onClick={() => navigate("/book")}>Book Tickets</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {bookingGroups.map((group) => {
                const trip = Array.isArray(group.trip) ? group.trip[0] : group.trip;
                const route = trip?.routes ? (Array.isArray(trip.routes) ? trip.routes[0] : trip.routes) : null;
                const allSeats = group.bookings.map(b => b.seat_number).sort((a, b) => a - b);
                const hasTicket = group.bookings.some(b => b.ticket_url);
                const firstTicketUrl = group.bookings.find(b => b.ticket_url)?.ticket_url;

                return (
                  <Card key={group.booking_group_id} className="border-border">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle>{route?.name || trip?.route || 'Bus Route'}</CardTitle>
                            {group.bookings.length > 1 && (
                              <Badge variant="outline" className="gap-1">
                                <Users className="h-3 w-3" />
                                {group.bookings.length} passengers
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {trip?.from_city} → {trip?.to_city}
                          </CardDescription>
                        </div>
                        {getStatusBadge(group.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Travel Date</p>
                          <p className="font-medium">{format(new Date(trip?.trip_date), "PPP")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Departure Time</p>
                          <p className="font-medium">{trip?.departure_time}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Armchair className="h-4 w-4" />
                            Selected Seats
                          </p>
                          <p className="font-medium">{allSeats.join(", ")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="font-medium text-lg text-primary">
                            ₹{group.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Passenger Details */}
                      <Separator className="my-4" />
                      <div className="space-y-3">
                        <p className="text-sm font-semibold">Passenger Details:</p>
                        {group.bookings.map((booking, idx) => (
                          <div key={booking.id} className="bg-muted/50 p-3 rounded-lg text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{booking.passenger_name}</span>
                              <Badge variant="outline" className="text-xs">Seat {booking.seat_number}</Badge>
                            </div>
                            <div className="text-muted-foreground space-y-1">
                              <p>{booking.passenger_email}</p>
                              <p>{booking.passenger_phone}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 flex-wrap mt-4">
                        {group.status === "confirmed" && hasTicket && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewTicket(firstTicketUrl)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Ticket
                            </Button>

                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => window.open(firstTicketUrl, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Tickets
                            </Button>
                          </>
                        )}

                        {group.status === "confirmed" && !hasTicket && (
                          <Badge variant="secondary">Tickets generating...</Badge>
                        )}

                        {group.status === "confirmed" && trackingEnabled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/track/${group.bookings[0].id}`)}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Track My Bus
                          </Button>
                        )}

                        {group.status === "confirmed" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Request Cancellation
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Request Cancellation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this booking for {group.bookings.length} passenger{group.bookings.length > 1 ? 's' : ''}? 
                                  You will receive 80% refund of the total amount.
                                  <br /><br />
                                  Refund amount: ₹{(group.totalAmount * 0.8).toFixed(2)}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>No, keep booking</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelRequest(group.booking_group_id, group.bookings)}
                                >
                                  Yes, cancel booking
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
