import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { appointment_id } = await req.json();

    if (!appointment_id) {
      throw new Error('appointment_id requis');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer les détails du RDV
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        service_types (
          name,
          price,
          duration_minutes
        )
      `)
      .eq('id', appointment_id)
      .single();

    if (fetchError || !appointment) {
      throw new Error(`RDV non trouvé: ${fetchError?.message}`);
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY non configuré');
    }

    // Formater la date et l'heure
    const appointmentDate = new Date(appointment.scheduled_date);
    const formattedDate = appointmentDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = appointment.scheduled_time || appointmentDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Créer l'email pour l'admin
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
    .button { display: inline-block; padding: 15px 30px; margin: 10px 5px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .label { font-weight: bold; color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Nouveau rendez-vous réservé!</h1>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      
      <p><strong>Un nouveau rendez-vous vient d'être réservé en ligne!</strong></p>
      
      <div class="info-box">
        <p><span class="label">👤 Patient:</span> ${appointment.name}</p>
        <p><span class="label">📧 Email:</span> ${appointment.email}</p>
        ${appointment.phone ? `<p><span class="label">📞 Téléphone:</span> ${appointment.phone}</p>` : ''}
        <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
        <p><span class="label">📅 Date:</span> ${formattedDate}</p>
        <p><span class="label">🕐 Heure:</span> ${formattedTime}</p>
        ${appointment.service_types ? `<p><span class="label">🔧 Service:</span> ${appointment.service_types.name} (${appointment.service_types.duration_minutes} min)</p>` : ''}
        ${appointment.service_types?.price ? `<p><span class="label">💰 Prix:</span> ${appointment.service_types.price} $</p>` : ''}
        ${appointment.reason ? `<p><span class="label">📝 Motif:</span> ${appointment.reason}</p>` : ''}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">Consultez votre dashboard pour plus de détails</p>
      </div>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="font-size: 12px; color: #666;">
        💡 <strong>Source:</strong> Réservation en ligne (${appointment.booking_source || 'online'})<br>
        🕑 <strong>Reçu le:</strong> ${new Date().toLocaleString('fr-FR')}
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Envoyer l'email à l'admin
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Clinique Janie <noreply@janiechiro.com>',
        to: ['maxime@agence1.com'],
        subject: `🎉 Nouveau RDV: ${appointment.name} - ${formattedDate} à ${formattedTime}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Erreur Resend: ${errorData}`);
    }

    const emailData = await emailResponse.json();

    console.log(`✅ Email admin envoyé avec succès - Resend ID: ${emailData.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification admin envoyée',
        email_id: emailData.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erreur notify-admin-new-booking:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});