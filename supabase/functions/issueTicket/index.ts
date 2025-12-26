import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to sanitize text for PDF (remove unicode chars)
function sanitizeForPDF(text: string): string {
  if (!text) return "";
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

// Generate QR code PNG
async function generateQRCodePNG(text: string, size: number = 200): Promise<Uint8Array> {
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
    console.error("QR data URL generation failed:", error);
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

    // Extract data
    const trip = Array.isArray(booking.trips) ? booking.trips[0] : booking.trips;
    const route = Array.isArray(trip?.routes) ? trip.routes[0] : trip?.routes;
    const bus = Array.isArray(trip?.buses) ? trip.buses[0] : trip?.buses;
    const stops = route?.stops || [];

    const from_stop = sanitizeForPDF(stops[booking.from_index] || "Unknown");
    const to_stop = sanitizeForPDF(stops[booking.to_index] || "Unknown");

    // Generate QR payload
    const qrPayload = {
      booking_id: booking.id,
      seat: booking.seat_number,
      passenger: booking.passenger_name,
      trip_date: trip?.trip_date,
    };

    const signedQR = signQRPayload(qrPayload, qrSecret);
    console.log("QR signed successfully");

    // Generate PDF
    console.log("Generating PDF...");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { height } = page.getSize();
    let y = height - 50;

    // Title
    page.drawText("BUS TICKET CONFIRMATION", {
      x: 150,
      y: y,
      size: 20,
      font: boldFont,
      color: rgb(0, 0.4, 0.8),
    });

    y -= 40;
    page.drawLine({
      start: { x: 50, y },
      end: { x: 545, y },
      thickness: 2,
      color: rgb(0, 0.4, 0.8),
    });

    y -= 30;

    // Helper to add field
    const addField = (label: string, value: string) => {
      page.drawText(label, { x: 50, y, size: 10, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(sanitizeForPDF(value), { x: 200, y, size: 10, font, color: rgb(0, 0, 0) });
      y -= 20;
    };

    // Booking info
    addField("Booking ID:", booking.id.substring(0, 18) + "...");
    addField("Passenger:", booking.passenger_name);
    addField("Email:", booking.passenger_email);
    addField("Phone:", booking.passenger_phone);

    y -= 10;
    page.drawText("JOURNEY DETAILS", { x: 50, y, size: 14, font: boldFont, color: rgb(0, 0.4, 0.8) });
    y -= 25;

    addField("Route:", route?.name || "N/A");
    addField("From:", from_stop);
    addField("To:", to_stop);
    addField("Date:", trip?.trip_date || "N/A");
    addField("Departure:", trip?.departure_time || "N/A");
    addField("Arrival:", trip?.arrival_time || "N/A");
    addField("Bus:", bus?.name || "N/A");
    addField("Seat:", `${booking.seat_number}`);
    addField("Fare:", `INR ${booking.total_amount}`);

    y -= 20;

    // QR Code
    page.drawText("QR CODE FOR BOARDING", { x: 50, y, size: 12, font: boldFont, color: rgb(0, 0.4, 0.8) });
    y -= 20;
    page.drawText("Show this at check-in", { x: 50, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
    y -= 25;

    const qrImageBytes = await generateQRCodePNG(signedQR, 200);
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    const qrDims = qrImage.scale(0.8);

    page.drawImage(qrImage, {
      x: 50,
      y: y - qrDims.height,
      width: qrDims.width,
      height: qrDims.height,
    });

    console.log("PDF created successfully");

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    console.log("PDF bytes generated:", pdfBytes.length);

    // Upload to storage
    console.log("Uploading PDF...");
    const fileName = `${booking.user_id}/${booking_id}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("tickets")
      .upload(fileName, new Blob([pdfBytes], { type: "application/pdf" }), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log("PDF uploaded successfully");

    // Generate signed URL
    const { data: urlData, error: urlError } = await supabase.storage
      .from("tickets")
      .createSignedUrl(fileName, 60 * 60 * 24 * 7);

    if (urlError) throw new Error(`URL creation failed: ${urlError.message}`);

    const ticket_url = urlData?.signedUrl || "";
    console.log("Signed URL created");

    // Update booking with URL
    await supabase.from("bookings").update({ ticket_url }).eq("id", booking_id);
    console.log("Booking updated with ticket URL");

    // Send email (non-blocking - don't wait for it)
    if (resendKey) {
      console.log("Sending email...");
      const resend = new Resend(resendKey);

      try {
        const qrDataUrl = await generateQRCodeDataURL(signedQR, 300);

        await resend.emails.send({
          from: "Bus Booking <onboarding@resend.dev>",
          to: [booking.passenger_email],
          subject: `🎫 Your Bus Ticket - ${sanitizeForPDF(route?.name || "Booking")}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0;">🎫 Your Ticket is Ready!</h1>
                <p style="margin: 5px 0 0 0;">${booking.passenger_name}</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #667eea; margin-top: 0;">Booking Details</h2>
                <p><strong>Route:</strong> ${sanitizeForPDF(route?.name || "N/A")}</p>
                <p><strong>From:</strong> ${from_stop} → <strong>To:</strong> ${to_stop}</p>
                <p><strong>Date:</strong> ${trip?.trip_date || "N/A"}</p>
                <p><strong>Departure:</strong> ${trip?.departure_time || "N/A"}</p>
                <p><strong>Seat:</strong> <strong style="color: #667eea; font-size: 18px;">Seat ${booking.seat_number}</strong></p>
                <p><strong>Fare:</strong> <strong style="color: #4caf50;">INR ${booking.total_amount}</strong></p>
                
                <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <h3 style="color: #667eea; margin-top: 0;">QR Code for Boarding</h3>
                  <img src="${qrDataUrl}" alt="QR Code" style="max-width: 200px; margin: 10px 0;" />
                  <p><a href="${ticket_url}" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">📄 Download PDF Ticket</a></p>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  <strong>⚠️ Important:</strong> Arrive 15 minutes before departure. Show this email or QR code at check-in.
                </p>
              </div>
            </div>
          `,
        });

        console.log("Email sent successfully");
      } catch (emailError) {
        console.error("Email failed (non-blocking):", emailError);
      }
    }

    console.log("Ticket generation completed successfully");

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