import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bookingStatusSchema } from "@/lib/validations/admin";
import { z } from "zod";

export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter, searchQuery]);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, trips(from_city, to_city, trip_date, departure_time, routes(stops)), profiles(full_name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } else {
      setBookings(data || []);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (b) =>
          b.passenger_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.passenger_email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      // Validate status
      const validatedData = bookingStatusSchema.parse({ status: newStatus });

      const { error } = await supabase
        .from("bookings")
        .update({ status: validatedData.status })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
      fetchBookings();
      setSelectedBooking(null);
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
          description: error.message || "Failed to update booking status",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Booking Management</h1>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">All Bookings ({filteredBookings.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Passenger</TableHead>
                    <TableHead className="min-w-[150px] hidden sm:table-cell">Contact</TableHead>
                    <TableHead className="min-w-[120px]">Route</TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell">Date</TableHead>
                    <TableHead className="min-w-[80px] hidden lg:table-cell">Seats</TableHead>
                    <TableHead className="min-w-[80px]">Amount</TableHead>
                    <TableHead className="min-w-[90px]">Status</TableHead>
                    <TableHead className="min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    // Resolve the passenger's chosen values: place from the booking's
                    // segment indices (V2), date from booking_date (V1), not the
                    // trip's legacy/empty fields.
                    const stops = booking.trips?.routes?.stops || [];
                    const fromStop = stops[booking.from_index] ?? "Unknown stop";
                    const toStop = stops[booking.to_index] ?? "Unknown stop";
                    const travelDate = booking.booking_date || booking.trips?.trip_date;
                    return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        <span className="truncate block max-w-[120px]">{booking.passenger_name}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">
                          <div className="truncate max-w-[150px]">{booking.passenger_email}</div>
                          <div className="text-muted-foreground">{booking.passenger_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="truncate block max-w-[120px]">
                          {fromStop} → {toStop}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {travelDate &&
                          format(new Date(travelDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{booking.seat_numbers.join(", ")}</TableCell>
                      <TableCell>₹{booking.total_amount}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                          className="text-xs"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Passenger Name</p>
                    <p className="font-medium truncate">{selectedBooking.passenger_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Booking ID</p>
                    <p className="font-mono text-xs truncate">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium truncate">{selectedBooking.passenger_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedBooking.passenger_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seats</p>
                    <p className="font-medium">{selectedBooking.seat_numbers.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">₹{selectedBooking.total_amount}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateBookingStatus(selectedBooking.id, "confirmed")}
                      disabled={selectedBooking.status === "confirmed"}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}
                      disabled={selectedBooking.status === "cancelled"}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateBookingStatus(selectedBooking.id, "pending")}
                      disabled={selectedBooking.status === "pending"}
                    >
                      Pending
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
