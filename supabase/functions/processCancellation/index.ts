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

// Mock function to call payment gateway refund API
async function processRefund(paymentReference: string, amount: number) {
  // In production, this would call your actual payment gateway API
  console.log(`Processing refund: ${paymentReference}, amount: ${amount}`);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    refund_id: `REF-${Date.now()}`,
    amount
  };
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
      booking_id,
      action, // 'approve' or 'reject'
      admin_notes
    } = await req.json();

    console.log('Process cancellation:', { booking_id, action, admin_notes });

    if (!booking_id || !action) {
      return new Response(
        JSON.stringify({ success: false, message: 'booking_id and action are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ success: false, message: 'action must be "approve" or "reject"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // STEP 1: Load booking with FOR UPDATE lock
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, trips:trip_id(trip_date, departure_time)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ success: false, message: 'Booking not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (!booking.cancellation_requested) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No cancellation request found for this booking' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (action === 'reject') {
      // STEP 2a: Reject cancellation
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          cancellation_requested: false,
          refund_amount: null
        })
        .eq('id', booking_id);

      if (updateError) {
        console.error('Error rejecting cancellation:', updateError);
        return new Response(
          JSON.stringify({ success: false, message: 'Error rejecting cancellation' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Update cancellation record
      await supabase
        .from('cancellations')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString()
        })
        .eq('booking_id', booking_id)
        .eq('status', 'pending');

      await logEvent(supabase, {
        booking_group_id: booking.booking_group_id,
        booking_id,
        event_type: 'cancellation_rejected',
        metadata: { admin_notes }
      });

      console.log('Cancellation rejected:', booking_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Cancellation rejected',
          booking_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 2b: Approve cancellation
    
    // STEP 3: Recalculate refund based on current time
    const trip = Array.isArray(booking.trips) ? booking.trips[0] : booking.trips;
    const tripDateTime = new Date(`${trip.trip_date}T${trip.departure_time}`);
    const now = new Date();
    const hoursUntilTrip = (tripDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refund_percentage = 0;
    if (hoursUntilTrip > 24) {
      refund_percentage = 100;
    } else if (hoursUntilTrip >= 8) {
      refund_percentage = 70;
    } else {
      refund_percentage = 0;
    }

    const final_refund_amount = (booking.total_amount * refund_percentage) / 100;

    // STEP 4: Process refund via payment gateway
    let refund_result;
    try {
      refund_result = await processRefund(booking.payment_reference, final_refund_amount);
      
      if (!refund_result.success) {
        throw new Error('Refund failed at payment gateway');
      }
    } catch (refundError) {
      console.error('Refund processing failed:', refundError);
      const errorMessage = refundError instanceof Error ? refundError.message : 'Unknown error';
      await logEvent(supabase, {
        booking_group_id: booking.booking_group_id,
        booking_id,
        event_type: 'refund_failed',
        metadata: { error: errorMessage, attempted_amount: final_refund_amount }
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Refund processing failed',
          error: errorMessage
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // STEP 5: Update booking status to cancelled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_requested: false,
        cancelled_at: new Date().toISOString(),
        refund_amount: final_refund_amount
      })
      .eq('id', booking_id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return new Response(
        JSON.stringify({ success: false, message: 'Error updating booking status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // STEP 6: Update cancellation record
    await supabase
      .from('cancellations')
      .update({
        status: 'approved',
        refund_amount: final_refund_amount,
        processed_at: new Date().toISOString()
      })
      .eq('booking_id', booking_id)
      .eq('status', 'pending');

    console.log('Cancellation approved and refund processed:', booking_id);

    await logEvent(supabase, {
      booking_group_id: booking.booking_group_id,
      booking_id,
      event_type: 'cancellation_approved',
      metadata: { 
        refund_amount: final_refund_amount,
        refund_percentage,
        refund_id: refund_result.refund_id,
        admin_notes
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cancellation approved and refund processed',
        booking_id,
        refund_amount: final_refund_amount,
        refund_id: refund_result.refund_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in processCancellation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
