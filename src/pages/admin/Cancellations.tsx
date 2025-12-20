import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle } from "lucide-react";
import { cancellationActionSchema } from "@/lib/validations/admin";
import { z } from "zod";

export default function Cancellations() {
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [selectedCancellation, setSelectedCancellation] = useState<any>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCancellations();
  }, []);

  const fetchCancellations = async () => {
    const { data, error } = await supabase
      .from("cancellations")
      .select(
        `
        *,
        bookings(
          passenger_name,
          passenger_email,
          seat_numbers,
          trips(from_city, to_city, trip_date)
        )
      `
      )
      .order("requested_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch cancellations",
        variant: "destructive",
      });
    } else {
      setCancellations(data || []);
    }
  };

  const handleAction = async () => {
    if (!selectedCancellation || !actionType) return;

    try {
      // Validate action
      const validatedData = cancellationActionSchema.parse({ action: actionType });
      
      const isApproved = validatedData.action === "approve";
      const newStatus = isApproved ? "approved" : "rejected";
      const bookingStatus = isApproved ? "cancelled" : "confirmed";

      // Update cancellation status
      const { error: cancelError } = await supabase
        .from("cancellations")
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
        })
        .eq("id", selectedCancellation.id);

      if (cancelError) throw cancelError;

      // Update booking status
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: bookingStatus })
        .eq("id", selectedCancellation.booking_id);

      if (bookingError) throw bookingError;

      // If approved, update trip available seats
      if (isApproved) {
        const booking = selectedCancellation.bookings;
        const { data: trip } = await supabase
          .from("trips")
          .select("available_seats")
          .eq("id", booking.trip_id)
          .single();

        if (trip) {
          await supabase
            .from("trips")
            .update({
              available_seats: trip.available_seats + booking.seat_numbers.length,
            })
            .eq("id", booking.trip_id);
        }
      }

      toast({
        title: "Success",
        description: `Cancellation ${newStatus} successfully`,
      });

      fetchCancellations();
      setSelectedCancellation(null);
      setActionType(null);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to process cancellation",
          variant: "destructive",
        });
      }
      setSelectedCancellation(null);
      setActionType(null);
    }
  };

  const openActionDialog = (cancellation: any, type: "approve" | "reject") => {
    setSelectedCancellation(cancellation);
    setActionType(type);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Cancellation Requests</h1>

        <Card>
          <CardHeader>
            <CardTitle>Pending Cancellations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Refund Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancellations.map((cancellation) => (
                  <TableRow key={cancellation.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{cancellation.bookings?.passenger_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {cancellation.bookings?.passenger_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cancellation.bookings?.trips?.from_city} →{" "}
                      {cancellation.bookings?.trips?.to_city}
                    </TableCell>
                    <TableCell>
                      {cancellation.bookings?.trips?.trip_date &&
                        format(
                          new Date(cancellation.bookings.trips.trip_date),
                          "MMM dd, yyyy"
                        )}
                    </TableCell>
                    <TableCell>{cancellation.bookings?.seat_numbers?.join(", ")}</TableCell>
                    <TableCell>₹{cancellation.refund_amount}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {cancellation.reason || "No reason provided"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          cancellation.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : cancellation.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cancellation.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {cancellation.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionDialog(cancellation, "approve")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionDialog(cancellation, "reject")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AlertDialog
          open={!!selectedCancellation && !!actionType}
          onOpenChange={() => {
            setSelectedCancellation(null);
            setActionType(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionType === "approve" ? "Approve" : "Reject"} Cancellation?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionType === "approve"
                  ? "This will cancel the booking and refund the amount to the passenger. The seats will be made available again."
                  : "This will reject the cancellation request and keep the booking active."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAction}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
