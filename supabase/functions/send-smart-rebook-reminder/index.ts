import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data: eligiblePatients, error: fetchError } = await supabaseAdmin
      .rpc('get_patients_needing_rebook', {
        min_days_since_visit: 21,
        max_days_since_visit: 28
      });

    if (fetchError) {
      const { data: appointments, error: fallbackError } = await supabaseAdmin
        .from('appointments_api')
        .select('*')
        .eq('status', 'completed')
        .gte('scheduled_at', fourWeeksAgo.toISOString())
        .lte('scheduled_at', threeWeeksAgo.toISOString());

      if (fallbackError) throw fallbackError;

      if (!appointments || appointments.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No rebook reminders to send', count: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      const contactIds = [...new Set(appointments.map(a => a.contact_id))];

      const { data: contacts, error: contactError } = await supabaseAdmin
        .from('contacts')
        .select('id, full_name, email, phone, owner_id')
        .in('id', contactIds);

      if (contactError) throw contactError;

      const { data: futureAppointments, error: futureError } = await supabaseAdmin
        .from('appointments')
        .select('contact_id')
        .in('contact_id', contactIds)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString());

      if (futureError) throw futureError;

      const patientsWithFuture = new Set(futureAppointments?.map(a => a.contact_id) || []);

      const eligibleContacts = contacts?.filter(c => !patientsWithFuture.has(c.id)) || [];

      await processRebookReminders(supabaseAdmin, eligibleContacts);
    } else {
      await processRebookReminders(supabaseAdmin, eligiblePatients);
    }

    async function processRebookReminders(supabase: any, patients: any[]) {
      if (!patients || patients.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No patients eligible for rebook reminder', count: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        throw new Error('RESEND_API_KEY not configured');
      }

      const appUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const results = [];

      for (const patient of patients) {
        try {
          if (!patient.email) {
            console.log(`No email for patient: ${patient.full_name}`);
            continue;
          }

          const bookingUrl = `${appUrl}/booking?contact_id=${patient.id}`;
          const portalUrl = `${appUrl}/patient/portal`;

          const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 15px 30px; margin: 10px 5px; background: #3b82f6; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .benefits-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .benefit-item { display: flex; align-items: center; margin: 10px 0; }
    .calendar-icon { font-size: 48px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="calendar-icon">📅</div>
      <h1>Il est temps de reprendre soin de vous!</h1>
    </div>
    <div class="content">
      <p>Bonjour ${patient.full_name},</p>

      <p>Cela fait maintenant 3 semaines depuis votre dernière visite. Comment allez-vous?</p>

      <p><strong>Des études montrent que des soins réguliers espacés de 3-4 semaines permettent:</strong></p>

      <div class="benefits-box">
        <div class="benefit-item">✅ De maintenir les progrès obtenus</div>
        <div class="benefit-item">✅ De prévenir la réapparition des douleurs</div>
        <div class="benefit-item">✅ D'améliorer durablement votre bien-être</div>
        <div class="benefit-item">✅ De réduire les coûts à long terme</div>
      </div>

      <p><strong>Nous vous recommandons de planifier votre prochain rendez-vous dès maintenant:</strong></p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${bookingUrl}" class="button">📅 Réserver mon prochain RDV</a>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

      <p><strong>🎁 Avantages de la réservation en ligne:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Choisissez l'heure qui vous convient</li>
        <li>Confirmation instantanée</li>
        <li>Rappels automatiques</li>
        <li>Modification facile si besoin</li>
      </ul>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

      <p style="text-align: center;">
        <a href="${portalUrl}" style="color: #3b82f6; text-decoration: none;">
          Accéder à mon portail patient
        </a>
      </p>

      <p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
        Vous ne souhaitez plus recevoir ces rappels? <a href="${appUrl}/unsubscribe?contact_id=${patient.id}" style="color: #3b82f6;">Se désabonner</a>
      </p>
    </div>
  </div>
</body>
</html>
          `;

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Clinique Janie <noreply@janiechiro.com>',
              to: [patient.email],
              subject: '📅 Il est temps de reprendre RDV - Maintenez vos progrès!',
              html: htmlContent,
            }),
          });

          if (!emailResponse.ok) {
            const errorData = await emailResponse.text();
            throw new Error(`Resend API error: ${errorData}`);
          }

          const emailData = await emailResponse.json();

          await supabase
            .from('messages')
            .insert({
              contact_id: patient.id,
              owner_id: patient.owner_id,
              type: 'email',
              direction: 'outbound',
              status: 'sent',
              subject: 'Il est temps de reprendre RDV',
              content: 'Smart rebook reminder sent',
              sent_at: new Date().toISOString(),
              metadata: {
                resend_id: emailData.id,
                email_type: 'smart_rebook_reminder',
                days_since_last_visit: 21
              }
            });

          results.push({
            contact_id: patient.id,
            patient_email: patient.email,
            success: true,
            resend_id: emailData.id,
          });

          console.log(`✅ Rebook reminder sent to ${patient.email} - Resend ID: ${emailData.id}`);
        } catch (error) {
          console.error(`Error sending rebook reminder to ${patient.id}:`, error);

          results.push({
            contact_id: patient.id,
            patient_email: patient.email,
            success: false,
            error: error.message,
          });
        }
      }

      console.log(`📅 Processing complete: ${results.length} rebook reminders processed`);
      console.log(`✅ Success: ${results.filter(r => r.success).length}`);
      console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);

      return new Response(
        JSON.stringify({
          message: `${results.length} rebook reminders processed`,
          success_count: results.filter(r => r.success).length,
          error_count: results.filter(r => !r.success).length,
          results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in send-smart-rebook-reminder function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
