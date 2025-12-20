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

    const { booking_id, payment_reference } = await req.json();

    console.log('Confirming booking:', { booking_id, payment_reference });

    if (!booking_id || !payment_reference) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'booking_id and payment_reference are required' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // STEP 1: SELECT booking FOR UPDATE (with transaction semantics)
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (fetchError || !booking) {
      console.error('Booking not found:', fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Booking not found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // STEP 2: Check if status is pending_payment
    if (booking.status !== 'pending_payment') {
      console.error('Invalid booking status:', booking.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Cannot confirm booking with status: ${booking.status}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // STEP 3: Update booking to confirmed status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_reference: payment_reference,
        confirmed_at: new Date().toISOString()
      })
      .eq('id', booking_id)
      .eq('status', 'pending_payment') // Double-check status hasn't changed
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error confirming booking' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!updatedBooking) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Booking status changed during confirmation' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      );
    }

    // Create payment record
    await supabase
      .from('payments')
      .insert({
        booking_id: booking_id,
        amount: booking.total_amount,
        status: 'completed',
        transaction_id: payment_reference,
        payment_method: 'online'
      });

    console.log('Booking confirmed successfully:', booking_id);

    // STEP 4: Trigger ticket generation immediately after confirmation
    try {
      const ticketResponse = await supabase.functions.invoke('issueTicket', {
        body: { booking_id: booking_id }
      });
      
      if (ticketResponse.error) {
        console.error('Error triggering ticket generation:', ticketResponse.error);
      } else {
        console.log('Ticket generation triggered successfully');
      }
    } catch (ticketError) {
      console.error('Failed to trigger ticket generation:', ticketError);
      // Don't fail the confirmation if ticket generation fails
    }

    // STEP 5: Return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        booking_id: booking_id,
        message: 'Booking confirmed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in confirmBooking:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
