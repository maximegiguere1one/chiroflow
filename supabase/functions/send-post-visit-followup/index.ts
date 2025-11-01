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

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: appointments, error: fetchError } = await supabaseAdmin
      .from('appointments_api')
      .select('*')
      .eq('status', 'completed')
      .gte('scheduled_at', yesterday.toISOString())
      .lt('scheduled_at', today.toISOString())
      .is('followup_sent', false);

    if (fetchError) throw fetchError;

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No follow-ups to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const appUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const results = [];

    for (const apt of appointments) {
      try {
        if (!apt.patient_email) {
          console.log(`No email for patient: ${apt.patient_name}`);
          continue;
        }

        const feedbackUrl = `${appUrl}/feedback/${apt.id}`;
        const rebookUrl = `${appUrl}/rebook?appointment_id=${apt.id}`;
        const portalUrl = `${appUrl}/patient/portal`;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 15px 30px; margin: 10px 5px; background: #8b5cf6; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .button.secondary { background: #6366f1; }
    .feedback-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .stars { font-size: 32px; margin: 15px 0; }
    .tip-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💜 Comment allez-vous?</h1>
    </div>
    <div class="content">
      <p>Bonjour ${apt.patient_name},</p>

      <p><strong>Merci d'avoir choisi notre clinique hier pour votre traitement!</strong></p>

      <p>Nous espérons que vous vous sentez mieux. Votre bien-être est notre priorité. 🌟</p>

      <div class="feedback-box">
        <h3 style="margin-top: 0;">Comment s'est passé votre rendez-vous?</h3>
        <p>Votre avis nous aide à améliorer nos services</p>
        <div class="stars">⭐⭐⭐⭐⭐</div>
        <a href="${feedbackUrl}" class="button">Donner mon avis (2 min)</a>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

      <h3>📅 Planifier votre prochain rendez-vous</h3>
      <p>Pour maintenir les progrès, nous recommandons un suivi dans 2-4 semaines.</p>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${rebookUrl}" class="button">Réserver mon prochain RDV</a>
      </div>

      <div class="tip-box">
        <strong>💡 Conseils entre les séances:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Maintenez une bonne posture</li>
          <li>Appliquez de la glace si besoin (15 min max)</li>
          <li>Faites les exercices recommandés</li>
          <li>Buvez beaucoup d'eau</li>
        </ul>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

      <p style="text-align: center;">
        <a href="${portalUrl}" style="color: #8b5cf6; text-decoration: none;">
          Accéder à mon portail patient
        </a>
      </p>

      <p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
        Des questions? Répondez simplement à cet email ou appelez-nous!
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
            from: 'ChiroFlow <notifications@resend.dev>',
            to: [apt.patient_email],
            subject: '💜 Comment vous sentez-vous après votre visite?',
            html: htmlContent,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          throw new Error(`Resend API error: ${errorData}`);
        }

        const emailData = await emailResponse.json();

        await supabaseAdmin
          .from('appointments')
          .update({
            followup_sent: true,
            followup_sent_at: new Date().toISOString(),
          })
          .eq('id', apt.id);

        await supabaseAdmin
          .from('messages')
          .insert({
            contact_id: apt.contact_id,
            owner_id: apt.owner_id,
            type: 'email',
            direction: 'outbound',
            status: 'sent',
            subject: 'Comment vous sentez-vous après votre visite?',
            content: 'Follow-up post-visit email sent',
            sent_at: new Date().toISOString(),
            metadata: {
              resend_id: emailData.id,
              appointment_id: apt.id,
              email_type: 'post_visit_followup'
            }
          });

        results.push({
          appointment_id: apt.id,
          patient_email: apt.patient_email,
          success: true,
          resend_id: emailData.id,
        });

        console.log(`✅ Follow-up sent to ${apt.patient_email} - Resend ID: ${emailData.id}`);
      } catch (error) {
        console.error(`Error sending follow-up for appointment ${apt.id}:`, error);

        results.push({
          appointment_id: apt.id,
          patient_email: apt.patient_email,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`💜 Processing complete: ${results.length} follow-ups processed`);
    console.log(`✅ Success: ${results.filter(r => r.success).length}`);
    console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);

    return new Response(
      JSON.stringify({
        message: `${results.length} follow-ups processed`,
        success_count: results.filter(r => r.success).length,
        error_count: results.filter(r => !r.success).length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-post-visit-followup function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
