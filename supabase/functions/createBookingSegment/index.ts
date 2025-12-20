import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to log events
async function logEvent(supabase: any, data: any) {
  await supabase.from('booking_logs').insert(data);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      user_id,
      trip_id,
      seat_numbers, // Now accepts array of seat numbers
      from_stop,
      to_stop,
      passengers, // Array of passenger info matching seat_numbers
      trip_date // Date of the trip for this specific booking
    } = await req.json();

    console.log('Multi-seat booking request:', { user_id, trip_id, seat_numbers, from_stop, to_stop, trip_date });

    // Validate input
    if (!Array.isArray(seat_numbers) || seat_numbers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, reason: 'invalid_input', message: 'seat_numbers must be a non-empty array' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!Array.isArray(passengers) || passengers.length !== seat_numbers.length) {
      return new Response(
        JSON.stringify({ success: false, reason: 'invalid_input', message: 'passengers array must match seat_numbers length' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate booking group ID
    const booking_group_id = crypto.randomUUID();

    // Sanitize seat numbers
    const sanitizedSeats = seat_numbers.map(s => {
      const seatStr = String(s).replace(/[^0-9]/g, '');
      const seatNum = parseInt(seatStr, 10);
      if (isNaN(seatNum) || seatNum < 1) {
        throw new Error(`Invalid seat number: ${s}`);
      }
      return seatNum;
    });

    // Load trip, route, and stops
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        routes:route_id (
          id,
          name,
          stops,
          base_price_per_segment,
          prices_per_segment
        ),
        buses:bus_id (
          seat_count
        )
      `)
      .eq('id', trip_id)
      .single();

    if (tripError || !trip) {
      console.error('Trip not found:', tripError);
      await logEvent(supabase, {
        booking_group_id,
        event_type: 'booking_failed',
        metadata: { reason: 'trip_not_found', trip_id }
      });
      return new Response(
        JSON.stringify({ success: false, reason: 'trip_not_found', message: 'Trip not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (!trip.routes) {
      return new Response(
        JSON.stringify({ success: false, reason: 'no_route', message: 'Trip has no route configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const route = Array.isArray(trip.routes) ? trip.routes[0] : trip.routes;
    const stops: string[] = route.stops || [];

    // Convert stops to indices
    const from_index = stops.indexOf(from_stop);
    const to_index = stops.indexOf(to_stop);

    if (from_index === -1 || to_index === -1) {
      return new Response(
        JSON.stringify({ success: false, reason: 'invalid_stops', message: 'Stops not found in route' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (from_index >= to_index) {
      return new Response(
        JSON.stringify({ success: false, reason: 'invalid_stops', message: 'From stop must be before to stop' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const bus = Array.isArray(trip.buses) ? trip.buses[0] : trip.buses;
    const busCapacity = bus?.seat_count || 40;

    // Validate all seats are within capacity
    for (const seatNum of sanitizedSeats) {
      if (seatNum > busCapacity) {
        return new Response(
          JSON.stringify({ success: false, reason: 'invalid_seat', message: `Seat ${seatNum} exceeds bus capacity (${busCapacity})` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Validate owner reserved seats
    const ownerReservedSeats = trip.owner_reserved_seats || [];
    for (const seatNum of sanitizedSeats) {
      const isOwnerReserved = ownerReservedSeats.some((reserved: any) => {
        const reservedNum = typeof reserved === 'string' ? parseInt(reserved.replace(/[^0-9]/g, ''), 10) : reserved;
        return reservedNum === seatNum;
      });

      if (isOwnerReserved) {
        return new Response(
          JSON.stringify({ success: false, reason: 'owner_reserved', message: `Seat ${seatNum} is reserved by owner` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Calculate fare for one seat-segment using Method A, Logic 2
    // Fare = Sum of (Price per segment) for all segments traveled
    let farePerSeat = 0;
    const basePrice = route.base_price_per_segment || 50;
    
    if (route.prices_per_segment && Array.isArray(route.prices_per_segment)) {
      for (let i = from_index; i < to_index; i++) {
        const segmentPrice = route.prices_per_segment[i] || basePrice;
        farePerSeat += segmentPrice;
      }
    } else {
      const segments = to_index - from_index;
      farePerSeat = segments * basePrice;
    }
    
    // Safety check
    if (!farePerSeat || farePerSeat <= 0 || isNaN(farePerSeat)) {
      farePerSeat = basePrice * (to_index - from_index);
    }

    const totalFare = farePerSeat * sanitizedSeats.length;

    // BEGIN ATOMIC TRANSACTION with SELECT FOR UPDATE
    const { data: txResult, error: txError } = await supabase.rpc('begin_multi_seat_booking', {
      p_trip_id: trip_id,
      p_user_id: user_id,
      p_seat_numbers: sanitizedSeats,
      p_from_index: from_index,
      p_to_index: to_index,
      p_passengers: passengers,
      p_fare_per_seat: farePerSeat,
      p_booking_group_id: booking_group_id,
      p_booking_date: trip_date
    });

    if (txError || !txResult) {
      console.error('Transaction error:', txError);
      
      // Check if it's a seat conflict
      if (txError?.message?.includes('seat_taken')) {
        const conflictingSeat = parseInt(txError.message.match(/seat (\d+)/)?.[1] || '0');
        await logEvent(supabase, {
          booking_group_id,
          event_type: 'seat_conflict',
          metadata: { conflicting_seat: conflictingSeat, trip_id, seat_numbers: sanitizedSeats }
        });

        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: 'seat_taken', 
            conflicting_seat: conflictingSeat,
            message: txError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      await logEvent(supabase, {
        booking_group_id,
        event_type: 'booking_failed',
        metadata: { reason: 'transaction_error', error: txError?.message, trip_id }
      });

      return new Response(
        JSON.stringify({ success: false, reason: 'database_error', message: 'Error creating bookings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const insertedBookings = txResult?.bookings || [];

    console.log(`Multi-seat booking created: ${insertedBookings.length} seats, group ID: ${booking_group_id}`);

    await logEvent(supabase, {
      booking_group_id,
      event_type: 'booking_created',
      metadata: { 
        trip_id, 
        seat_numbers: sanitizedSeats, 
        from_stop, 
        to_stop, 
        total_fare: totalFare,
        booking_count: insertedBookings.length
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking_group_id,
        bookings: insertedBookings,
        fare_total: totalFare,
        status: 'pending_payment'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in createBookingSegment:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, reason: 'server_error', message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
