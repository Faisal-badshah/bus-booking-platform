import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to verify QR signature
function verifyQRSignature(signedData: string, secret: string): any {
  try {
    const [encodedPayload, signature] = signedData.split('.');
    
    if (!encodedPayload || !signature) {
      return { valid: false, error: 'Invalid QR format' };
    }

    // Decode base64 using atob
    const payload = atob(encodedPayload);
    
    // Verify signature
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    const data = JSON.parse(payload);

    // Check expiry
    if (data.expiry && new Date(data.expiry) < new Date()) {
      return { valid: false, error: 'QR code expired' };
    }

    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: 'Failed to parse QR code' };
  }
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
    const qrSecret = Deno.env.get('QR_SIGNING_SECRET')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header to identify staff member
    const authHeader = req.headers.get('Authorization');
    let verifier_id = null;

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      verifier_id = user?.id;
    }

    const { qr_data, verification_method = 'qr_online' } = await req.json();

    console.log('Verifying ticket QR:', { qr_data: qr_data.substring(0, 20) + '...', verification_method });

    if (!qr_data) {
      return new Response(
        JSON.stringify({ success: false, message: 'qr_data is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // STEP 1: Verify QR signature
    const verificationResult = verifyQRSignature(qr_data, qrSecret);

    if (!verificationResult.valid) {
      console.error('Invalid QR signature:', verificationResult.error);
      
      await logEvent(supabase, {
        event_type: 'verification_failed',
        metadata: { reason: 'invalid_signature', error: verificationResult.error }
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          valid: false,
          message: verificationResult.error 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { data: qrPayload } = verificationResult;

    // STEP 2: Load booking from database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        trips:trip_id (
          trip_date,
          departure_time,
          arrival_time,
          routes:route_id (
            name,
            stops
          ),
          buses:bus_id (
            name
          )
        )
      `)
      .eq('id', qrPayload.booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      
      await logEvent(supabase, {
        booking_id: qrPayload.booking_id,
        event_type: 'verification_failed',
        metadata: { reason: 'booking_not_found' }
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          valid: false,
          message: 'Booking not found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // STEP 3: Validate booking status
    if (booking.status !== 'confirmed') {
      await logEvent(supabase, {
        booking_id: booking.id,
        booking_group_id: booking.booking_group_id,
        event_type: 'verification_failed',
        metadata: { reason: 'booking_not_confirmed', status: booking.status }
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          valid: false,
          message: `Booking status is ${booking.status}, not confirmed` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // STEP 4: Verify booking details match QR payload
    if (booking.trip_id !== qrPayload.trip_id || 
        booking.seat_number !== qrPayload.seat_number) {
      
      await logEvent(supabase, {
        booking_id: booking.id,
        booking_group_id: booking.booking_group_id,
        event_type: 'verification_failed',
        metadata: { reason: 'data_mismatch' }
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          valid: false,
          message: 'QR data does not match booking details' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // STEP 5: Check if already boarded
    const { data: existingBoardingLog } = await supabase
      .from('boarding_logs')
      .select('*')
      .eq('booking_id', booking.id)
      .single();

    if (existingBoardingLog) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          valid: true,
          already_boarded: true,
          boarded_at: existingBoardingLog.boarded_at,
          message: 'Ticket already verified and boarded',
          booking: {
            id: booking.id,
            passenger_name: booking.passenger_name,
            seat_number: booking.seat_number,
            from_stop: qrPayload.from_stop,
            to_stop: qrPayload.to_stop
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 6: Record boarding
    const { error: boardingError } = await supabase
      .from('boarding_logs')
      .insert({
        booking_id: booking.id,
        trip_id: booking.trip_id,
        verified_by: verifier_id,
        verification_method,
        metadata: { qr_verified: true }
      });

    if (boardingError) {
      console.error('Error recording boarding:', boardingError);
      // Don't fail verification, just log the error
    }

    console.log('Ticket verified successfully:', booking.id);

    await logEvent(supabase, {
      booking_id: booking.id,
      booking_group_id: booking.booking_group_id,
      event_type: 'ticket_verified',
      metadata: { 
        verification_method, 
        verified_by: verifier_id,
        seat_number: booking.seat_number 
      }
    });

    const trip = Array.isArray(booking.trips) ? booking.trips[0] : booking.trips;
    const route = trip?.routes ? (Array.isArray(trip.routes) ? trip.routes[0] : trip.routes) : null;

    return new Response(
      JSON.stringify({ 
        success: true, 
        valid: true,
        already_boarded: false,
        message: 'Ticket verified successfully',
        booking: {
          id: booking.id,
          passenger_name: booking.passenger_name,
          passenger_email: booking.passenger_email,
          passenger_phone: booking.passenger_phone,
          seat_number: booking.seat_number,
          from_stop: qrPayload.from_stop,
          to_stop: qrPayload.to_stop,
          trip_date: trip?.trip_date,
          departure_time: trip?.departure_time,
          route_name: route?.name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verifyTicket:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, valid: false, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
