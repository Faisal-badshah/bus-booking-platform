import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Missing Razorpay credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Razorpay credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const payload = await req.json();
    const { booking_group_id, amount, user_id } = payload;

    // Log incoming request
    console.log('Creating Razorpay order:', { 
      booking_group_id, 
      amount, 
      user_id,
      timestamp: new Date().toISOString()
    });

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

    // Create Razorpay order
    const amountInPaise = Math.round(amount * 100); // Convert to paise
    console.log('Amount in paise:', amountInPaise);

    const orderPayload = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: booking_group_id,
      notes: {
        booking_group_id,
        user_id: user_id || 'guest'
      }
    };

    console.log('Razorpay order payload:', orderPayload);

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
      },
      body: JSON.stringify(orderPayload)
    });

    const responseBody = await response.json();

    // Log full Razorpay response
    console.log('Razorpay API response:', {
      status: response.status,
      body: responseBody,
      timestamp: new Date().toISOString()
    });

    if (!response.ok) {
      console.error('Razorpay order creation failed:', responseBody);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create Razorpay order',
          details: responseBody 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    console.log('Razorpay order created successfully:', {
      order_id: responseBody.id,
      amount: responseBody.amount,
      currency: responseBody.currency
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: responseBody.id,
        amount: responseBody.amount,
        currency: responseBody.currency
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in createRazorpayOrder:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: errorMessage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
