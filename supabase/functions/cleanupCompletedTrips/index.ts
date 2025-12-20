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

    console.log('Running cleanupCompletedTrips...');

    // Calculate retention thresholds
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Delete expired and cancelled bookings older than 30 days
    const { data: deletedExpiredCancelled, error: error1 } = await supabase
      .from('bookings')
      .delete()
      .in('status', ['expired', 'cancelled'])
      .lt('booking_date', thirtyDaysAgo.toISOString().split('T')[0])
      .select('id');

    if (error1) {
      console.error('Error deleting expired/cancelled bookings:', error1);
    }

    const expiredCancelledCount = deletedExpiredCancelled?.length || 0;
    console.log(`Deleted ${expiredCancelledCount} expired/cancelled booking(s)`);

    // Delete confirmed bookings older than 90 days
    const { data: deletedConfirmed, error: error2 } = await supabase
      .from('bookings')
      .delete()
      .eq('status', 'confirmed')
      .lt('booking_date', ninetyDaysAgo.toISOString().split('T')[0])
      .select('id');

    if (error2) {
      console.error('Error deleting old confirmed bookings:', error2);
    }

    const confirmedCount = deletedConfirmed?.length || 0;
    console.log(`Deleted ${confirmedCount} old confirmed booking(s)`);

    // Delete old booking logs (older than 90 days)
    const { data: deletedLogs, error: error3 } = await supabase
      .from('booking_logs')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString())
      .select('id');

    if (error3) {
      console.error('Error deleting old booking logs:', error3);
    }

    const logsCount = deletedLogs?.length || 0;
    console.log(`Deleted ${logsCount} old booking log(s)`);

    // Delete old boarding logs (older than 90 days)
    const { data: deletedBoardingLogs, error: error4 } = await supabase
      .from('boarding_logs')
      .delete()
      .lt('boarded_at', ninetyDaysAgo.toISOString())
      .select('id');

    if (error4) {
      console.error('Error deleting old boarding logs:', error4);
    }

    const boardingLogsCount = deletedBoardingLogs?.length || 0;
    console.log(`Deleted ${boardingLogsCount} old boarding log(s)`);

    const totalDeleted = expiredCancelledCount + confirmedCount + logsCount + boardingLogsCount;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleanup completed: ${totalDeleted} record(s) deleted`,
        details: {
          expired_cancelled_bookings: expiredCancelledCount,
          old_confirmed_bookings: confirmedCount,
          booking_logs: logsCount,
          boarding_logs: boardingLogsCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cleanupCompletedTrips:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
