import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    
    console.log('Resend webhook received:', payload);

    const { type, data } = payload;

    // Extract booking_id from email metadata or tags if available
    // Resend includes email_id which we can use to track
    const emailId = data?.email_id;
    const status = type; // e.g., 'email.delivered', 'email.bounced', 'email.complained'

    // Map Resend webhook events to our log events
    let eventType = 'email_status_update';
    let metadata: any = {
      resend_event: type,
      email_id: emailId,
      timestamp: new Date().toISOString()
    };

    switch (type) {
      case 'email.sent':
        eventType = 'email_sent_confirmed';
        break;
      case 'email.delivered':
        eventType = 'email_delivered';
        metadata.delivered = true;
        break;
      case 'email.delivery_delayed':
        eventType = 'email_delayed';
        metadata.delayed = true;
        break;
      case 'email.bounced':
        eventType = 'email_bounced';
        metadata.bounced = true;
        metadata.bounce_type = data?.bounce?.type;
        metadata.bounce_reason = data?.bounce?.message;
        break;
      case 'email.complained':
        eventType = 'email_complained';
        metadata.complained = true;
        break;
      case 'email.opened':
        eventType = 'email_opened';
        metadata.opened = true;
        break;
      case 'email.clicked':
        eventType = 'email_clicked';
        metadata.clicked = true;
        metadata.link = data?.click?.link;
        break;
      default:
        console.log('Unknown Resend event type:', type);
    }

    // Try to find booking by email address
    const emailAddress = data?.to;
    if (emailAddress) {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, booking_group_id, passenger_email')
        .eq('passenger_email', emailAddress)
        .order('created_at', { ascending: false })
        .limit(10); // Get recent bookings for this email

      if (bookings && bookings.length > 0) {
        // Log event for each matching booking
        for (const booking of bookings) {
          await logEvent(supabase, {
            booking_id: booking.id,
            booking_group_id: booking.booking_group_id,
            event_type: eventType,
            metadata: {
              ...metadata,
              passenger_email: emailAddress
            }
          });
        }

        console.log(`Logged ${eventType} for ${bookings.length} booking(s)`);
      } else {
        // Log without booking_id
        await logEvent(supabase, {
          event_type: eventType,
          metadata: {
            ...metadata,
            passenger_email: emailAddress,
            note: 'No matching booking found'
          }
        });
      }
    } else {
      // Log event without booking association
      await logEvent(supabase, {
        event_type: eventType,
        metadata
      });
    }

    return new Response(
      JSON.stringify({ success: true, event_type: eventType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in resendWebhook:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
