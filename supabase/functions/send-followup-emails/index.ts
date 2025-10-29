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

    const { data: followups, error: fetchError } = await supabaseAdmin
      .from('pending_followups')
      .select('*')
      .limit(50);

    if (fetchError) throw fetchError;

    if (!followups || followups.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucun suivi à envoyer', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY non configuré');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const results = [];

    for (const followup of followups) {
      try {
        const bookingUrl = `${supabaseUrl.replace('.supabase.co', '')}/book`;
        const feedbackUrl = `${supabaseUrl.replace('.supabase.co', '')}/feedback/${followup.confirmation_token}`;

        let subject = '';
        let htmlContent = '';

        if (followup.followup_type === 'satisfaction') {
          subject = `Comment s'est passé votre rendez-vous?`;
          htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { background: #ffffff; padding: 40px 30px; }
    .button { display: inline-block; padding: 16px 32px; margin: 10px 5px; background: #4CAF50; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .rating { text-align: center; margin: 30px 0; }
    .star { font-size: 32px; margin: 0 5px; text-decoration: none; }
    .footer { background: #f5f5f5; padding: 30px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">💙 Merci de votre visite!</h1>
    </div>
    <div class="content">
      <p style="font-size: 18px; margin-bottom: 10px;">Bonjour ${followup.patient_name},</p>

      <p style="font-size: 16px; margin: 20px 0;">Nous espérons que votre rendez-vous s'est bien passé!</p>

      <p style="font-size: 16px; margin: 20px 0;">Votre avis est précieux pour nous aider à améliorer nos services. Pourriez-vous prendre 30 secondes pour nous dire comment s'est passée votre visite?</p>

      <div class="rating">
        <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Comment évalueriez-vous votre expérience?</p>
        <a href="${feedbackUrl}?rating=5" class="star">⭐</a>
        <a href="${feedbackUrl}?rating=4" class="star">⭐</a>
        <a href="${feedbackUrl}?rating=3" class="star">⭐</a>
        <a href="${feedbackUrl}?rating=2" class="star">⭐</a>
        <a href="${feedbackUrl}?rating=1" class="star">⭐</a>
        <p style="font-size: 12px; color: #999; margin-top: 10px;">5 étoiles = Excellent | 1 étoile = À améliorer</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${feedbackUrl}" class="button">Laisser un commentaire</a>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

      <p style="font-size: 13px; color: #666; text-align: center;">
        Merci de nous faire confiance! 💙
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
        } else if (followup.followup_type === 'rebooking') {
          subject = `Il est temps de prendre votre prochain rendez-vous`;
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
    .button { display: inline-block; padding: 18px 36px; margin: 20px 0; background: #4CAF50; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; }
    .benefits { background: #f9f9f9; padding: 25px; margin: 25px 0; border-radius: 8px; }
    .benefit-item { margin: 15px 0; padding-left: 30px; position: relative; }
    .footer { background: #f5f5f5; padding: 30px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">📅 Continuez votre suivi</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Votre santé est notre priorité</p>
    </div>
    <div class="content">
      <p style="font-size: 18px; margin-bottom: 10px;">Bonjour ${followup.patient_name},</p>

      <p style="font-size: 16px; margin: 20px 0;">Pour maintenir les bénéfices de votre dernier traitement, il est recommandé de planifier votre prochain rendez-vous.</p>

      <div class="benefits">
        <h3 style="margin: 0 0 15px 0; color: #D4AF37;">Pourquoi continuer votre suivi?</h3>
        <div class="benefit-item">
          <span style="position: absolute; left: 0;">✅</span>
          Maintien des résultats à long terme
        </div>
        <div class="benefit-item">
          <span style="position: absolute; left: 0;">✅</span>
          Prévention des rechutes
        </div>
        <div class="benefit-item">
          <span style="position: absolute; left: 0;">✅</span>
          Optimisation de votre bien-être
        </div>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${bookingUrl}" class="button">Réserver mon prochain RDV</a>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center; margin: 30px 0;">
        La réservation en ligne est disponible 24/7 pour votre commodité
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

      <p style="font-size: 12px; color: #999; text-align: center;">
        Besoin d'aide? Contactez-nous directement
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
        }

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ChiroFlow <notifications@resend.dev>',
            to: [followup.patient_email],
            subject,
            html: htmlContent,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          throw new Error(`Resend API error: ${errorData}`);
        }

        const emailData = await emailResponse.json();

        await supabaseAdmin
          .from('automated_followups')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', followup.id);

        results.push({
          followup_id: followup.id,
          patient_email: followup.patient_email,
          type: followup.followup_type,
          success: true,
          resend_id: emailData.id,
        });

        console.log(`✅ Suivi ${followup.followup_type} envoyé - ${followup.patient_email}`);
      } catch (error) {
        console.error(`Erreur envoi suivi ${followup.id}:`, error);

        await supabaseAdmin
          .from('automated_followups')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', followup.id);

        results.push({
          followup_id: followup.id,
          patient_email: followup.patient_email,
          type: followup.followup_type,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`📧 Traitement terminé: ${results.length} suivis traités`);
    console.log(`✅ Succès: ${results.filter(r => r.success).length}`);
    console.log(`❌ Échecs: ${results.filter(r => !r.success).length}`);

    return new Response(
      JSON.stringify({
        message: `${results.length} suivis traités`,
        success_count: results.filter(r => r.success).length,
        error_count: results.filter(r => !r.success).length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erreur fonction send-followup-emails:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
