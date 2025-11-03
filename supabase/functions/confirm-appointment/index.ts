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
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('id, contact_id, owner_id, scheduled_at, status, confirmation_token')
      .eq('confirmation_token', token)
      .single();

    if (fetchError || !appointment) {
      return new Response(
        JSON.stringify({ error: 'Appointment not found or invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (appointment.status === 'confirmed') {
      return new Response(
        JSON.stringify({
          message: 'Appointment already confirmed',
          appointment_id: appointment.id,
          already_confirmed: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointment.id);

    if (updateError) throw updateError;

    await supabaseAdmin
      .from('appointment_history')
      .insert({
        appointment_id: appointment.id,
        contact_id: appointment.contact_id,
        owner_id: appointment.owner_id,
        action: 'confirmed',
        performed_by: 'patient',
        notes: 'Patient confirmed via email/SMS link',
        created_at: new Date().toISOString(),
      });

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('full_name, email')
        .eq('id', appointment.contact_id)
        .single();

      if (contact?.email) {
        const appointmentTime = new Date(appointment.scheduled_at);
        const dateStr = appointmentTime.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const timeStr = appointmentTime.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Clinique Janie <noreply@janiechiro.com>',
            to: [contact.email],
            subject: '✅ Rendez-vous confirmé',
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .check-icon { font-size: 64px; margin: 20px 0; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="check-icon">✅</div>
      <h1>Rendez-vous Confirmé!</h1>
    </div>
    <div class="content">
      <p>Bonjour ${contact.full_name},</p>

      <p><strong>Merci d'avoir confirmé votre présence!</strong></p>

      <div class="info-box">
        <strong>📅 Date:</strong> ${dateStr}<br>
        <strong>🕐 Heure:</strong> ${timeStr}<br>
      </div>

      <p>Nous avons hâte de vous voir! 💚</p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

      <p style="font-size: 12px; color: #666;">
        💡 <strong>Rappel:</strong> Arrivez 10 minutes avant votre rendez-vous et apportez votre carte d'assurance.
      </p>
    </div>
  </div>
</body>
</html>
            `,
          }),
        });
      }
    }

    console.log(`✅ Appointment ${appointment.id} confirmed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Appointment confirmed successfully',
        appointment_id: appointment.id,
        confirmed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in confirm-appointment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
