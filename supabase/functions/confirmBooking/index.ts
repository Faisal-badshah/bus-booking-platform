import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    const { booking_id, payment_reference } = await req.json();

    console.log("Incoming booking confirmation", {
      booking_id,
      payment_reference,
    });

    if (!booking_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "booking_id is required",
        }),
        { headers: corsHeaders, status: 400 },
      );
    }

    // fetch booking
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (!booking) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Booking not found",
        }),
        { headers: corsHeaders, status: 404 },
      );
    }

    // if already confirmed → don't break, just issue ticket again
    if (booking.status === "confirmed") {
      console.log("Booking already confirmed — triggering ticket generation");

      await supabase.functions.invoke("issueTicket", {
        body: { booking_id },
        headers: {
          Authorization: `Bearer ${serviceKey}`,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Booking already confirmed, ticket triggered",
        }),
        { headers: corsHeaders },
      );
    }

    // if still pending → confirm it
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        payment_reference,
      })
      .eq("id", booking_id);

    if (updateError) {
      console.error(updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to confirm booking",
        }),
        { headers: corsHeaders, status: 500 },
      );
    }

    console.log("Booking confirmed — triggering ticket generation");

    await supabase.functions.invoke("issueTicket", {
      body: { booking_id },
      headers: {
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Booking confirmed and ticket generated",
      }),
      { headers: corsHeaders },
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({
        success: false,
        message: e.message ?? "Unknown error",
      }),
      { headers: corsHeaders, status: 500 },
    );
  }
});
