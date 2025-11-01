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
    const contactId = url.searchParams.get('contact_id');
    const appointmentId = url.searchParams.get('appointment_id');
    const language = url.searchParams.get('language') || 'fr';

    const formData = await req.formData();
    const digits = formData.get('Digits')?.toString();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let responseMessage = '';
    let twiml = '';

    if (digits === '1') {
      await supabaseAdmin
        .from('appointments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', appointmentId);

      await supabaseAdmin
        .from('appointment_history')
        .insert({
          appointment_id: appointmentId,
          contact_id: contactId,
          action: 'confirmed',
          performed_by: 'patient_voice',
          notes: 'Confirmed via voice call',
        });

      await supabaseAdmin
        .from('communication_attempts')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          metadata: {
            response: 'confirmed',
            digits: digits
          }
        })
        .eq('appointment_id', appointmentId)
        .eq('communication_type', 'voice')
        .order('created_at', { ascending: false })
        .limit(1);

      responseMessage = language === 'en'
        ? 'Thank you! Your appointment is confirmed. See you soon!'
        : 'Merci! Votre rendez-vous est confirmé. À bientôt!';

      console.log(`✅ Appointment ${appointmentId} confirmed via voice`);
    } else if (digits === '2') {
      await supabaseAdmin
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', appointmentId);

      await supabaseAdmin
        .from('appointment_history')
        .insert({
          appointment_id: appointmentId,
          contact_id: contactId,
          action: 'cancelled',
          performed_by: 'patient_voice',
          notes: 'Cancelled via voice call',
        });

      await supabaseAdmin
        .from('communication_attempts')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          metadata: {
            response: 'cancelled',
            digits: digits
          }
        })
        .eq('appointment_id', appointmentId)
        .eq('communication_type', 'voice')
        .order('created_at', { ascending: false })
        .limit(1);

      responseMessage = language === 'en'
        ? 'Your appointment has been cancelled. We will contact you again soon.'
        : 'Votre rendez-vous a été annulé. Nous vous recontacterons bientôt.';

      console.log(`❌ Appointment ${appointmentId} cancelled via voice`);
    } else {
      responseMessage = language === 'en'
        ? 'Invalid input. Goodbye.'
        : 'Entrée invalide. Au revoir.';
    }

    const voice = language === 'en' ? 'Polly.Joanna' : 'Polly.Celine';
    const lang = language === 'en' ? 'en-US' : 'fr-FR';

    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${lang}">${responseMessage}</Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in handle-voice-response function:', error);

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Celine" language="fr-FR">Une erreur s'est produite. Au revoir.</Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
      status: 200
    });
  }
});
