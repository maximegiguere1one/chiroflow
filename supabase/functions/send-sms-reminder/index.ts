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

    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const { data: appointments, error: fetchError } = await supabaseAdmin
      .from('appointments_api')
      .select('*')
      .eq('status', 'scheduled')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', twoHoursLater.toISOString())
      .is('sms_reminder_sent', false);

    if (fetchError) throw fetchError;

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No SMS reminders to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const results = [];

    for (const apt of appointments) {
      try {
        if (!apt.patient_phone) {
          console.log(`No phone number for patient: ${apt.patient_name}`);
          continue;
        }

        const appointmentTime = new Date(apt.scheduled_at);
        const timeStr = appointmentTime.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const appDomain = Deno.env.get('APP_DOMAIN') || Deno.env.get('SUPABASE_URL');
        const message = `🩺 Clinique Janie: Rappel de RDV dans 2h à ${timeStr}. ` +
          `Confirmez en 1 clic: ${appDomain}/confirm/${apt.confirmation_token}. ` +
          `Annuler/Modifier: ${appDomain}/manage/${apt.confirmation_token}`;

        const authHeader = 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`);

        const smsResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: apt.patient_phone,
              From: twilioPhoneNumber,
              Body: message,
            }),
          }
        );

        if (!smsResponse.ok) {
          const errorData = await smsResponse.text();
          throw new Error(`Twilio API error: ${errorData}`);
        }

        const smsData = await smsResponse.json();

        await supabaseAdmin
          .from('appointments')
          .update({
            sms_reminder_sent: true,
            sms_reminder_sent_at: new Date().toISOString(),
          })
          .eq('id', apt.id);

        await supabaseAdmin
          .from('messages')
          .insert({
            contact_id: apt.contact_id,
            owner_id: apt.owner_id,
            type: 'sms',
            direction: 'outbound',
            status: 'sent',
            content: message,
            sent_at: new Date().toISOString(),
            metadata: {
              twilio_sid: smsData.sid,
              appointment_id: apt.id,
              reminder_type: '2h_before'
            }
          });

        results.push({
          appointment_id: apt.id,
          patient_name: apt.patient_name,
          patient_phone: apt.patient_phone,
          success: true,
          twilio_sid: smsData.sid,
        });

        console.log(`✅ SMS sent successfully to ${apt.patient_phone} - Twilio SID: ${smsData.sid}`);
      } catch (error) {
        console.error(`Error sending SMS for appointment ${apt.id}:`, error);

        results.push({
          appointment_id: apt.id,
          patient_name: apt.patient_name,
          patient_phone: apt.patient_phone,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`📱 Processing complete: ${results.length} SMS processed`);
    console.log(`✅ Success: ${results.filter(r => r.success).length}`);
    console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);

    return new Response(
      JSON.stringify({
        message: `${results.length} SMS reminders processed`,
        success_count: results.filter(r => r.success).length,
        error_count: results.filter(r => !r.success).length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-sms-reminder function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
