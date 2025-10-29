import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RebookingRequestPayload {
  rebooking_request_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const appDomain = Deno.env.get("APP_DOMAIN") || "janiechiro.com";

    console.log("📧 Send Rebooking Email - Configuration:");
    console.log("- RESEND_API_KEY exists:", !!resendApiKey);
    console.log("- APP_DOMAIN:", appDomain);

    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY is not configured!");
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY not configured",
          message: "Please add RESEND_API_KEY secret in Supabase Dashboard",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: RebookingRequestPayload = await req.json();
    const { rebooking_request_id } = payload;

    // Get rebooking request details
    const { data: rebookingRequest, error: requestError } = await supabase
      .from("rebooking_requests")
      .select("*")
      .eq("id", rebooking_request_id)
      .maybeSingle();

    if (requestError || !rebookingRequest) {
      console.error("❌ Rebooking request not found:", rebooking_request_id);
      return new Response(
        JSON.stringify({
          error: "Rebooking request not found",
          rebooking_request_id,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already sent
    if (rebookingRequest.status === "sent" || rebookingRequest.sent_at) {
      console.log("⏭️ Rebooking email already sent, skipping:", rebooking_request_id);
      return new Response(
        JSON.stringify({
          message: "Rebooking email already sent",
          rebooking_request_id,
          sent_at: rebookingRequest.sent_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get time slots
    const { data: timeSlots, error: slotsError } = await supabase
      .from("rebooking_time_slots")
      .select("*")
      .eq("rebooking_request_id", rebooking_request_id)
      .eq("is_available", true)
      .order("display_order", { ascending: true });

    if (slotsError || !timeSlots || timeSlots.length === 0) {
      console.error("❌ No available time slots found");
      return new Response(
        JSON.stringify({
          error: "No available time slots",
          rebooking_request_id,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create response token
    const responseToken = crypto.randomUUID() + "-" + rebooking_request_id.substring(0, 8);

    // Create response record
    const { data: response, error: responseError } = await supabase
      .from("rebooking_responses")
      .insert({
        rebooking_request_id,
        response_token: responseToken,
      })
      .select()
      .maybeSingle();

    if (responseError || !response) {
      console.error("❌ Error creating response record:", responseError);
      throw new Error("Failed to create response record");
    }

    // Format time slots for email
    const formattedSlots = timeSlots.map((slot, index) => {
      const date = new Date(slot.slot_datetime);
      return {
        id: slot.id,
        number: index + 1,
        date: date.toLocaleDateString("fr-CA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: slot.slot_time,
        duration: slot.duration_minutes,
        acceptUrl: `https://${appDomain}/rebook/${responseToken}?slot=${slot.id}&action=accept`,
      };
    });

    const declineUrl = `https://${appDomain}/rebook/${responseToken}?action=decline`;
    const requestCallbackUrl = `https://${appDomain}/rebook/${responseToken}?action=callback`;

    // Get expiration info
    const expiresAt = new Date(rebookingRequest.expires_at);
    const hoursUntilExpiry = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));

    // Generate email
    const emailSubject = "🔄 Reprenons rendez-vous ensemble";
    const emailHtml = generateRebookingEmailHtml({
      patientName: rebookingRequest.patient_name,
      reason: rebookingRequest.reason,
      reasonCategory: rebookingRequest.reason_category,
      timeSlots: formattedSlots,
      declineUrl,
      requestCallbackUrl,
      expiresIn: `${hoursUntilExpiry} heures`,
    });

    const emailPayload = {
      from: `Clinique Chiropratique Dre Janie Leblanc <info@janiechiro.com>`,
      to: [rebookingRequest.patient_email],
      subject: emailSubject,
      html: emailHtml,
    };

    console.log(`📧 Sending rebooking email via Resend:`);
    console.log(`- From: ${emailPayload.from}`);
    console.log(`- To: ${emailPayload.to[0]}`);
    console.log(`- Subject: ${emailPayload.subject}`);
    console.log(`- Time slots: ${formattedSlots.length}`);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await resendResponse.text();
    console.log(`📨 Resend API Response Status: ${resendResponse.status}`);
    console.log(`📨 Resend API Response Body: ${responseText}`);

    if (!resendResponse.ok) {
      console.error("❌ Resend API error:", responseText);
      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: responseText,
          status: resendResponse.status,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendData = JSON.parse(responseText);
    console.log(`✅ Email sent successfully! Resend ID: ${resendData.id}`);

    // Update rebooking request
    await supabase
      .from("rebooking_requests")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", rebooking_request_id);

    // Update appointment
    await supabase
      .from("appointments")
      .update({
        last_rebooking_sent_at: new Date().toISOString(),
      })
      .eq("id", rebookingRequest.appointment_id);

    // Record notification
    await supabase.from("rebooking_notifications").insert({
      rebooking_request_id,
      response_id: response.id,
      notification_type: "initial_request",
      channel: "email",
      recipient_email: rebookingRequest.patient_email,
      subject: emailSubject,
      sent_at: new Date().toISOString(),
      provider_id: resendData.id,
      provider_name: "resend",
      metadata: { time_slots_count: formattedSlots.length },
    });

    console.log(`✅ Rebooking process completed for request ${rebooking_request_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        rebooking_request_id,
        response_token: responseToken,
        resend_id: resendData.id,
        time_slots_sent: formattedSlots.length,
        recipient: rebookingRequest.patient_email,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Critical error in send-rebooking-email:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        type: error.name,
        timestamp: new Date().toISOString(),
        details: "Check Edge Function logs for full error details",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateRebookingEmailHtml(props: {
  patientName: string;
  reason: string;
  reasonCategory: string;
  timeSlots: Array<{
    id: string;
    number: number;
    date: string;
    time: string;
    duration: number;
    acceptUrl: string;
  }>;
  declineUrl: string;
  requestCallbackUrl: string;
  expiresIn: string;
}): string {
  const reasonMessages: Record<string, { emoji: string; text: string }> = {
    patient_cancel: {
      emoji: "📅",
      text: "Suite à votre demande d'annulation, nous aimerions vous proposer de nouveaux créneaux.",
    },
    patient_no_show: {
      emoji: "⏰",
      text: "Nous avons remarqué que vous n'avez pas pu vous présenter à votre dernier rendez-vous.",
    },
    clinic_reschedule: {
      emoji: "🔄",
      text: "Nous devons malheureusement reprogrammer votre rendez-vous.",
    },
    emergency: {
      emoji: "🚨",
      text: "En raison d'une situation imprévue, nous devons reprogrammer votre rendez-vous.",
    },
    other: {
      emoji: "📋",
      text: "Nous aimerions reprogrammer votre rendez-vous.",
    },
  };

  const reasonInfo = reasonMessages[props.reasonCategory] || reasonMessages.other;

  const slotsHtml = props.timeSlots
    .map(
      (slot) => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e9ecef;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 40px; text-align: center; vertical-align: middle;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #d4af37 0%, #c5a028 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">${slot.number}</div>
            </td>
            <td style="padding-left: 15px; vertical-align: middle;">
              <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 4px;">${slot.date}</div>
              <div style="font-size: 14px; color: #666;">
                <span style="font-weight: 600; color: #d4af37;">${slot.time}</span> · ${slot.duration} minutes
              </div>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <a href="${slot.acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">Choisir</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <div style="font-size: 48px; margin-bottom: 15px;">${reasonInfo.emoji}</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Reprenons rendez-vous</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">Bonjour <strong>${props.patientName}</strong>,</p>

              <p style="margin: 0 0 30px 0; color: #555; font-size: 16px; line-height: 1.6;">
                ${reasonInfo.text}
              </p>

              ${props.reason ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                      <strong>Note:</strong> ${props.reason}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; font-weight: 600;">
                Voici les créneaux disponibles:
              </p>

              <!-- Time Slots -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #e9ecef; border-radius: 8px; margin-bottom: 30px; overflow: hidden;">
                ${slotsHtml}
              </table>

              <!-- Urgency Banner -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                      ⏰ <strong>Cette proposition expire dans ${props.expiresIn}</strong><br>
                      Merci de nous répondre rapidement pour garantir votre place.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Alternative Actions -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 15px;">
                    <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">Aucun de ces créneaux ne vous convient?</p>
                    <a href="${props.requestCallbackUrl}" style="display: inline-block; color: #0066cc; text-decoration: none; padding: 10px 20px; border: 2px solid #0066cc; border-radius: 8px; font-size: 14px; font-weight: 500; margin-right: 10px;">
                      📞 Demander un rappel
                    </a>
                    <a href="${props.declineUrl}" style="display: inline-block; color: #6c757d; text-decoration: none; padding: 10px 20px; border: 2px solid #dee2e6; border-radius: 8px; font-size: 14px;">
                      Annuler définitivement
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 5px 0; color: #333; font-size: 14px; font-weight: 500;">Clinique Chiropratique Dre Janie Leblanc</p>
              <p style="margin: 0; color: #6c757d; font-size: 12px;">Pour toute question, contactez-nous</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
