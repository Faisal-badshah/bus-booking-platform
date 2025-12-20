import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

// Helper function to verify Razorpay webhook signature
function verifyRazorpaySignature(body: string, signature: string, secret: string): boolean {
  const hmac = createHmac("sha256", secret);
  hmac.update(body);
  const expectedSignature = hmac.digest("hex");
  console.log('Signature verification:', {
    received: signature,
    expected: expectedSignature,
    matches: signature === expectedSignature
  });
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
    // Log raw request details
    console.log('Razorpay webhook received:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      timestamp: new Date().toISOString()
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    
    if (!razorpayKeySecret) {
      console.error('Missing RAZORPAY_KEY_SECRET');
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook secret not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get raw body and signature
    const bodyText = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    console.log('Webhook body:', bodyText);
    console.log('Webhook signature:', signature);

    // STEP 1: Verify Razorpay signature
    const isValidSignature = verifyRazorpaySignature(bodyText, signature, razorpayKeySecret);
    
    if (!isValidSignature) {
      console.error('Invalid Razorpay webhook signature');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('Signature verification successful');

    // Parse the webhook payload
    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity || {};

    console.log('Razorpay event:', {
      event,
      payment_id: paymentEntity.id,
      order_id: paymentEntity.order_id,
      amount: paymentEntity.amount,
      status: paymentEntity.status
    });

    // Only process payment.captured events
    if (event !== 'payment.captured') {
      console.log('Ignoring non-payment.captured event:', event);
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payment_id = paymentEntity.id;
    const order_id = paymentEntity.order_id;
    const amount = paymentEntity.amount / 100; // Convert from paise to rupees

    // STEP 2: Get booking_group_id from order
    // The order receipt contains the booking_group_id
    const { data: orderData } = await supabase
      .from('payment_transactions')
      .select('booking_group_id')
      .eq('payment_reference', order_id)
      .single();

    let booking_group_id = orderData?.booking_group_id;

    // If not found in payment_transactions, extract from order notes
    if (!booking_group_id && paymentEntity.notes?.booking_group_id) {
      booking_group_id = paymentEntity.notes.booking_group_id;
    }

    if (!booking_group_id) {
      console.error('Could not find booking_group_id for order:', order_id);
      await logEvent(supabase, {
        event_type: 'payment_failed',
        metadata: { 
          reason: 'booking_group_id_not_found',
          payment_id,
          order_id
        }
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Booking group not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Processing payment for booking_group_id:', booking_group_id);

    // STEP 3: Check idempotency
    const { data: existingTxn } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('payment_reference', payment_id)
      .single();

    if (existingTxn && existingTxn.status === 'completed') {
      console.log('Payment already processed (idempotent):', payment_id);
      return new Response(
        JSON.stringify({ success: true, message: 'Payment already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 4: Create/update payment transaction
    if (!existingTxn) {
      const { error: insertError } = await supabase.from('payment_transactions').insert({
        payment_reference: payment_id,
        booking_group_id,
        amount,
        status: 'processing',
        metadata: { 
          order_id,
          razorpay_event: event,
          webhook_received_at: new Date().toISOString() 
        }
      });

      console.log('Payment transaction created:', { payment_id, error: insertError });
    }

    // STEP 5: Update bookings to confirmed
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('booking_group_id', booking_group_id)
      .eq('status', 'pending_payment');

    console.log('Found bookings:', {
      count: bookings?.length || 0,
      error: bookingsError
    });

    if (bookingsError || !bookings || bookings.length === 0) {
      console.error('No pending bookings found');
      await logEvent(supabase, {
        booking_group_id,
        event_type: 'payment_failed',
        metadata: { reason: 'no_pending_bookings', payment_id }
      });

      await supabase
        .from('payment_transactions')
        .update({ status: 'failed', metadata: { error: 'No pending bookings' } })
        .eq('payment_reference', payment_id);

      return new Response(
        JSON.stringify({ success: false, error: 'No pending bookings found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // STEP 6: Confirm all bookings
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_reference: payment_id,
        confirmed_at: new Date().toISOString()
      })
      .eq('booking_group_id', booking_group_id)
      .eq('status', 'pending_payment');

    console.log('Bookings update result:', { error: updateError });

    if (updateError) {
      console.error('Error confirming bookings:', updateError);
      await logEvent(supabase, {
        booking_group_id,
        event_type: 'payment_failed',
        metadata: { reason: 'update_error', error: updateError.message, payment_id }
      });

      await supabase
        .from('payment_transactions')
        .update({ status: 'failed', metadata: { error: updateError.message } })
        .eq('payment_reference', payment_id);

      return new Response(
        JSON.stringify({ success: false, error: 'Error confirming bookings', details: updateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // STEP 7: Mark payment as completed
    await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('payment_reference', payment_id);

    console.log(`Payment confirmed for ${bookings.length} bookings`);

    await logEvent(supabase, {
      booking_group_id,
      event_type: 'payment_confirmed',
      metadata: { payment_id, order_id, amount, booking_count: bookings.length }
    });

    // STEP 8: Generate tickets
    console.log('Starting ticket generation for bookings...');
    const ticketResults = await Promise.allSettled(
      bookings.map(async (booking) => {
        try {
          console.log(`Generating ticket for booking: ${booking.id}`);
          const result = await supabase.functions.invoke('issueTicket', {
            body: { booking_id: booking.id }
          });
          
          if (result.error) {
            throw new Error(result.error.message);
          }
          
          await logEvent(supabase, {
            booking_group_id,
            booking_id: booking.id,
            event_type: 'ticket_issued',
            metadata: { payment_id }
          });
          
          return { success: true, booking_id: booking.id };
        } catch (error) {
          console.error(`Ticket generation failed for booking ${booking.id}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          await logEvent(supabase, {
            booking_group_id,
            booking_id: booking.id,
            event_type: 'ticket_generation_failed',
            metadata: { error: errorMessage, payment_id, retry_needed: true }
          });
          
          throw error;
        }
      })
    );

    const successCount = ticketResults.filter(r => r.status === 'fulfilled').length;
    const failureCount = ticketResults.filter(r => r.status === 'rejected').length;
    
    console.log(`Ticket generation complete: ${successCount} succeeded, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking_group_id,
        bookings_confirmed: bookings.length,
        tickets_generated: successCount,
        tickets_failed: failureCount,
        message: 'Payment processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in razorpayWebhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
