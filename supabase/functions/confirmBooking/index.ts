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

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { booking_id, payment_reference } = body;

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
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Fetch booking
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (fetchError || !booking) {
      console.error("Booking fetch error:", fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Booking not found",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    console.log("Booking found, current status:", booking.status);

    // If already confirmed → don't break, just issue ticket again
    if (booking.status === "confirmed") {
      console.log("Booking already confirmed — triggering ticket generation");

      try {
        const ticketResult = await supabase.functions.invoke("issueTicket", {
          body: { booking_id },
        });

        console.log("Ticket generation result:", ticketResult);

        if (ticketResult.error) {
          console.error("Ticket generation error:", ticketResult.error);
          return new Response(
            JSON.stringify({
              success: true,
              message: "Booking already confirmed, but ticket generation had issues",
              ticket_error: ticketResult.error,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Booking already confirmed, ticket triggered",
            ticket_data: ticketResult.data,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (ticketError) {
        console.error("Ticket invocation error:", ticketError);
        return new Response(
          JSON.stringify({
            success: true,
            message: "Booking confirmed but ticket generation failed",
            error: ticketError instanceof Error ? ticketError.message : "Unknown error",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // If still pending → confirm it
    console.log("Confirming pending booking...");
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        payment_reference,
      })
      .eq("id", booking_id);

    if (updateError) {
      console.error("Booking update error:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to confirm booking",
          error: updateError.message,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    console.log("Booking confirmed successfully — triggering ticket generation");

    // Invoke ticket generation
    try {
      const ticketResult = await supabase.functions.invoke("issueTicket", {
        body: { booking_id },
      });

      console.log("Ticket generation result:", ticketResult);

      if (ticketResult.error) {
        console.error("Ticket generation error:", ticketResult.error);
        // Still return success since booking was confirmed
        return new Response(
          JSON.stringify({
            success: true,
            message: "Booking confirmed but ticket generation failed",
            booking_id,
            ticket_error: ticketResult.error.message,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Booking confirmed and ticket generated",
          booking_id,
          ticket_data: ticketResult.data,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (ticketError) {
      console.error("Ticket invocation error:", ticketError);
      // Still return success since booking was confirmed
      return new Response(
        JSON.stringify({
          success: true,
          message: "Booking confirmed but ticket generation failed",
          booking_id,
          error: ticketError instanceof Error ? ticketError.message : "Unknown error",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (e) {
    console.error("Unexpected error in confirmBooking:", e);
    return new Response(
      JSON.stringify({
        success: false,
        message: e instanceof Error ? e.message : "Unknown error",
        details: "Check Supabase logs for more information",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});