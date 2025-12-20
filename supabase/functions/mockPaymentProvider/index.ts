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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create user client to verify the token
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.log('Non-admin user attempted to access mock payment:', user.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Check if real payment gateway is enabled - block mock payments in production
    const { data: settings } = await supabase
      .from('system_settings')
      .select('use_real_payment_gateway')
      .limit(1)
      .single();

    if (settings?.use_real_payment_gateway === true) {
      console.log('Mock payment blocked - real payment gateway is enabled');
      return new Response(
        JSON.stringify({ success: false, error: 'Mock payments disabled in production mode' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    const payload = await req.json();

    console.log('Mock Payment Provider called by admin:', { admin_id: user.id, path, payload, timestamp: new Date().toISOString() });

    // CREATE ORDER endpoint
    if (path === 'create-order') {
      const { booking_group_id, amount, currency = 'INR', user_id } = payload;

      console.log('Creating mock order:', { booking_group_id, amount, currency, user_id });

      // Validate amount
      if (!amount || amount <= 0) {
        console.error('Invalid amount:', amount);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid amount. Amount must be greater than 0.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Validate booking_group_id
      if (!booking_group_id) {
        console.error('Missing booking_group_id');
        return new Response(
          JSON.stringify({ success: false, error: 'booking_group_id is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Generate mock order ID
      const order_id = `mock_order_${crypto.randomUUID()}`;
      
      await logEvent(supabase, {
        booking_group_id,
        event_type: 'mock_order_created',
        metadata: { order_id, amount, currency, user_id, created_at: new Date().toISOString() }
      });

      console.log('Mock order created successfully:', { order_id, amount, currency });

      return new Response(
        JSON.stringify({ 
          success: true,
          order_id,
          amount: Math.round(amount * 100), // Convert to paise for consistency
          currency,
          status: 'created',
          checkout_url: null,
          metadata: {
            booking_group_id,
            user_id: user_id || 'guest',
            test_mode: true
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CAPTURE PAYMENT endpoint
    if (path === 'capture') {
      const { order_id, payment_id, simulate = 'success' } = payload;

      console.log('Capturing mock payment:', { order_id, payment_id, simulate });

      if (!order_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'order_id is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Simulate different outcomes based on 'simulate' parameter
      if (simulate === 'failure') {
        console.log('Simulating payment failure for:', order_id);
        
        await logEvent(supabase, {
          event_type: 'mock_payment_failed',
          metadata: { order_id, reason: 'simulated_failure', timestamp: new Date().toISOString() }
        });

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Payment failed (simulated)',
            order_id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      if (simulate === 'timeout') {
        console.log('Simulating payment timeout for:', order_id);
        // Wait 2 seconds to simulate timeout
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await logEvent(supabase, {
          event_type: 'mock_payment_timeout',
          metadata: { order_id, timestamp: new Date().toISOString() }
        });

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Payment timeout (simulated)',
            order_id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 408 }
        );
      }

      // Default: SUCCESS
      const mock_payment_id = payment_id || `mock_pay_${crypto.randomUUID()}`;
      const captured_at = new Date().toISOString();

      await logEvent(supabase, {
        event_type: 'mock_payment_captured',
        metadata: { 
          order_id, 
          payment_id: mock_payment_id, 
          captured_at,
          status: 'captured' 
        }
      });

      console.log('Mock payment captured successfully:', { payment_id: mock_payment_id, order_id });

      return new Response(
        JSON.stringify({ 
          success: true,
          payment_id: mock_payment_id,
          order_id,
          status: 'captured',
          captured_at,
          test_mode: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SIMULATE WEBHOOK endpoint (for admin testing)
    if (path === 'simulate-webhook') {
      const { order_id, booking_group_id, amount, outcome = 'success' } = payload;

      console.log('Simulating webhook:', { order_id, booking_group_id, outcome });

      if (!booking_group_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'booking_group_id is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const payment_id = `mock_pay_${crypto.randomUUID()}`;

      // Check idempotency
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

      // Create payment transaction
      const { error: insertError } = await supabase.from('payment_transactions').insert({
        payment_reference: payment_id,
        booking_group_id,
        amount,
        status: 'processing',
        metadata: { 
          order_id,
          test_mode: true,
          simulated: true,
          webhook_received_at: new Date().toISOString() 
        }
      });

      if (insertError) {
        console.error('Error creating payment transaction:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create payment transaction' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Update bookings to confirmed
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('booking_group_id', booking_group_id)
        .eq('status', 'pending_payment');

      if (bookingsError || !bookings || bookings.length === 0) {
        console.error('No pending bookings found');
        
        await supabase
          .from('payment_transactions')
          .update({ status: 'failed', metadata: { error: 'No pending bookings' } })
          .eq('payment_reference', payment_id);

        return new Response(
          JSON.stringify({ success: false, error: 'No pending bookings found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Confirm all bookings
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_reference: payment_id,
          confirmed_at: new Date().toISOString()
        })
        .eq('booking_group_id', booking_group_id)
        .eq('status', 'pending_payment');

      if (updateError) {
        console.error('Error confirming bookings:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Error confirming bookings' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Mark payment as completed
      await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('payment_reference', payment_id);

      console.log(`Mock payment confirmed for ${bookings.length} bookings`);

      await logEvent(supabase, {
        booking_group_id,
        event_type: 'mock_payment_confirmed',
        metadata: { payment_id, order_id, amount, booking_count: bookings.length }
      });

      // Generate tickets
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
          message: 'Mock payment processed successfully',
          test_mode: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Unknown endpoint' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );

  } catch (error) {
    console.error('Error in mockPaymentProvider:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
