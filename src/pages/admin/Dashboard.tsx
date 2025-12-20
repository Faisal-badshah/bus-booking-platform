import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, DollarSign, XCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    activeTrips: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
  });
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Fetch today's bookings
    const { count: todayCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    // Fetch active trips
    const { count: activeCount } = await supabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .gte("trip_date", today);

    // Fetch cancelled bookings
    const { count: cancelledCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled");

    // Fetch total revenue (confirmed bookings)
    const { data: revenueData } = await supabase
      .from("bookings")
      .select("total_amount")
      .eq("status", "confirmed");

    const totalRevenue = revenueData?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

    // Fetch upcoming trips
    const { data: trips } = await supabase
      .from("trips")
      .select("*, buses(name)")
      .eq("status", "active")
      .gte("trip_date", today)
      .order("trip_date", { ascending: true })
      .order("departure_time", { ascending: true })
      .limit(5);

    // Fetch recent bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, trips(from_city, to_city, trip_date)")
      .order("created_at", { ascending: false })
      .limit(5);

    setStats({
      todayBookings: todayCount || 0,
      activeTrips: activeCount || 0,
      cancelledBookings: cancelledCount || 0,
      totalRevenue,
    });

    setUpcomingTrips(trips || []);
    setRecentBookings(bookings || []);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTrips}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cancelled Bookings</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cancelledBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Seats</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingTrips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">
                        {trip.from_city} → {trip.to_city}
                      </TableCell>
                      <TableCell>{format(new Date(trip.trip_date), "MMM dd")}</TableCell>
                      <TableCell>{trip.departure_time}</TableCell>
                      <TableCell>{trip.available_seats}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.passenger_name}</TableCell>
                      <TableCell>
                        {booking.trips?.from_city} → {booking.trips?.to_city}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell>₹{booking.total_amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
