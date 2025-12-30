import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to sanitize text for PDF
function sanitizeForPDF(text: string): string {
  return text
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/↔/g, "<->")
    .replace(/•/g, "*")
    .replace(/°/g, "deg")
    .replace(/[^\x20-\x7E]/g, "?");
}

// Sign QR payload
function signQRPayload(payload: any, secret: string): string {
  const data = JSON.stringify(payload);
  const hmac = createHmac("sha256", secret);
  hmac.update(data);
  const signature = hmac.digest("hex");
  return `${btoa(data)}.${signature}`;
}

// Generate QR code PNG for PDF
async function generateQRCodePNG(text: string, size: number = 180): Promise<Uint8Array> {
  try {
    const response = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png`
    );
    if (!response.ok) throw new Error(`QR API error: ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    console.error("QR generation failed:", error);
    throw error;
  }
}

// Generate QR code data URL for email
async function generateQRCodeDataURL(text: string, size: number = 300): Promise<string> {
  try {
    const response = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png`
    );
    if (!response.ok) throw new Error(`QR API error: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("QR data URL failed:", error);
    throw error;
  }
}

// Fetch premium font (Montserrat Regular and Bold from Google Fonts)
async function fetchFont(url: string): Promise<Uint8Array> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Font fetch failed");
    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    console.error("Font fetch failed:", error);
    throw error;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const qrSecret = Deno.env.get("QR_SIGNING_SECRET");
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseKey || !qrSecret) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { booking_id } = await req.json();

    console.log("Starting ticket generation for:", booking_id);

    if (!booking_id) {
      return new Response(
        JSON.stringify({ success: false, message: "booking_id required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        id, user_id, trip_id, seat_number, passenger_name, passenger_email, 
        passenger_phone, total_amount, status, confirmed_at, payment_reference,
        from_index, to_index,
        trips:trip_id (
          trip_date, departure_time, arrival_time,
          routes:route_id (name, stops),
          buses:bus_id (name)
        )
      `
      )
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingError);
      return new Response(
        JSON.stringify({ success: false, message: "Booking not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (booking.status !== "confirmed") {
      return new Response(
        JSON.stringify({ success: false, message: "Booking not confirmed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Extract and sanitize data
    const trip = Array.isArray(booking.trips) ? booking.trips[0] : booking.trips;
    const rawRoute = Array.isArray(trip?.routes) ? trip.routes[0] : trip?.routes;
    const rawBus = Array.isArray(trip?.buses) ? trip.buses[0] : trip?.buses;

    const routeName = sanitizeForPDF(rawRoute?.name || "N/A");
    const busName = sanitizeForPDF(rawBus?.name || "N/A");
    const passengerName = sanitizeForPDF(booking.passenger_name);
    const passengerEmail = sanitizeForPDF(booking.passenger_email);
    const passengerPhone = sanitizeForPDF(booking.passenger_phone);
    
    const stops = (rawRoute?.stops || []).map(s => sanitizeForPDF(String(s)));
    const from_stop = stops[booking.from_index] || "Unknown";
    const to_stop = stops[booking.to_index] || "Unknown";

    // Generate QR
    const qrPayload = {
      booking_id: booking.id,
      seat: booking.seat_number,
      passenger: booking.passenger_name,
      trip_date: trip?.trip_date,
    };

    const signedQR = signQRPayload(qrPayload, qrSecret);
    console.log("QR signed successfully");

    // Fetch premium fonts
    const regularFontBytes = await fetchFont("https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.ttf");
    const boldFontBytes = await fetchFont("https://fonts.gstatic.com/s/montserrat/v26/JTUQjIg1_i6t8kCHKm459WxRyS7m0dR9pA.ttf");

    // Create PDF - Minimal layout
    console.log("Generating PDF...");
    const pdfDoc = await PDFDocument.create();
    const regularFont = await pdfDoc.embedFont(regularFontBytes);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);
    const page = pdfDoc.addPage([595, 420]); // Wider landscape for better readability

    const { width, height } = page.getSize();
    let y = height - 60;

    // Header with logo (assume you have fetchLogo function)
    // const logoBytes = await fetchLogo();
    // const logoImage = await pdfDoc.embedPng(logoBytes);
    // const logoDims = logoImage.scale(0.4);
    // page.drawImage(logoImage, { x: width / 2 - logoDims.width / 2, y, width: logoDims.width, height: logoDims.height });
    // y -= logoDims.height + 30;

    // Centered Title
    page.drawText("Ride Bus Ticket", {
      x: width / 2 - boldFont.widthOfTextAtSize("Ride Bus Ticket", 28) / 2,
      y,
      size: 28,
      font: boldFont,
      color: rgb(0.13, 0.55, 0.13), // Brand green
    });

    y -= 60;

    // Key Info Grid - Minimal 2-column
    const addKeyValue = (key: string, value: string, isBold = false) => {
      const currentFont = isBold ? boldFont : regularFont;
      const keyWidth = currentFont.widthOfTextAtSize(key, 14);
      page.drawText(key, { x: 60, y, size: 14, font: currentFont, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(value, { x: width / 2, y, size: 14, font: regularFont, color: rgb(0, 0, 0) });
      y -= 24;
    };

    addKeyValue("Passenger", passengerName, true);
    addKeyValue("Route", `${from_stop} to ${to_stop}`, true);
    addKeyValue("Date & Time", `${trip?.trip_date || "N/A"} at ${trip?.departure_time || "N/A"}`, true);
    addKeyValue("Seat", String(booking.seat_number), true);
    addKeyValue("Fare", `INR ${booking.total_amount}`, true);
    addKeyValue("Booking ID", booking.id.substring(0, 8) + "...");

    y -= 40;

    // QR Code - Centered
    const qrImageBytes = await generateQRCodePNG(signedQR, 150);
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    const qrDims = qrImage.scale(1);

    page.drawImage(qrImage, {
      x: width / 2 - qrDims.width / 2,
      y: y - qrDims.height,
      width: qrDims.width,
      height: qrDims.height,
    });

    page.drawText("Scan for Boarding", {
      x: width / 2 - regularFont.widthOfTextAtSize("Scan for Boarding", 12) / 2,
      y: y - qrDims.height - 20,
      size: 12,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Footer
    page.drawText("Safe Travels with Ride Bus", {
      x: width / 2 - regularFont.widthOfTextAtSize("Safe Travels with Ride Bus", 10) / 2,
      y: 30,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    console.log("PDF created successfully");

    // Save and upload
    const pdfBytes = await pdfDoc.save();

    const fileName = `${booking.user_id}/${booking_id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("tickets")
      .upload(fileName, new Blob([pdfBytes], { type: "application/pdf" }), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData, error: urlError } = await supabase.storage
      .from("tickets")
      .createSignedUrl(fileName, 60 * 60 * 24 * 7);

    if (urlError) throw new Error(`URL creation failed: ${urlError.message}`);

    const ticket_url = urlData?.signedUrl || "";

    await supabase.from("bookings").update({ ticket_url }).eq("id", booking_id);

    // Email sending remains the same

    return new Response(
      JSON.stringify({
        success: true,
        booking_id,
        ticket_url,
        message: "Ticket generated successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ticket generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ success: false, message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});