import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookingConfirmationData {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  price: number;
  confirmationToken: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const data: BookingConfirmationData = await req.json();

    const {
      patientName,
      patientEmail,
      serviceName,
      appointmentDate,
      appointmentTime,
      duration,
      price,
      confirmationToken,
    } = data;

    const formattedDate = new Date(appointmentDate).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const confirmUrl = `${req.headers.get('origin') || 'https://yoursite.com'}/appointment/${confirmationToken}`;
    const cancelUrl = `${req.headers.get('origin') || 'https://yoursite.com'}/appointment/${confirmationToken}/cancel`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de rendez-vous</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                      Rendez-vous Confirmé! ✓
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">
                      Bonjour ${patientName},
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      Votre rendez-vous a été confirmé avec succès! Voici les détails:
                    </p>
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0; background-color: #f9f9f9; border-radius: 8px;">
                      <tr>
                        <td style="padding: 20px;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 10px 0; color: #999999; font-size: 14px;">Service:</td>
                              <td style="padding: 10px 0; color: #333333; font-size: 16px; font-weight: bold; text-align: right;">
                                ${serviceName}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; color: #999999; font-size: 14px;">Date:</td>
                              <td style="padding: 10px 0; color: #333333; font-size: 16px; font-weight: bold; text-align: right;">
                                ${formattedDate}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; color: #999999; font-size: 14px;">Heure:</td>
                              <td style="padding: 10px 0; color: #333333; font-size: 16px; font-weight: bold; text-align: right;">
                                ${appointmentTime}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; color: #999999; font-size: 14px;">Durée:</td>
                              <td style="padding: 10px 0; color: #333333; font-size: 16px; font-weight: bold; text-align: right;">
                                ${duration} minutes
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; color: #999999; font-size: 14px;">Prix:</td>
                              <td style="padding: 10px 0; color: #D4AF37; font-size: 18px; font-weight: bold; text-align: right;">
                                ${price}$
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <div style="margin: 30px 0; padding: 20px; background-color: #fff9e6; border-left: 4px solid #D4AF37; border-radius: 4px;">
                      <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                        <strong>📍 Instructions importantes:</strong><br>
                        Veuillez arriver 10 minutes avant votre rendez-vous. Si vous devez annuler, veuillez le faire au moins 24 heures à l'avance.
                      </p>
                    </div>
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                      <tr>
                        <td align="center" style="padding: 10px;">
                          <a href="${confirmUrl}" style="display: inline-block; padding: 15px 30px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Voir mon rendez-vous
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 10px;">
                          <a href="${cancelUrl}" style="display: inline-block; padding: 12px 25px; color: #666666; text-decoration: none; font-size: 14px;">
                            Annuler ce rendez-vous
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      Vous recevrez un rappel par email 24 heures avant votre rendez-vous.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                    </p>
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      © ${new Date().getFullYear()} Clinique Janie. Tous droits réservés.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Clinique Janie <noreply@janiechiro.com>",
        to: [patientEmail],
        subject: `✓ Rendez-vous confirmé - ${formattedDate} à ${appointmentTime}`,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const resendData = await resendResponse.json();

    const { data: contact } = await supabase
      .from('contacts')
      .select('phone, owner_id')
      .eq('email', patientEmail)
      .single();

    if (contact?.phone) {
      const smsMessage = `Confirmation de RDV - ${patientName}\n\n📅 ${formattedDate} à ${appointmentTime}\n⏱️ ${duration} min\n💰 ${price}$\n\nClinique Dre Janie Leblanc\nMerci!`;

      try {
        const smsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/test-sms-direct`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: contact.phone,
            message: smsMessage,
          }),
        });

        const smsData = await smsResponse.json();
        console.log('SMS sent:', smsData);
      } catch (smsError) {
        console.error('SMS error (non-blocking):', smsError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email de confirmation envoyé",
        emailId: resendData.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erreur lors de l'envoi de l'email",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
