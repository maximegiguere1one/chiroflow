import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SlotOfferPayload {
  slot_offer_id: string;
  slot_datetime: string;
  appointment_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendDomain = Deno.env.get("RESEND_DOMAIN") || "example.com";
    const appDomain = Deno.env.get("APP_DOMAIN") || supabaseUrl.replace("https://", "").split(".")[0] + ".com";

    console.log("📧 Process Cancellation - Configuration:");
    console.log("- RESEND_API_KEY exists:", !!resendApiKey);
    console.log("- RESEND_DOMAIN:", resendDomain);
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

    const payload: SlotOfferPayload = await req.json();
    const { slot_offer_id, slot_datetime } = payload;

    const { data: existingSlot, error: slotCheckError } = await supabase
      .from("appointment_slot_offers")
      .select("*")
      .eq("id", slot_offer_id)
      .single();

    if (slotCheckError || !existingSlot) {
      console.error("❌ Slot offer not found:", slot_offer_id);
      return new Response(
        JSON.stringify({
          error: "Slot offer not found",
          slot_offer_id,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingSlot.status === "claimed") {
      console.log("⏭️ Slot already claimed, skipping:", slot_offer_id);
      return new Response(
        JSON.stringify({
          message: "Slot already claimed",
          slot_offer_id,
          status: existingSlot.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingSlot.invitation_count > 0 && existingSlot.status === "pending") {
      console.log("⏭️ Slot already processed with invitations, skipping:", slot_offer_id);
      return new Response(
        JSON.stringify({
          message: "Slot already processed",
          slot_offer_id,
          invitation_count: existingSlot.invitation_count,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const slotDate = new Date(slot_datetime);
    const dayOfWeek = slotDate.getDay();

    const { data: candidates, error: candidatesError } = await supabase.rpc(
      "get_eligible_waitlist_candidates",
      {
        p_slot_datetime: slot_datetime,
        p_slot_day_of_week: dayOfWeek,
        p_max_candidates: 5,
      }
    );

    if (candidatesError) {
      console.error("Error fetching candidates:", candidatesError);
      throw candidatesError;
    }

    if (!candidates || candidates.length === 0) {
      console.log("⚠️ No eligible candidates found for slot", slot_offer_id);
      return new Response(
        JSON.stringify({
          message: "No eligible candidates",
          candidates: 0,
          slot_offer_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Found ${candidates.length} eligible candidates for slot ${slot_offer_id}`);

    const invitations = [];
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    for (const candidate of candidates) {
      const responseToken = crypto.randomUUID() + "-" + candidate.waitlist_id.substring(0, 8);

      const { data: invitation, error: inviteError } = await supabase
        .from("slot_offer_invitations")
        .insert({
          slot_offer_id,
          waitlist_entry_id: candidate.waitlist_id,
          response_token: responseToken,
          expires_at: expiresAt.toISOString(),
          status: "pending",
          notification_channel: "email",
        })
        .select()
        .single();

      if (inviteError) {
        console.error("Error creating invitation:", inviteError);
        continue;
      }

      const { data: slotOffer } = await supabase
        .from("appointment_slot_offers")
        .select("*")
        .eq("id", slot_offer_id)
        .single();

      if (slotOffer) {
        const formattedDate = new Date(slotOffer.slot_datetime).toLocaleDateString("fr-CA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const formattedTime = slotOffer.slot_time;

        const acceptUrl = `https://${appDomain}/invitation/${responseToken}?action=accept`;
        const declineUrl = `https://${appDomain}/invitation/${responseToken}?action=decline`;

        console.log(`📤 Preparing email for ${candidate.email}:`);
        console.log("- Accept URL:", acceptUrl);
        console.log("- Decline URL:", declineUrl);

        if (resendApiKey) {
          try {
            const emailSubject = "🎯 Un créneau vient de se libérer pour vous!";
            const emailHtml = generateInvitationEmailHtml({
              patientName: candidate.name,
              slotDate: formattedDate,
              slotTime: formattedTime,
              duration: slotOffer.duration_minutes,
              acceptUrl,
              declineUrl,
              expiresIn: "24 heures",
            });

            const emailPayload = {
              from: `Clinique Chiropratique Dre Janie Leblanc <info@janiechiro.com>`,
              to: [candidate.email],
              subject: emailSubject,
              html: emailHtml,
            };

            console.log(`📧 Sending email via Resend:`);
            console.log(`- From: ${emailPayload.from}`);
            console.log(`- To: ${emailPayload.to[0]}`);
            console.log(`- Subject: ${emailPayload.subject}`);

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
              console.error("Status code:", resendResponse.status);
              console.error("Possible issues:");
              console.error("- Domain not verified in Resend dashboard");
              console.error("- API key invalid or expired");
              console.error("- Email address invalid");
            } else {
              const resendData = JSON.parse(responseText);
              console.log(`✅ Email sent successfully! Resend ID: ${resendData.id}`);

              await supabase.from("waitlist_notifications").insert({
                waitlist_entry_id: candidate.waitlist_id,
                invitation_id: invitation.id,
                notification_type: "invitation",
                channel: "email",
                recipient_email: candidate.email,
                subject: emailSubject,
                sent_at: new Date().toISOString(),
                metadata: { resend_id: resendData.id },
              });

              await supabase
                .from("waitlist")
                .update({
                  invitation_count: candidate.invitation_count ? candidate.invitation_count + 1 : 1,
                  last_invitation_sent_at: new Date().toISOString(),
                })
                .eq("id", candidate.waitlist_id);
            }
          } catch (emailError) {
            console.error("❌ Exception while sending email:", emailError);
            console.error("Error details:", {
              message: emailError.message,
              stack: emailError.stack,
              name: emailError.name,
            });
          }
        } else {
          console.warn("⚠️ Skipping email send - RESEND_API_KEY not configured");
        }

        invitations.push({
          candidate: candidate.name,
          email: candidate.email,
          token: responseToken,
        });
      }
    }

    await supabase
      .from("appointment_slot_offers")
      .update({
        invitation_count: invitations.length,
        status: "pending",
      })
      .eq("id", slot_offer_id);

    console.log(`✅ Process completed: ${invitations.length} invitation(s) sent for slot ${slot_offer_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        slot_offer_id,
        invitations_sent: invitations.length,
        invitations,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Critical error in process-cancellation:", error);
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

function generateInvitationEmailHtml(props: {
  patientName: string;
  slotDate: string;
  slotTime: string;
  duration: number;
  acceptUrl: string;
  declineUrl: string;
  expiresIn: string;
}): string {
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
          <tr>
            <td style="background: linear-gradient(135deg, #d4af37 0%, #c5a028 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Bonne nouvelle!</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px;">Un rendez-vous vient de se libérer</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">Bonjour <strong>${props.patientName}</strong>,</p>
              <p style="margin: 0 0 30px 0; color: #555; font-size: 16px; line-height: 1.6;">Un client vient d'annuler son rendez-vous et nous avons pensé à vous!</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%); border-radius: 8px; margin-bottom: 30px; border: 2px solid #d4af37;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <div style="font-size: 32px; margin-bottom: 15px;">📅</div>
                    <div style="font-size: 24px; font-weight: 600; color: #333; margin-bottom: 8px;">${props.slotDate}</div>
                    <div style="font-size: 28px; font-weight: 700; color: #d4af37; margin-bottom: 8px;">${props.slotTime}</div>
                    <div style="font-size: 14px; color: #666;">Durée: ${props.duration} minutes</div>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">⏰ <strong>Cette invitation expire dans ${props.expiresIn}</strong><br>Premier arrivé, premier servi!</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <a href="${props.acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-size: 18px; font-weight: 600;">✅ Oui, je prends ce rendez-vous!</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${props.declineUrl}" style="display: inline-block; color: #6c757d; text-decoration: none; padding: 12px 30px; border: 2px solid #dee2e6; border-radius: 8px; font-size: 14px;">Non merci, je ne peux pas</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6c757d; font-size: 12px;">Clinique Chiropratique</p>
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