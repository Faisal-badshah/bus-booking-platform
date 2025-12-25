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
      console.error("Missing env vars");
      return new Response(
        JSON.stringify({ success: false, message: "Server config error" }),
        { headers: corsHeaders, status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { booking_id, payment_reference } = await req.json();

    console.log("Incoming booking confirmation", { booking_id, payment_reference });

    if (!booking_id || !payment_reference) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "booking_id and payment_reference are required",
        }),
        { headers: corsHeaders, status: 400 },
      );
    }

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found", bookingError);
      return new Response(
        JSON.stringify({ success: false, message: "Booking not found" }),
        { headers: corsHeaders, status: 404 },
      );
    }

    // Must be pending_payment
    if (booking.status !== "pending_payment") {
      console.error("Invalid booking status", booking.status);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Cannot confirm booking with status ${booking.status}`,
        }),
        { headers: corsHeaders, status: 400 },
      );
    }

    // Update booking to confirmed
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_reference,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", booking_id)
      .eq("status", "pending_payment")
      .select()
      .single();

    if (updateError || !updatedBooking) {
      console.error("Error updating booking", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to confirm booking",
        }),
        { headers: corsHeaders, status: 500 },
      );
    }

    // Insert payment row
    await supabase.from("payments").insert({
      booking_id,
      amount: booking.total_amount,
      status: "completed",
      transaction_id: payment_reference,
      payment_method: "online",
    });

    console.log("Booking confirmed — triggering ticket generation…");

    // 🔥 Trigger ticket generation using direct fetch (correct auth)
    try {
      const ticketRes = await fetch(
        `${supabaseUrl}/functions/v1/issueTicket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ booking_id }),
        },
      );

      if (!ticketRes.ok) {
        console.error("IssueTicket returned", ticketRes.status);
      } else {
        console.log("Ticket issued successfully");
      }
    } catch (ticketError) {
      console.error("Failed to trigger issueTicket", ticketError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking_id,
        message: "Booking confirmed",
      }),
      { headers: corsHeaders, status: 200 },
    );
  } catch (err) {
    console.error("Fatal confirmBooking error", err);
    return new Response(
      JSON.stringify({ success: false, message: "Unexpected server error" }),
      { headers: corsHeaders, status: 500 },
    );
  }
});
