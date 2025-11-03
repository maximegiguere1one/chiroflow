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

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Twilio credentials not configured');
    }

    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000);

    const { data: failedComms } = await supabaseAdmin
      .from('communication_attempts')
      .select(`
        *,
        appointments!inner(id, scheduled_at, status),
        contacts!inner(id, full_name, phone, email)
      `)
      .eq('status', 'failed')
      .gte('appointments.scheduled_at', twoHoursFromNow.toISOString())
      .lte('appointments.scheduled_at', fourHoursFromNow.toISOString())
      .lt('attempt_number', 3);

    if (!failedComms || failedComms.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No voice reminders needed', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const results = [];

    for (const comm of failedComms) {
      try {
        const { appointments: apt, contacts: contact } = comm;

        if (!contact.phone) {
          console.log(`No phone number for contact: ${contact.full_name}`);
          continue;
        }

        const appointmentTime = new Date(apt.scheduled_at);
        const timeStr = formatTime(appointmentTime);

        const { data: preferences } = await supabaseAdmin
          .from('patient_preferences')
          .select('preferred_language')
          .eq('contact_id', contact.id)
          .single();

        const language = preferences?.preferred_language || 'fr';

        const twimlUrl = createTwiMLUrl(contact.id, apt.id, timeStr, language);

        const authHeader = 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`);

        const callResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: contact.phone,
              From: twilioPhoneNumber,
              Url: twimlUrl,
              Method: 'GET',
            }),
          }
        );

        if (!callResponse.ok) {
          const errorData = await callResponse.text();
          throw new Error(`Twilio API error: ${errorData}`);
        }

        const callData = await callResponse.json();

        await supabaseAdmin
          .from('communication_attempts')
          .insert({
            contact_id: contact.id,
            appointment_id: apt.id,
            communication_type: 'voice',
            attempt_number: comm.attempt_number + 1,
            status: 'sent',
            sent_at: new Date().toISOString(),
            metadata: {
              twilio_call_sid: callData.sid,
              fallback_reason: 'email_sms_failed',
              language: language
            }
          });

        results.push({
          contact_id: contact.id,
          contact_name: contact.full_name,
          phone: contact.phone,
          success: true,
          call_sid: callData.sid,
        });

        console.log(`✅ Voice call initiated to ${contact.phone} - Twilio SID: ${callData.sid}`);
      } catch (error) {
        console.error(`Error making voice call for ${comm.contact_id}:`, error);

        results.push({
          contact_id: comm.contact_id,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`📞 Processing complete: ${results.length} voice calls processed`);
    console.log(`✅ Success: ${results.filter(r => r.success).length}`);
    console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);

    return new Response(
      JSON.stringify({
        message: `${results.length} voice reminders processed`,
        success_count: results.filter(r => r.success).length,
        error_count: results.filter(r => !r.success).length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-voice-reminder function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function createTwiMLUrl(contactId: string, appointmentId: string, time: string, language: string): string {
  const baseUrl = Deno.env.get('APP_DOMAIN') || Deno.env.get('SUPABASE_URL') || '';

  const message = language === 'en'
    ? `Hello, this is Clinique Janie. You have an appointment today at ${time}. Press 1 to confirm, or 2 to cancel.`
    : `Bonjour, c'est la Clinique Janie. Vous avez un rendez-vous aujourd'hui à ${time}. Appuyez sur 1 pour confirmer, ou sur 2 pour annuler.`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${baseUrl}/functions/v1/handle-voice-response?contact_id=${contactId}&appointment_id=${appointmentId}&language=${language}" method="POST">
    <Say voice="Polly.Celine" language="fr-FR">${message}</Say>
  </Gather>
  <Say voice="Polly.Celine" language="fr-FR">Nous n'avons pas reçu de réponse. Au revoir.</Say>
</Response>`;

  const encodedTwiml = encodeURIComponent(twiml);
  return `data:application/xml,${encodedTwiml}`;
}
