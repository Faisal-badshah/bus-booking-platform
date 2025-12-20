import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to verify webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");
  return signature === expectedSignature;
}

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
    const paymentSecret = Deno.env.get('PAYMENT_GATEWAY_SECRET')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const bodyText = await req.text();
    const payload = JSON.parse(bodyText);

    const {
      payment_reference,
      booking_group_id,
      amount,
      signature
    } = payload;

    console.log('Payment webhook received:', { payment_reference, booking_group_id, amount });

    // STEP 1: Verify signature
    if (!verifySignature(bodyText, signature, paymentSecret)) {
      console.error('Invalid webhook signature');
      await logEvent(supabase, {
        booking_group_id,
        event_type: 'payment_failed',
        metadata: { reason: 'invalid_signature', payment_reference }
      });
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid signature' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // STEP 2: Check idempotency - has this payment been processed?
    const { data: existingTxn, error: txnError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('payment_reference', payment_reference)
      .single();

    if (existingTxn && existingTxn.status === 'completed') {
      console.log('Payment already processed (idempotent):', payment_reference);
      return new Response(
        JSON.stringify({ success: true, message: 'Payment already processed', booking_group_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 3: Create payment transaction record
    if (!existingTxn) {
      await supabase.from('payment_transactions').insert({
        payment_reference,
        booking_group_id,
        amount,
        status: 'processing',
        metadata: { webhook_received_at: new Date().toISOString() }
      });
    }

    // STEP 4: BEGIN TRANSACTION - Update all bookings in the group
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('booking_group_id', booking_group_id)
      .eq('status', 'pending_payment');

    if (bookingsError || !bookings || bookings.length === 0) {
      console.error('No pending bookings found for group:', booking_group_id);
      await logEvent(supabase, {
        booking_group_id,
        event_type: 'payment_failed',
        metadata: { reason: 'no_pending_bookings', payment_reference }
      });
      
      // Update transaction status
      await supabase
        .from('payment_transactions')
        .update({ status: 'failed', metadata: { error: 'No pending bookings' } })
        .eq('payment_reference', payment_reference);

      return new Response(
        JSON.stringify({ success: false, message: 'No pending bookings found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // STEP 5: Confirm all bookings
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_reference,
        confirmed_at: new Date().toISOString()
      })
      .eq('booking_group_id', booking_group_id)
      .eq('status', 'pending_payment');

    if (updateError) {
      console.error('Error confirming bookings:', updateError);
      await logEvent(supabase, {
        booking_group_id,
        event_type: 'payment_failed',
        metadata: { reason: 'update_error', error: updateError.message, payment_reference }
      });

      await supabase
        .from('payment_transactions')
        .update({ status: 'failed', metadata: { error: updateError.message } })
        .eq('payment_reference', payment_reference);

      return new Response(
        JSON.stringify({ success: false, message: 'Error confirming bookings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // STEP 6: Mark payment transaction as completed
    await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('payment_reference', payment_reference);

    console.log(`Payment confirmed for ${bookings.length} bookings in group: ${booking_group_id}`);

    await logEvent(supabase, {
      booking_group_id,
      event_type: 'payment_confirmed',
      metadata: { 
        payment_reference, 
        amount, 
        booking_count: bookings.length 
      }
    });

    // STEP 7: Generate tickets for all bookings with proper error handling
    const ticketResults = await Promise.allSettled(
      bookings.map(async (booking) => {
        try {
          console.log(`Triggering ticket generation for booking: ${booking.id}`);
          const result = await supabase.functions.invoke('issueTicket', {
            body: { booking_id: booking.id }
          });
          
          if (result.error) {
            throw new Error(result.error.message || 'Ticket generation failed');
          }
          
          await logEvent(supabase, {
            booking_group_id,
            booking_id: booking.id,
            event_type: 'ticket_issued',
            metadata: { payment_reference }
          });
          
          return { success: true, booking_id: booking.id };
        } catch (error) {
          console.error(`Error generating ticket for booking ${booking.id}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          await logEvent(supabase, {
            booking_group_id,
            booking_id: booking.id,
            event_type: 'ticket_generation_failed',
            metadata: { 
              error: errorMessage,
              payment_reference,
              retry_needed: true 
            }
          });
          
          throw error;
        }
      })
    );
    
    // Log summary of ticket generation
    const successCount = ticketResults.filter(r => r.status === 'fulfilled').length;
    const failureCount = ticketResults.filter(r => r.status === 'rejected').length;
    
    console.log(`Ticket generation complete: ${successCount} succeeded, ${failureCount} failed`);
    
    if (failureCount > 0) {
      await logEvent(supabase, {
        booking_group_id,
        event_type: 'partial_ticket_generation_failure',
        metadata: { 
          total_bookings: bookings.length,
          successful_tickets: successCount,
          failed_tickets: failureCount,
          payment_reference
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking_group_id,
        bookings_confirmed: bookings.length,
        message: 'Payment processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in paymentWebhook:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
