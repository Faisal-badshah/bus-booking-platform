import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('booking_mode, max_seats_per_booking, festival_force_online, online_payment_weekends, online_payment_distance_threshold, online_payment_disable_from, online_payment_disable_to')
      .single();

    if (error) {
      console.error('Error fetching public settings:', error);
      // Return safe defaults if settings can't be loaded
      return new Response(
        JSON.stringify({
          booking_mode: 'offline',
          max_seats_per_booking: 6,
          festival_force_online: false,
          online_payment_weekends: false,
          online_payment_distance_threshold: null,
          online_payment_disable_from: null,
          online_payment_disable_to: null
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Only return public-safe settings (excludes use_real_payment_gateway, allow_mock_webhook_simulation)
    return new Response(
      JSON.stringify({
        booking_mode: data.booking_mode,
        max_seats_per_booking: data.max_seats_per_booking,
        festival_force_online: data.festival_force_online,
        online_payment_weekends: data.online_payment_weekends,
        online_payment_distance_threshold: data.online_payment_distance_threshold,
        online_payment_disable_from: data.online_payment_disable_from,
        online_payment_disable_to: data.online_payment_disable_to
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Unexpected error in getPublicSettings:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
