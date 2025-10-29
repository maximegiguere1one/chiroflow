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

    // Récupérer les rappels à envoyer
    const { data: reminders, error: fetchError } = await supabaseAdmin
      .from('pending_reminders')
      .select('*')
      .limit(50);

    if (fetchError) throw fetchError;

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucun rappel à envoyer', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY non configuré');
    }

    // Obtenir l'URL de base de l'application
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const appUrl = supabaseUrl.replace('.supabase.co', '').replace('https://', 'https://') + '.supabase.co';

    const results = [];

    for (const reminder of reminders) {
      try {
        // URLs correctes pour les actions
        const confirmUrl = `${appUrl}/appointment/confirm/${reminder.confirmation_token}`;
        const manageUrl = `${appUrl}/appointment/manage/${reminder.confirmation_token}`;

        let subject = '';
        let htmlContent = '';

        if (reminder.reminder_type === 'confirmation') {
          subject = `Confirmez votre présence - RDV le ${new Date(reminder.scheduled_date).toLocaleDateString('fr-FR')}`;
          htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 15px 30px; margin: 10px 5px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .button.secondary { background: #6c757d; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Confirmez votre présence</h1>
    </div>
    <div class="content">
      <p>Bonjour ${reminder.patient_name},</p>
      
      <p><strong>Votre rendez-vous approche!</strong></p>
      
      <div class="info-box">
        <strong>📅 Date:</strong> ${new Date(reminder.scheduled_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
        <strong>🕐 Heure:</strong> ${new Date(reminder.scheduled_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}<br>
        <strong>⏱️ Durée:</strong> ${reminder.duration_minutes} minutes<br>
        ${reminder.service_name ? `<strong>🔧 Service:</strong> ${reminder.service_name}` : ''}
      </div>
      
      <p><strong>Merci de confirmer votre présence en cliquant sur le bouton ci-dessous:</strong></p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmUrl}" class="button">✅ Je confirme ma présence</a>
      </div>
      
      <p style="text-align: center; font-size: 14px; color: #666;">
        Besoin d'annuler ou modifier votre RDV?<br>
        <a href="${manageUrl}" style="color: #667eea;">Gérer mon rendez-vous</a>
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="font-size: 12px; color: #666;">
        💡 <strong>Astuce:</strong> Arrivez 10 minutes avant votre rendez-vous et apportez votre carte d'assurance.
      </p>
    </div>
  </div>
</body>
</html>
          `;
        } else if (reminder.reminder_type === '24h') {
          subject = `Rappel: RDV demain à ${new Date(reminder.scheduled_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
          htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 15px 30px; margin: 10px 5px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 Rappel de rendez-vous</h1>
    </div>
    <div class="content">
      <p>Bonjour ${reminder.patient_name},</p>
      
      <p><strong>Nous vous rappelons votre rendez-vous prévu demain:</strong></p>
      
      <div class="info-box">
        <strong>📅 Date:</strong> ${new Date(reminder.scheduled_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
        <strong>🕐 Heure:</strong> ${new Date(reminder.scheduled_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}<br>
        <strong>⏱️ Durée:</strong> ${reminder.duration_minutes} minutes<br>
        ${reminder.service_name ? `<strong>🔧 Service:</strong> ${reminder.service_name}` : ''}
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${manageUrl}" class="button">Gérer mon rendez-vous</a>
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="font-size: 12px; color: #666;">
        💡 <strong>Rappel:</strong> En cas d'empêchement, merci de nous prévenir au moins 24h à l'avance.
      </p>
    </div>
  </div>
</body>
</html>
          `;
        }

        // Envoyer l'email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ChiroFlow <notifications@resend.dev>',
            to: [reminder.patient_email],
            subject,
            html: htmlContent,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          throw new Error(`Resend API error: ${errorData}`);
        }

        const emailData = await emailResponse.json();

        // Marquer le rappel comme envoyé
        await supabaseAdmin
          .from('appointment_reminders')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', reminder.reminder_id);

        results.push({
          reminder_id: reminder.reminder_id,
          patient_email: reminder.patient_email,
          type: reminder.reminder_type,
          success: true,
          resend_id: emailData.id,
        });

        console.log(`✅ Rappel envoyé avec succès - ${reminder.patient_email} - Resend ID: ${emailData.id}`);
      } catch (error) {
        console.error(`Erreur envoi rappel ${reminder.reminder_id}:`, error);
        
        // Marquer comme échoué
        await supabaseAdmin
          .from('appointment_reminders')
          .update({
            status: 'failed',
            error_message: error.message,
            retry_count: (reminder.retry_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reminder.reminder_id);

        results.push({
          reminder_id: reminder.reminder_id,
          patient_email: reminder.patient_email,
          type: reminder.reminder_type,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`📧 Traitement terminé: ${results.length} rappels traités`);
    console.log(`✅ Succès: ${results.filter(r => r.success).length}`);
    console.log(`❌ Échecs: ${results.filter(r => !r.success).length}`);

    return new Response(
      JSON.stringify({
        message: `${results.length} rappels traités`,
        success_count: results.filter(r => r.success).length,
        error_count: results.filter(r => !r.success).length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erreur fonction send-appointment-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});