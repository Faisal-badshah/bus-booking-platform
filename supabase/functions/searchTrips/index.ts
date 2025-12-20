import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { from_stop, to_stop, search_date } = await req.json();

    console.log('Trip search request:', { from_stop, to_stop, search_date });

    if (!from_stop || !to_stop || !search_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const searchDateObj = new Date(search_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = searchDateObj.getDay(); // 0=Sun, 6=Sat

    // Load all active trips with their routes
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select(`
        *,
        routes:route_id (
          id,
          name,
          stops,
          prices_per_segment,
          base_price_per_segment
        ),
        buses:bus_id (
          name,
          seat_count
        )
      `)
      .eq('status', 'active');

    if (tripsError) {
      console.error('Error fetching trips:', tripsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch trips' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const validTrips: any[] = [];

    for (const trip of trips || []) {
      const route = Array.isArray(trip.routes) ? trip.routes[0] : trip.routes;
      if (!route || !route.stops) continue;

      // Check if route contains both stops in correct order
      const fromIdx = route.stops.indexOf(from_stop);
      const toIdx = route.stops.indexOf(to_stop);
      if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) continue;

      // Check if trip is valid for the search date
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      const maxBookingDate = new Date(today);
      maxBookingDate.setDate(maxBookingDate.getDate() + trip.max_booking_days_ahead);

      // Must be within date range and booking window
      if (searchDateObj < startDate || searchDateObj > endDate || searchDateObj > maxBookingDate) {
        continue;
      }

      // Check recurrence type
      let isValidForDate = false;

      if (trip.recurrence_type === 'fixed') {
        // Fixed trips only run on their exact start_date (which equals end_date)
        isValidForDate = search_date === trip.start_date;
      } else if (trip.recurrence_type === 'daily') {
        // Daily trips run every day between start_date and end_date
        isValidForDate = true;
      } else if (trip.recurrence_type === 'weekly' || trip.recurrence_type === 'custom') {
        // Weekly/custom trips run on specified days of week
        isValidForDate = trip.recurrence_days && trip.recurrence_days.includes(dayOfWeek);
      }

      if (!isValidForDate) continue;

      // Add trip instance for this specific date
      validTrips.push({
        id: trip.id,
        trip_date: search_date, // The actual date for this instance
        departure_time: trip.departure_time,
        arrival_time: trip.arrival_time,
        route_id: trip.route_id,
        bus_id: trip.bus_id,
        status: trip.status,
        recurrence_type: trip.recurrence_type,
        recurrence_days: trip.recurrence_days,
        routes: route,
        buses: Array.isArray(trip.buses) ? trip.buses[0] : trip.buses
      });
    }

    console.log(`Found ${validTrips.length} valid trips for ${search_date}`);

    return new Response(
      JSON.stringify({ trips: validTrips }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in searchTrips:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
