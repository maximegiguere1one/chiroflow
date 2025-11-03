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

    const { data: reminders, error: fetchError } = await supabaseAdmin
      .from('pending_reminders_enhanced')
      .select('*')
      .not('reminder_type', 'is', null)
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const results = [];

    for (const reminder of reminders) {
      try {
        const confirmUrl = `${supabaseUrl.replace('.supabase.co', '')}/appointment/confirm/${reminder.confirmation_token}`;
        const manageUrl = `${supabaseUrl.replace('.supabase.co', '')}/appointment/manage/${reminder.confirmation_token}`;

        let subject = '';
        let htmlContent = '';

        const formattedDate = new Date(reminder.scheduled_date + ' ' + reminder.scheduled_time).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        if (reminder.reminder_type === '48h') {
          subject = `⏰ Confirmez votre RDV dans 48h - ${formattedDate}`;
          htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { background: #ffffff; padding: 40px 30px; }
    .button { display: inline-block; padding: 16px 32px; margin: 20px 10px; background: #4CAF50; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .button.secondary { background: #D4AF37; }
    .info-box { background: #f9f9f9; padding: 25px; border-left: 5px solid #D4AF37; margin: 25px 0; border-radius: 5px; }
    .footer { background: #f5f5f5; padding: 30px; text-align: center; font-size: 12px; color: #666; }
    .urgent { background: #fff3cd; border-left: 5px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">⏰ Rappel de rendez-vous</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Dans 48 heures</p>
    </div>
    <div class="content">
      <p style="font-size: 18px; margin-bottom: 10px;">Bonjour ${reminder.patient_name},</p>

      <p style="font-size: 16px; margin: 20px 0;">Votre rendez-vous approche dans <strong>48 heures</strong>!</p>

      <div class="info-box">
        <p style="margin: 0; font-size: 16px;"><strong>📅 Date:</strong> ${formattedDate}</p>
        <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>🕐 Heure:</strong> ${reminder.scheduled_time}</p>
        <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>⏱️ Durée:</strong> ${reminder.duration_minutes} minutes</p>
        ${reminder.service_name ? `<p style="margin: 10px 0 0 0; font-size: 16px;"><strong>🔧 Service:</strong> ${reminder.service_name}</p>` : ''}
      </div>

      <div class="urgent">
        <p style="margin: 0; font-size: 15px; color: #856404;">
          <strong>⚠️ Action requise:</strong> Veuillez confirmer votre présence en cliquant sur le bouton ci-dessous.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmUrl}" class="button">✅ Je confirme ma présence</a>
      </div>

      <p style="text-align: center; font-size: 14px; color: #666; margin: 30px 0;">
        Besoin d'annuler ou de modifier?<br>
        <a href="${manageUrl}" style="color: #D4AF37; text-decoration: none; font-weight: bold;">Gérer mon rendez-vous</a>
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

      <p style="font-size: 13px; color: #666; margin: 20px 0;">
        💡 <strong>Rappel:</strong> Arrivez 10 minutes à l'avance et apportez votre carte d'assurance et une pièce d'identité.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 10px 0;">Cet email a été envoyé automatiquement</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} ChiroFlow - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>
          `;
        } else if (reminder.reminder_type === '24h') {
          subject = `📅 Votre RDV demain à ${reminder.scheduled_time}`;
          htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { background: #ffffff; padding: 40px 30px; }
    .button { display: inline-block; padding: 16px 32px; margin: 20px 10px; background: #D4AF37; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .info-box { background: #f9f9f9; padding: 25px; border-left: 5px solid #4CAF50; margin: 25px 0; border-radius: 5px; }
    .footer { background: #f5f5f5; padding: 30px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">📅 C'est demain!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Rappel de votre rendez-vous</p>
    </div>
    <div class="content">
      <p style="font-size: 18px; margin-bottom: 10px;">Bonjour ${reminder.patient_name},</p>

      <p style="font-size: 16px; margin: 20px 0;">Nous vous rappelons votre rendez-vous <strong>demain</strong>:</p>

      <div class="info-box">
        <p style="margin: 0; font-size: 16px;"><strong>📅 Date:</strong> ${formattedDate}</p>
        <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>🕐 Heure:</strong> ${reminder.scheduled_time}</p>
        <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>⏱️ Durée:</strong> ${reminder.duration_minutes} minutes</p>
        ${reminder.service_name ? `<p style="margin: 10px 0 0 0; font-size: 16px;"><strong>🔧 Service:</strong> ${reminder.service_name}</p>` : ''}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${manageUrl}" class="button">Voir les détails</a>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

      <p style="font-size: 13px; color: #666; margin: 20px 0;">
        📍 <strong>Adresse:</strong> Votre clinique chiropratique<br>
        📞 <strong>En cas d'empêchement:</strong> Veuillez nous prévenir dès que possible
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 10px 0;">Cet email a été envoyé automatiquement</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} ChiroFlow - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>
          `;
        } else if (reminder.reminder_type === '2h') {
          subject = `🔔 Rappel: RDV dans 2 heures`;
          htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { background: #ffffff; padding: 40px 30px; }
    .info-box { background: #fff3e0; padding: 25px; border-left: 5px solid #ff9800; margin: 25px 0; border-radius: 5px; }
    .footer { background: #f5f5f5; padding: 30px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">🔔 C'est bientôt!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Dans 2 heures</p>
    </div>
    <div class="content">
      <p style="font-size: 18px; margin-bottom: 10px;">Bonjour ${reminder.patient_name},</p>

      <p style="font-size: 16px; margin: 20px 0;">Rappel de dernière minute: votre rendez-vous est <strong>dans 2 heures</strong>!</p>

      <div class="info-box">
        <p style="margin: 0; font-size: 18px; color: #e65100;"><strong>🕐 ${reminder.scheduled_time}</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Durée: ${reminder.duration_minutes} minutes</p>
      </div>

      <p style="font-size: 14px; color: #666; margin: 20px 0; text-align: center;">
        On vous attend! 😊
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} ChiroFlow</p>
    </div>
  </div>
</body>
</html>
          `;
        }

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Clinique Janie <noreply@janiechiro.com>',
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

        const updateField = `reminder_${reminder.reminder_type}_sent`;
        const updateFieldAt = `reminder_${reminder.reminder_type}_sent_at`;

        await supabaseAdmin
          .from('appointment_confirmations')
          .update({
            [updateField]: true,
            [updateFieldAt]: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', reminder.confirmation_id);

        results.push({
          confirmation_id: reminder.confirmation_id,
          patient_email: reminder.patient_email,
          type: reminder.reminder_type,
          success: true,
          resend_id: emailData.id,
        });

        console.log(`✅ Rappel ${reminder.reminder_type} envoyé - ${reminder.patient_email}`);
      } catch (error) {
        console.error(`Erreur envoi rappel ${reminder.confirmation_id}:`, error);

        results.push({
          confirmation_id: reminder.confirmation_id,
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
    console.error('Erreur fonction send-automated-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
