import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read parameters from request body (for supabase.functions.invoke)
    const { trip_id, from_index, to_index, trip_date } = await req.json();

    console.log('Available seats request:', { trip_id, from_index, to_index, trip_date });

    if (isNaN(from_index) || isNaN(to_index) || from_index >= to_index) {
      return new Response(
        JSON.stringify({ error: 'Invalid indices' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Load trip with route and bus info
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        routes:route_id (
          stops,
          prices_per_segment,
          base_price_per_segment
        ),
        buses:bus_id (
          seat_count
        )
      `)
      .eq('id', trip_id)
      .single();

    if (tripError || !trip) {
      console.error('Trip not found:', tripError);
      return new Response(
        JSON.stringify({ error: 'Trip not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const bus = Array.isArray(trip.buses) ? trip.buses[0] : trip.buses;
    const busCapacity = bus?.seat_count || 40;
    const ownerReservedSeats = trip.owner_reserved_seats || [];

    // Get all bookings for this trip AND date that overlap with requested segment
    // Include: confirmed, cancellation_requested, and non-expired pending_payment bookings
    // Exclude: expired and cancelled bookings
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('seat_number, from_index, to_index, status, created_at')
      .eq('trip_id', trip_id)
      .eq('booking_date', trip_date)
      .not('status', 'in', '(expired,cancelled)')
      .or(`status.in.(confirmed,cancellation_requested),and(status.eq.pending_payment,created_at.gte.${tenMinutesAgo})`);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return new Response(
        JSON.stringify({ error: 'Error checking bookings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Calculate available seats
    const availableSeats: number[] = [];

    for (let seat = 1; seat <= busCapacity; seat++) {
      // Check if owner reserved
      const isOwnerReserved = ownerReservedSeats.some((reserved: any) => {
        const reservedNum = typeof reserved === 'string' ? parseInt(reserved.replace(/[^0-9]/g, ''), 10) : reserved;
        return reservedNum === seat;
      });

      if (isOwnerReserved) continue;

      // Check for overlapping bookings
      const hasConflict = bookings?.some((booking: any) => {
        if (booking.seat_number !== seat) return false;
        // Check if segments overlap
        return booking.from_index < to_index && from_index < booking.to_index;
      });

      if (!hasConflict) {
        availableSeats.push(seat);
      }
    }

    // Calculate fare per seat using Method A, Logic 2
    // Fare = Sum of (Price per segment) for all segments traveled
    const route = Array.isArray(trip.routes) ? trip.routes[0] : trip.routes;
    const pricesPerSegment = route?.prices_per_segment || [];
    const basePrice = route?.base_price_per_segment || 50;
    
    let farePerSeat = 0;
    for (let i = from_index; i < to_index; i++) {
      // Use segment-specific price if available, otherwise use base price
      const segmentPrice = (pricesPerSegment && pricesPerSegment[i]) 
        ? pricesPerSegment[i] 
        : basePrice;
      farePerSeat += segmentPrice;
    }
    
    // Safety check: ensure fare is never 0, null, or invalid
    if (!farePerSeat || farePerSeat <= 0 || isNaN(farePerSeat)) {
      farePerSeat = basePrice * (to_index - from_index);
    }

    console.log(`Found ${availableSeats.length} available seats for trip ${trip_id}, fare: ${farePerSeat}`);

    return new Response(
      JSON.stringify({ 
        available_seats: availableSeats,
        total_seats: busCapacity,
        from_index,
        to_index,
        fare_per_seat: farePerSeat
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in available-seats:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
