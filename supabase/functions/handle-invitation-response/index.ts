import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ResponsePayload {
  token: string;
  action: "accept" | "decline";
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

    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: ResponsePayload = await req.json();
    const { token, action } = payload;

    if (!token || !action) {
      return new Response(
        JSON.stringify({ error: "Token and action are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: invitation, error: invitationError } = await supabase
      .from("slot_offer_invitations")
      .select(`
        *,
        slot_offer:appointment_slot_offers(*),
        waitlist_entry:waitlist(*)
      `)
      .eq("response_token", token)
      .single();

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invitation invalide ou introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (invitation.status !== "pending") {
      return new Response(
        JSON.stringify({
          error: "Cette invitation a déjà été traitée",
          status: invitation.status,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from("slot_offer_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return new Response(
        JSON.stringify({ error: "Cette invitation a expiré" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "decline") {
      await supabase
        .from("slot_offer_invitations")
        .update({
          status: "declined",
          response_type: "declined",
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Merci de votre réponse. Vous restez sur la liste de rappel.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "accept") {
      const slotOffer = invitation.slot_offer;

      if (slotOffer.status !== "available" && slotOffer.status !== "pending") {
        return new Response(
          JSON.stringify({
            error: "Désolé, ce créneau a déjà été pris par quelqu'un d'autre.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: appointmentError } = await supabase.from("appointments").insert({
        patient_id: null,
        name: invitation.waitlist_entry.name,
        email: invitation.waitlist_entry.email,
        phone: invitation.waitlist_entry.phone,
        reason: invitation.waitlist_entry.reason || "Consultation",
        scheduled_date: slotOffer.slot_date,
        scheduled_time: slotOffer.slot_time,
        duration_minutes: slotOffer.duration_minutes,
        status: "confirmed",
        notes: `Créé automatiquement depuis la liste de rappel. Token: ${token.substring(0, 8)}`,
      });

      if (appointmentError) {
        console.error("Error creating appointment:", appointmentError);
        throw appointmentError;
      }

      await supabase
        .from("slot_offer_invitations")
        .update({
          status: "accepted",
          response_type: "accepted",
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      await supabase
        .from("appointment_slot_offers")
        .update({
          status: "claimed",
          claimed_by: invitation.waitlist_entry_id,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", invitation.slot_offer_id);

      await supabase
        .from("slot_offer_invitations")
        .update({ status: "cancelled" })
        .eq("slot_offer_id", invitation.slot_offer_id)
        .neq("id", invitation.id)
        .eq("status", "pending");

      await supabase
        .from("waitlist")
        .update({ status: "scheduled" })
        .eq("id", invitation.waitlist_entry_id);

      if (resendApiKey) {
        try {
          const formattedDate = new Date(slotOffer.slot_datetime).toLocaleDateString("fr-CA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const emailSubject = "✅ Votre rendez-vous est confirmé!";
          const emailHtml = generateConfirmationEmailHtml({
            patientName: invitation.waitlist_entry.name,
            appointmentDate: formattedDate,
            appointmentTime: slotOffer.slot_time,
            duration: slotOffer.duration_minutes,
            address: "123 Rue Principale, Ville, QC",
          });

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: `Clinique Chiropratique Dre Janie Leblanc <info@janiechiro.com>`,
              to: [invitation.waitlist_entry.email],
              subject: emailSubject,
              html: emailHtml,
            }),
          });

          await supabase.from("waitlist_notifications").insert({
            waitlist_entry_id: invitation.waitlist_entry_id,
            invitation_id: invitation.id,
            notification_type: "confirmation",
            channel: "email",
            recipient_email: invitation.waitlist_entry.email,
            subject: emailSubject,
            sent_at: new Date().toISOString(),
          });
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Rendez-vous confirmé! Vous allez recevoir un email de confirmation.",
          appointment: {
            date: slotOffer.slot_date,
            time: slotOffer.slot_time,
            duration: slotOffer.duration_minutes,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Action invalide" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in handle-invitation-response:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateConfirmationEmailHtml(props: {
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  address: string;
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
            <td style="background: linear-gradient(135deg, #28a745 0%, #218838 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <div style="font-size: 64px; margin-bottom: 15px;">✅</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Rendez-vous confirmé!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">Bonjour <strong>${props.patientName}</strong>,</p>
              <p style="margin: 0 0 30px 0; color: #555; font-size: 16px; line-height: 1.6;">Excellent! Votre rendez-vous est maintenant confirmé. Nous avons hâte de vous voir!</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <div style="padding: 10px 0;">
                      <span style="font-size: 14px; color: #6c757d;">📅 Date</span><br>
                      <span style="font-size: 18px; font-weight: 600; color: #333;">${props.appointmentDate}</span>
                    </div>
                    <div style="padding: 10px 0; border-top: 1px solid #dee2e6;">
                      <span style="font-size: 14px; color: #6c757d;">🕐 Heure</span><br>
                      <span style="font-size: 18px; font-weight: 600; color: #333;">${props.appointmentTime}</span>
                    </div>
                    <div style="padding: 10px 0; border-top: 1px solid #dee2e6;">
                      <span style="font-size: 14px; color: #6c757d;">⏱️ Durée</span><br>
                      <span style="font-size: 18px; font-weight: 600; color: #333;">${props.duration} minutes</span>
                    </div>
                    <div style="padding: 10px 0; border-top: 1px solid #dee2e6;">
                      <span style="font-size: 14px; color: #6c757d;">📍 Adresse</span><br>
                      <span style="font-size: 16px; color: #333;">${props.address}</span>
                    </div>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e7f3ff; border-left: 4px solid #0066cc; border-radius: 4px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #004085; font-size: 14px; font-weight: 600;">📋 À noter:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #004085; font-size: 14px; line-height: 1.8;">
                      <li>Arrivez 10 minutes à l'avance</li>
                      <li>Apportez votre carte d'assurance</li>
                      <li>Portez des vêtements confortables</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #333; font-size: 14px; font-weight: 500;">Clinique Chiropratique</p>
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
