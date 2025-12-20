import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Send, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface FailedTicket {
  booking_id: string;
  event_type: string;
  created_at: string;
  metadata: any;
  booking?: {
    id: string;
    passenger_name: string;
    passenger_email: string;
    passenger_phone: string;
    status: string;
    trips: {
      trip_date: string;
      routes: {
        name: string;
      };
    };
  };
}

export default function TicketRetry() {
  const [failedTickets, setFailedTickets] = useState<FailedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFailedTickets = async () => {
    setLoading(true);
    try {
      // Get all failed ticket generation and email events
      const { data: logs, error } = await supabase
        .from('booking_logs')
        .select(`
          *,
          bookings:booking_id (
            id,
            passenger_name,
            passenger_email,
            passenger_phone,
            status,
            trips:trip_id (
              trip_date,
              routes:route_id (
                name
              )
            )
          )
        `)
        .in('event_type', [
          'ticket_generation_failed',
          'email_send_failed',
          'sms_fallback_failed'
        ])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter to only show bookings that are still confirmed (not cancelled)
      const activeFailures = logs?.filter(
        (log: any) => log.bookings?.status === 'confirmed'
      ) || [];

      setFailedTickets(activeFailures);
    } catch (error) {
      console.error('Error fetching failed tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load failed tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedTickets();
  }, []);

  const handleRetryTicket = async (bookingId: string) => {
    setRetrying(bookingId);
    try {
      const { data, error } = await supabase.functions.invoke('issueTicket', {
        body: { booking_id: bookingId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket generation retried successfully",
      });

      // Refresh the list
      await fetchFailedTickets();
    } catch (error) {
      console.error('Error retrying ticket:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to retry ticket generation",
        variant: "destructive",
      });
    } finally {
      setRetrying(null);
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'ticket_generation_failed':
        return <Badge variant="destructive">Ticket Failed</Badge>;
      case 'email_send_failed':
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Email Failed</Badge>;
      case 'sms_fallback_failed':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">SMS Failed</Badge>;
      default:
        return <Badge variant="secondary">{eventType}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ticket Generation Retry</h1>
            <p className="text-muted-foreground mt-2">
              Manually retry failed ticket generation and email delivery
            </p>
          </div>
          <Button onClick={fetchFailedTickets} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading failed tickets...</p>
          </div>
        ) : failedTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No failed tickets found</p>
              <p className="text-muted-foreground">All tickets have been generated successfully!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {failedTickets.map((ticket) => {
              const booking = Array.isArray(ticket.booking) ? ticket.booking[0] : ticket.booking;
              const trip = booking?.trips ? (Array.isArray(booking.trips) ? booking.trips[0] : booking.trips) : null;
              const route = trip?.routes ? (Array.isArray(trip.routes) ? trip.routes[0] : trip.routes) : null;

              return (
                <Card key={`${ticket.booking_id}-${ticket.created_at}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {booking?.passenger_name || 'Unknown Passenger'}
                        </CardTitle>
                        <CardDescription>
                          Booking ID: {ticket.booking_id?.substring(0, 18)}...
                        </CardDescription>
                      </div>
                      {getEventBadge(ticket.event_type)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{booking?.passenger_email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{booking?.passenger_phone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Route</p>
                        <p className="font-medium">{route?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Trip Date</p>
                        <p className="font-medium">
                          {trip?.trip_date ? format(new Date(trip.trip_date), 'PPP') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed At</p>
                        <p className="font-medium">
                          {format(new Date(ticket.created_at), 'PPp')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant="outline">{booking?.status}</Badge>
                      </div>
                    </div>

                    {ticket.metadata?.error && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                        <p className="text-sm font-medium text-destructive mb-1">Error Details:</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.metadata.error}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleRetryTicket(ticket.booking_id)}
                        disabled={retrying === ticket.booking_id}
                      >
                        {retrying === ticket.booking_id ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Retry Ticket Generation
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
