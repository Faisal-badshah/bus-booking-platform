import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "https://esm.sh/resend@2.0.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

// QR Code generation using API (Deno-compatible)
async function generateQRCodePNG(text: string, size: number = 200): Promise<Uint8Array> {
  const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png`);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function generateQRCodeDataURL(text: string, size: number = 300): Promise<string> {
  const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png`);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return `data:image/png;base64,${base64}`;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  await supabase.from('booking_logs').insert(data);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const qrSecret = Deno.env.get('QR_SIGNING_SECRET')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { booking_id } = await req.json();

    console.log('Issuing ticket for booking:', booking_id);

    if (!booking_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'booking_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // STEP 1: Fetch booking details with trip and route info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        trips:trip_id (
          trip_date,
          departure_time,
          arrival_time,
          routes:route_id (
            name,
            stops
          ),
          buses:bus_id (
            name
          )
        )
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      await logEvent(supabase, {
        booking_id,
        event_type: 'ticket_generation_failed',
        metadata: { reason: 'booking_not_found' }
      });
      return new Response(
        JSON.stringify({ success: false, message: 'Booking not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (booking.status !== 'confirmed') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Only confirmed bookings can have tickets issued' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const trip = Array.isArray(booking.trips) ? booking.trips[0] : booking.trips;
    const route = trip?.routes ? (Array.isArray(trip.routes) ? trip.routes[0] : trip.routes) : null;
    const bus = trip?.buses ? (Array.isArray(trip.buses) ? trip.buses[0] : trip.buses) : null;
    const stops = route?.stops || [];
    
    const from_stop = stops[booking.from_index] || 'Unknown';
    const to_stop = stops[booking.to_index] || 'Unknown';

    // STEP 2: Generate signed QR payload
    const qrPayload = {
      booking_id: booking.id,
      trip_id: booking.trip_id,
      seat_number: booking.seat_number,
      passenger_name: booking.passenger_name,
      from_stop,
      to_stop,
      trip_date: trip?.trip_date,
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    const signedQR = signQRPayload(qrPayload, qrSecret);

    // STEP 3: Generate PDF ticket
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
    
    addField('Payment Reference:', booking.payment_reference || 'N/A');
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
    
    // Generate QR code as PNG (Deno-compatible using API)
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

    // STEP 4: Upload PDF to storage
    const ticketFileName = `${booking.user_id}/${booking_id}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('tickets')
      .upload(ticketFileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading ticket:', uploadError);
      await logEvent(supabase, {
        booking_id,
        booking_group_id: booking.booking_group_id,
        event_type: 'ticket_generation_failed',
        metadata: { reason: 'upload_error', error: uploadError.message }
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error uploading ticket',
          error: uploadError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // STEP 5: Generate signed URL for the ticket
    const { data: urlData } = await supabase
      .storage
      .from('tickets')
      .createSignedUrl(ticketFileName, 60 * 60 * 24 * 7); // 7 days

    const ticket_url = urlData?.signedUrl || '';

    // STEP 6: Update booking with ticket URL
    await supabase
      .from('bookings')
      .update({ ticket_url })
      .eq('id', booking_id);

    // STEP 7: Send email with ticket (with retry logic)
    // STEP 7: Send email with ticket (with retry logic)
    const sendEmailWithRetry = async (retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`Email attempt ${attempt}/${retries} for booking ${booking_id}`);
          
          // Generate QR code as data URL for email (Deno-compatible using API)
          const qrCodeEmailDataUrl = await generateQRCodeDataURL(signedQR, 300);

          const emailResult = await resend.emails.send({
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
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                  }
                  .container {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  }
                  .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                  }
                  .header h1 {
                    margin: 0 0 10px 0;
                    font-size: 28px;
                    font-weight: 700;
                  }
                  .header p {
                    margin: 0;
                    font-size: 16px;
                    opacity: 0.9;
                  }
                  .content {
                    padding: 30px;
                  }
                  .info-section {
                    margin-bottom: 30px;
                  }
                  .info-section h2 {
                    color: #667eea;
                    font-size: 18px;
                    margin: 0 0 15px 0;
                    font-weight: 600;
                  }
                  .info-row {
                    display: flex;
                    padding: 12px 0;
                    border-bottom: 1px solid #f0f0f0;
                  }
                  .info-row:last-child {
                    border-bottom: none;
                  }
                  .info-label {
                    font-weight: 600;
                    color: #666;
                    min-width: 140px;
                  }
                  .info-value {
                    color: #333;
                    flex: 1;
                  }
                  .ticket-badge {
                    background: #667eea;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    display: inline-block;
                    font-weight: 600;
                    font-size: 14px;
                  }
                  .qr-section {
                    background: #f8f9ff;
                    padding: 30px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 30px 0;
                  }
                  .qr-section h3 {
                    color: #667eea;
                    margin: 0 0 15px 0;
                    font-size: 18px;
                  }
                  .qr-section p {
                    color: #666;
                    margin: 0 0 20px 0;
                    font-size: 14px;
                  }
                  .qr-code-image {
                    max-width: 250px;
                    margin: 0 auto 20px;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                  }
                  .download-button {
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 14px 32px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    margin: 10px 0;
                    transition: background 0.3s;
                  }
                  .download-button:hover {
                    background: #5568d3;
                  }
                  .important-note {
                    background: #fff4e6;
                    border-left: 4px solid #ff9800;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                  }
                  .important-note strong {
                    color: #ff9800;
                    display: block;
                    margin-bottom: 5px;
                  }
                  .footer {
                    text-align: center;
                    padding: 20px 30px;
                    background: #f8f9fa;
                    color: #666;
                    font-size: 13px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎫 Your Ticket is Ready!</h1>
                    <p>Booking confirmed for ${booking.passenger_name}</p>
                  </div>
                  
                  <div class="content">
                    <p style="font-size: 16px; margin-bottom: 20px;">
                      Dear <strong>${booking.passenger_name}</strong>,
                    </p>
                    <p style="margin-bottom: 20px;">
                      Your bus ticket has been confirmed! Please find your journey details below.
                    </p>
                    
                    <div class="info-section">
                      <h2>📋 Booking Details</h2>
                      <div class="info-row">
                        <span class="info-label">Booking ID:</span>
                        <span class="info-value">${booking.id.substring(0, 20)}...</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Passenger:</span>
                        <span class="info-value">${booking.passenger_name}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${booking.passenger_email}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${booking.passenger_phone}</span>
                      </div>
                    </div>

                    <div class="info-section">
                      <h2>🚌 Journey Details</h2>
                      <div class="info-row">
                        <span class="info-label">Route:</span>
                        <span class="info-value"><span class="ticket-badge">${route?.name || 'N/A'}</span></span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">From:</span>
                        <span class="info-value">${from_stop}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">To:</span>
                        <span class="info-value">${to_stop}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Date:</span>
                        <span class="info-value">${trip?.trip_date || 'N/A'}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Departure:</span>
                        <span class="info-value">${trip?.departure_time || 'N/A'}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Arrival:</span>
                        <span class="info-value">${trip?.arrival_time || 'N/A'}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Bus:</span>
                        <span class="info-value">${bus?.name || 'N/A'}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Seat Number:</span>
                        <span class="info-value"><strong style="color: #667eea; font-size: 18px;">Seat ${booking.seat_number}</strong></span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Fare:</span>
                        <span class="info-value"><strong style="color: #4caf50; font-size: 18px;">INR ${booking.total_amount}</strong></span>
                      </div>
                    </div>

                    <div class="qr-section">
                      <h3>🔍 QR Code for Boarding</h3>
                      <p>Show this QR code to the driver when boarding</p>
                      <div class="qr-code-image">
                        <img src="${qrCodeEmailDataUrl}" alt="Ticket QR Code" style="width: 100%; height: auto; display: block;" />
                      </div>
                      <a href="${ticket_url}" class="download-button">📄 Download Full Ticket (PDF)</a>
                    </div>

                    <div class="important-note">
                      <strong>⚠️ Important Information:</strong>
                      <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Please arrive at least 15 minutes before departure</li>
                        <li>Keep this email handy for quick boarding verification</li>
                        <li>Your QR code is unique - do not share it with others</li>
                        <li>Download the PDF ticket for offline access</li>
                      </ul>
                    </div>

                    <p style="margin-top: 30px; color: #666;">
                      Have a safe and pleasant journey! 🚌✨
                    </p>
                  </div>

                  <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>© ${new Date().getFullYear()} Bus Booking Service. All rights reserved.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          
          console.log(`Email sent successfully on attempt ${attempt}:`, emailResult);
          
          await logEvent(supabase, {
            booking_id,
            booking_group_id: booking.booking_group_id,
            event_type: 'email_sent',
            metadata: { 
              ticket_url,
              attempt
            }
          });
          
          return true; // Success
        } catch (emailError) {
          console.error(`Email attempt ${attempt} failed:`, emailError);
          const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
          
          if (attempt === retries) {
            // Final attempt failed
            await logEvent(supabase, {
              booking_id,
              booking_group_id: booking.booking_group_id,
              event_type: 'email_send_failed',
              metadata: { 
                error: errorMessage,
                attempts: retries
              }
            });
            throw emailError;
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
      return false;
    };

    try {
      await sendEmailWithRetry(3);
      console.log('Ticket issued and emailed successfully:', booking_id);
    } catch (emailError) {
      console.error('All email attempts failed, trying SMS fallback:', emailError);
      
      // SMS FALLBACK: Try sending ticket link via SMS
      try {
        const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
        
        if (twilioSid && twilioToken && twilioPhone && booking.passenger_phone) {
          console.log('Sending SMS fallback to:', booking.passenger_phone);
          
          const smsBody = `Your bus ticket is ready!\n\nBooking: ${booking.id.substring(0, 8)}\nRoute: ${route?.name || 'N/A'}\nDate: ${trip?.trip_date}\nSeat: ${booking.seat_number}\n\nDownload ticket: ${ticket_url}\n\nSafe travels!`;
          
          const smsResponse = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: booking.passenger_phone,
                From: twilioPhone,
                Body: smsBody,
              }),
            }
          );
          
          if (smsResponse.ok) {
            console.log('SMS sent successfully as fallback');
            await logEvent(supabase, {
              booking_id,
              booking_group_id: booking.booking_group_id,
              event_type: 'sms_fallback_sent',
              metadata: { 
                ticket_url,
                phone: booking.passenger_phone,
                reason: 'email_failed'
              }
            });
          } else {
            const smsError = await smsResponse.text();
            console.error('SMS fallback failed:', smsError);
            await logEvent(supabase, {
              booking_id,
              booking_group_id: booking.booking_group_id,
              event_type: 'sms_fallback_failed',
              metadata: { 
                error: smsError
              }
            });
          }
        } else {
          console.log('SMS fallback not configured or phone number missing');
        }
      } catch (smsError) {
        console.error('SMS fallback error:', smsError);
        await logEvent(supabase, {
          booking_id,
          booking_group_id: booking.booking_group_id,
          event_type: 'sms_fallback_error',
          metadata: { 
            error: smsError instanceof Error ? smsError.message : 'Unknown error'
          }
        });
      }
    }

    await logEvent(supabase, {
      booking_id,
      booking_group_id: booking.booking_group_id,
      event_type: 'ticket_issued',
      metadata: { ticket_url }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking_id,
        ticket_url,
        qr_data: signedQR,
        message: 'Ticket issued and emailed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in issueTicket:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ success: false, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
