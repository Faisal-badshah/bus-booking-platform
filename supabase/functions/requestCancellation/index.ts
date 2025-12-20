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

    // Get auth header to identify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { booking_id, reason } = await req.json();

    console.log('Cancellation request:', { booking_id, user_id: user.id, reason });

    if (!booking_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'booking_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Load booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, trips:trip_id(trip_date, departure_time)')
      .eq('id', booking_id)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ success: false, message: 'Booking not found or unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (booking.status !== 'confirmed') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Only confirmed bookings can be cancelled' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (booking.cancellation_requested) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Cancellation already requested for this booking' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Calculate potential refund based on time before trip
    const trip = Array.isArray(booking.trips) ? booking.trips[0] : booking.trips;
    const tripDateTime = new Date(`${trip.trip_date}T${trip.departure_time}`);
    const now = new Date();
    const hoursUntilTrip = (tripDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refund_percentage = 0;
    if (hoursUntilTrip > 24) {
      refund_percentage = 100;
    } else if (hoursUntilTrip >= 8) {
      refund_percentage = 70;
    } else if (hoursUntilTrip >= 0) {
      refund_percentage = 0;
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Cannot cancel booking after trip departure' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const refund_amount = (booking.total_amount * refund_percentage) / 100;

    // Update booking to mark cancellation requested
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        cancellation_requested: true,
        refund_amount 
      })
      .eq('id', booking_id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return new Response(
        JSON.stringify({ success: false, message: 'Error requesting cancellation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create cancellation record
    const { error: cancellationError } = await supabase
      .from('cancellations')
      .insert({
        booking_id,
        reason,
        refund_amount,
        status: 'pending'
      });

    if (cancellationError) {
      console.error('Error creating cancellation record:', cancellationError);
      return new Response(
        JSON.stringify({ success: false, message: 'Error creating cancellation record' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Cancellation requested:', booking_id);

    await logEvent(supabase, {
      booking_group_id: booking.booking_group_id,
      booking_id,
      event_type: 'cancellation_requested',
      metadata: { 
        user_id: user.id, 
        reason, 
        refund_amount, 
        refund_percentage,
        hours_until_trip: hoursUntilTrip
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking_id,
        refund_amount,
        refund_percentage,
        message: 'Cancellation requested successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in requestCancellation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
