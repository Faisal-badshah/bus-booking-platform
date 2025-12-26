import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "https://esm.sh/resend@2.0.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

// QR Code generation using API (Deno-compatible)
async function generateQRCodePNG(text: string, size: number = 200): Promise<Uint8Array> {
  try {
    const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png`);
    if (!response.ok) throw new Error(`QR API returned ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

async function generateQRCodeDataURL(text: string, size: number = 300): Promise<string> {
  try {
    const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png`);
    if (!response.ok) throw new Error(`QR API returned ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('QR data URL generation failed:', error);
    throw error;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to sign QR payload
function signQRPayload(payload: any, secret: string): string {
  const data = JSON.stringify(payload);
  const hmac = createHmac("sha256", secret);
  hmac.update(data);
  const signature = hmac.digest("hex");
  return `${btoa(data)}.${signature}`;
}

// Helper function to log events
async function logEvent(supabase: any, data: any) {
  try {
    await supabase.from('booking_logs').insert({
      ...data,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log event:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabase: any = null;
  let booking: any = null;
  let booking_id = '';

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const qrSecret = Deno.env.get('QR_SIGNING_SECRET');
    const resendKey = Deno.env.get('RESEND_API_KEY');

    // Validate environment variables
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    if (!qrSecret) {
      throw new Error('Missing QR_SIGNING_SECRET');
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    booking_id = body.booking_id;

    console.log('Issuing ticket for booking:', booking_id);

    if (!booking_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'booking_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // STEP 1: Fetch booking details with trip and route info
    console.log('Fetching booking details...');
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        trip_id,
        seat_number,
        passenger_name,
        passenger_email,
        passenger_phone,
        total_amount,
        status,
        confirmed_at,
        payment_reference,
        booking_group_id,
        from_index,
        to_index,
        trips:trip_id (
          id,
          trip_date,
          departure_time,
          arrival_time,
          route_id,
          bus_id,
          routes:route_id (
            id,
            name,
            stops
          ),
          buses:bus_id (
            id,
            name
          )
        )
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !bookingData) {
      console.error('Booking not found:', bookingError);
      await logEvent(supabase, {
        booking_id,
        event_type: 'ticket_generation_failed',
        error: bookingError?.message || 'Booking not found'
      });
      return new Response(
        JSON.stringify({ success: false, message: 'Booking not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    booking = bookingData;

    if (booking.status !== 'confirmed') {
      console.warn('Booking status is not confirmed:', booking.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Only confirmed bookings can have tickets issued',
          current_status: booking.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Extract trip and route data
    const trip = Array.isArray(booking.trips) ? booking.trips[0] : booking.trips;
    if (!trip) {
      throw new Error('Trip data not found');
    }

    const route = Array.isArray(trip.routes) ? trip.routes[0] : trip.routes;
    const bus = Array.isArray(trip.buses) ? trip.buses[0] : trip.buses;
    const stops = route?.stops || [];
    
    const from_stop = stops[booking.from_index] || 'Unknown';
    const to_stop = stops[booking.to_index] || 'Unknown';

    console.log('Trip details:', { from_stop, to_stop, trip_date: trip.trip_date });

    // STEP 2: Generate signed QR payload
    const qrPayload = {
      booking_id: booking.id,
      trip_id: booking.trip_id,
      seat_number: booking.seat_number,
      passenger_name: booking.passenger_name,
      from_stop,
      to_stop,
      trip_date: trip.trip_date,
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const signedQR = signQRPayload(qrPayload, qrSecret);
    console.log('QR payload signed');

    // STEP 3: Generate PDF ticket
    console.log('Generating PDF ticket...');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { height } = page.getSize();
    let yPosition = height - 50;
    
    // Title
    page.drawText('BUS TICKET CONFIRMATION', {
      x: 150,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0, 0.4, 0.8),
    });
    
    yPosition -= 40;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 545, y: yPosition },
      thickness: 2,
      color: rgb(0, 0.4, 0.8),
    });
    
    yPosition -= 30;
    
    // Booking Information
    const addField = (label: string, value: string) => {
      page.drawText(label, {
        x: 50,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText(value, {
        x: 200,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    };
    
    addField('Booking ID:', booking.id.substring(0, 18) + '...');
    addField('Passenger Name:', booking.passenger_name);
    addField('Email:', booking.passenger_email);
    addField('Phone:', booking.passenger_phone);
    
    yPosition -= 10;
    page.drawText('JOURNEY DETAILS', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0.4, 0.8),
    });
    yPosition -= 25;
    
    addField('Route:', route?.name || 'N/A');
    addField('From:', from_stop);
    addField('To:', to_stop);
    addField('Date:', trip?.trip_date || 'N/A');
    addField('Departure Time:', trip?.departure_time || 'N/A');
    addField('Arrival Time:', trip?.arrival_time || 'N/A');
    addField('Bus:', bus?.name || 'N/A');
    addField('Seat Number:', `${booking.seat_number}`);
    addField('Fare:', `INR ${booking.total_amount}`);
    
    yPosition -= 10;
    page.drawText('PAYMENT DETAILS', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0.4, 0.8),
    });
    yPosition -= 25;
    
    addField('Payment Reference:', booking.payment_reference || 'Pay on Bus');
    addField('Confirmed At:', booking.confirmed_at ? new Date(booking.confirmed_at).toLocaleString() : 'N/A');
    
    yPosition -= 30;
    
    // QR Code section
    page.drawText('QR CODE FOR VERIFICATION', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0.4, 0.8),
    });
    yPosition -= 20;
    
    page.drawText('Scan this code at boarding for verification', {
      x: 50,
      y: yPosition,
      size: 9,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    yPosition -= 25;
    
    // Generate QR code as PNG
    console.log('Generating QR code PNG...');
    const qrImageBytes = await generateQRCodePNG(signedQR, 200);
    
    // Embed QR code image in PDF
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    const qrDims = qrImage.scale(0.8);
    
    page.drawImage(qrImage, {
      x: 50,
      y: yPosition - qrDims.height,
      width: qrDims.width,
      height: qrDims.height,
    });
    
    yPosition -= qrDims.height + 10;
    yPosition -= 20;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 545, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    yPosition -= 30;
    page.drawText('Please arrive at least 15 minutes before departure.', {
      x: 120,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    console.log('PDF generated, size:', pdfBytes.length, 'bytes');

    // STEP 4: Upload PDF to storage
    console.log('Uploading PDF to storage...');
    const ticketFileName = `${booking.user_id}/${booking_id}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('tickets')
      .upload(ticketFileName, new Blob([pdfBytes], { type: 'application/pdf' }), {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading ticket:', uploadError);
      await logEvent(supabase, {
        booking_id,
        booking_group_id: booking.booking_group_id,
        event_type: 'ticket_generation_failed',
        error: uploadError.message
      });
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log('PDF uploaded successfully:', uploadData);

    // STEP 5: Generate signed URL for the ticket
    console.log('Generating signed URL...');
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('tickets')
      .createSignedUrl(ticketFileName, 60 * 60 * 24 * 7); // 7 days

    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      throw new Error(`Signed URL creation failed: ${urlError.message}`);
    }

    const ticket_url = urlData?.signedUrl || '';
    console.log('Signed URL created');

    // STEP 6: Update booking with ticket URL
    console.log('Updating booking with ticket URL...');
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ ticket_url })
      .eq('id', booking_id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw new Error(`Booking update failed: ${updateError.message}`);
    }

    // STEP 7: Send email with ticket
    if (resendKey) {
      console.log('Sending email with ticket...');
      try {
        const resend = new Resend(resendKey);
        
        // Generate QR code as data URL for email
        const qrCodeEmailDataUrl = await generateQRCodeDataURL(signedQR, 300);

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'Bus Booking <onboarding@resend.dev>',
          to: [booking.passenger_email],
          subject: `🎫 Your Bus Ticket - ${route?.name || 'Booking'} (${trip?.trip_date})`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { background: white; border-radius: 12px; overflow: hidden; max-width: 600px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
                .content { padding: 30px; }
                .info-section { margin-bottom: 30px; }
                .info-section h2 { color: #667eea; font-size: 18px; margin: 0 0 15px 0; }
                .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
                .info-label { font-weight: 600; color: #666; min-width: 140px; }
                .info-value { color: #333; flex: 1; }
                .qr-section { background: #f8f9ff; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0; }
                .qr-code-image { max-width: 250px; margin: 0 auto 20px; padding: 20px; background: white; border-radius: 8px; }
                .download-button { display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; }
                .important-note { background: #fff4e6; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎫 Your Ticket is Ready!</h1>
                  <p>Booking confirmed for ${booking.passenger_name}</p>
                </div>
                <div class="content">
                  <p>Dear <strong>${booking.passenger_name}</strong>,</p>
                  <p>Your bus ticket has been confirmed! Please find your journey details below.</p>
                  
                  <div class="info-section">
                    <h2>📋 Booking Details</h2>
                    <div class="info-row"><span class="info-label">Booking ID:</span><span class="info-value">${booking.id.substring(0, 20)}...</span></div>
                    <div class="info-row"><span class="info-label">Passenger:</span><span class="info-value">${booking.passenger_name}</span></div>
                    <div class="info-row"><span class="info-label">Seat:</span><span class="info-value"><strong style="color: #667eea; font-size: 18px;">Seat ${booking.seat_number}</strong></span></div>
                    <div class="info-row"><span class="info-label">Fare:</span><span class="info-value"><strong style="color: #4caf50;">INR ${booking.total_amount}</strong></span></div>
                  </div>

                  <div class="info-section">
                    <h2>🚌 Journey Details</h2>
                    <div class="info-row"><span class="info-label">Route:</span><span class="info-value">${route?.name || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">From:</span><span class="info-value">${from_stop}</span></div>
                    <div class="info-row"><span class="info-label">To:</span><span class="info-value">${to_stop}</span></div>
                    <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${trip?.trip_date || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Departure:</span><span class="info-value">${trip?.departure_time || 'N/A'}</span></div>
                    <div class="info-row"><span class="info-label">Bus:</span><span class="info-value">${bus?.name || 'N/A'}</span></div>
                  </div>

                  <div class="qr-section">
                    <h3>🔍 QR Code for Boarding</h3>
                    <p>Show this QR code to the driver when boarding</p>
                    <div class="qr-code-image">
                      <img src="${qrCodeEmailDataUrl}" alt="Ticket QR Code" style="width: 100%; height: auto;" />
                    </div>
                    <a href="${ticket_url}" class="download-button">📄 Download Full Ticket (PDF)</a>
                  </div>

                  <div class="important-note">
                    <strong>⚠️ Important Information:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                      <li>Please arrive at least 15 minutes before departure</li>
                      <li>Keep this email handy for quick boarding verification</li>
                      <li>Your QR code is unique - do not share it with others</li>
                    </ul>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (emailError) {
          console.error('Email send error:', emailError);
          await logEvent(supabase, {
            booking_id,
            booking_group_id: booking.booking_group_id,
            event_type: 'email_send_failed',
            error: emailError.message
          });
        } else {
          console.log('Email sent successfully:', emailData);
          await logEvent(supabase, {
            booking_id,
            booking_group_id: booking.booking_group_id,
            event_type: 'email_sent',
            metadata: { ticket_url }
          });
        }
      } catch (emailError) {
        console.error('Email sending exception:', emailError);
        await logEvent(supabase, {
          booking_id,
          booking_group_id: booking.booking_group_id,
          event_type: 'email_send_error',
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    } else {
      console.warn('RESEND_API_KEY not configured - skipping email');
    }

    await logEvent(supabase, {
      booking_id,
      booking_group_id: booking.booking_group_id,
      event_type: 'ticket_issued',
      metadata: { ticket_url }
    });

    console.log('Ticket issue completed successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        booking_id,
        ticket_url,
        qr_data: signedQR,
        message: 'Ticket issued successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in issueTicket:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    if (supabase && booking_id) {
      try {
        await logEvent(supabase, {
          booking_id,
          event_type: 'ticket_issue_error',
          error: message
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message,
        details: 'Check Supabase logs for more information'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});