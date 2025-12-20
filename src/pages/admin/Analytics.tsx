import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Bus, Users, TrendingUp, DollarSign, Download, Loader2, Clock, CheckCircle, XCircle, Activity } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format, subDays, startOfDay, endOfDay, getHours } from "date-fns";

type DateFilter = "today" | "yesterday" | "week" | "month";

interface AnalyticsData {
  tripStats: any;
  passengerStats: any;
  routeStats: any;
  revenueStats: any;
  cancellationStats: any;
  trackingStats: any;
  bookings: any[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Analytics() {
  const [filter, setFilter] = useState<DateFilter>("week");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const getDateRange = (filter: DateFilter) => {
    const now = new Date();
    switch (filter) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday":
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case "week":
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case "month":
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    const { start, end } = getDateRange(filter);

    try {
      const [tripStats, passengerStats, routeStats, revenueStats, cancellationStats, trackingStats, bookingsData] = await Promise.all([
        supabase.rpc('get_analytics_trip_stats', { p_start_date: start.toISOString(), p_end_date: end.toISOString() }),
        supabase.rpc('get_analytics_passenger_stats', { p_start_date: start.toISOString(), p_end_date: end.toISOString() }),
        supabase.rpc('get_analytics_route_stats', { p_start_date: start.toISOString(), p_end_date: end.toISOString() }),
        supabase.rpc('get_analytics_revenue_stats', { p_start_date: start.toISOString(), p_end_date: end.toISOString() }),
        supabase.rpc('get_analytics_cancellation_stats', { p_start_date: start.toISOString(), p_end_date: end.toISOString() }),
        supabase.rpc('get_analytics_tracking_stats', { p_start_date: start.toISOString(), p_end_date: end.toISOString() }),
        supabase.from('bookings').select('created_at, total_amount, status').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      ]);

      setData({
        tripStats: tripStats.data,
        passengerStats: passengerStats.data,
        routeStats: routeStats.data,
        revenueStats: revenueStats.data,
        cancellationStats: cancellationStats.data,
        trackingStats: trackingStats.data,
        bookings: bookingsData.data || [],
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filter]);

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const paymentDistribution = data?.revenueStats?.payment_distribution ? [
    { name: "Online", value: data.revenueStats.payment_distribution.online || 0 },
    { name: "Offline", value: data.revenueStats.payment_distribution.offline || 0 },
  ] : [];

  const peakHoursData = useMemo(() => {
    if (!data?.bookings) return [];
    const hourCounts: Record<number, number> = {};
    data.bookings.forEach((b: any) => {
      const hour = getHours(new Date(b.created_at));
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      bookings: hourCounts[i] || 0,
    }));
  }, [data?.bookings]);

  return (
    <AdminLayout>
<div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Comprehensive insights into your operations</p>
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as DateFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Trips</CardTitle>
                  <Bus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold">{data?.tripStats?.total_trips || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate">Active Now</CardTitle>
                  <Activity className="h-4 w-4 text-green-500 flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{data?.tripStats?.active_trips || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate">Passengers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold">{data?.passengerStats?.total_passengers || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate">Load Factor</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold">{data?.passengerStats?.load_factor || 0}%</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate">Online</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{data?.revenueStats?.online_bookings || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate">Offline</CardTitle>
                  <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-amber-600">{data?.revenueStats?.offline_bookings || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate">Cancellations</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">{data?.cancellationStats?.total_cancellations || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl sm:text-2xl font-bold truncate">₹{(data?.revenueStats?.total_revenue || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <Card className="overflow-hidden">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Bookings Over Time</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                    <LineChart data={data?.passengerStats?.bookings_by_date || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "MMM d")} className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 10 }} width={30} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Peak Booking Hours</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                    <AreaChart data={peakHoursData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hour" className="text-xs" interval={5} tick={{ fontSize: 10 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 10 }} width={30} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                      <Area type="monotone" dataKey="bookings" stroke="#10B981" fill="#10B98130" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              <Card className="overflow-hidden">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Route Popularity</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                    <BarChart data={data?.routeStats?.route_popularity || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="route" width={60} className="text-xs" tick={{ fontSize: 8 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                      <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Payment Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                    <PieChart>
                      <Pie data={paymentDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {paymentDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="overflow-hidden md:col-span-2 xl:col-span-1">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Cancellations</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                    <BarChart data={data?.cancellationStats?.by_reason || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="reason" className="text-xs" tick={{ fontSize: 8 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 10 }} width={30} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                      <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
