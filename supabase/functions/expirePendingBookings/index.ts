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

    console.log('Running expirePendingBookings...');

    // Find and expire bookings that are pending_payment for more than 10 minutes
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() - 10);

    const { data: expiredBookings, error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'expired' })
      .eq('status', 'pending_payment')
      .lt('created_at', expirationTime.toISOString())
      .select();

    if (updateError) {
      console.error('Error expiring bookings:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error expiring bookings',
          error: updateError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const count = expiredBookings?.length || 0;
    console.log(`Expired ${count} booking(s)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired_count: count,
        message: `Successfully expired ${count} booking(s)`,
        bookings: expiredBookings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in expirePendingBookings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
