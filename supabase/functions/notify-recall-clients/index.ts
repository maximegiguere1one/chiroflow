import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  cancelled_appointment_date: string;
  cancelled_appointment_time?: string;
  service_type_id?: string;
  owner_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RequestBody = await req.json();

    let ownerId: string;

    if (body.owner_id) {
      ownerId = body.owner_id;
    } else {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Missing authorization' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      ownerId = user.id;
    }

    const { data: clinicSettings } = await supabase
      .from('clinic_settings')
      .select('clinic_name')
      .eq('owner_id', ownerId)
      .single();
    const cancelledDate = new Date(body.cancelled_appointment_date);

    const { data: recallClients, error: queryError } = await supabase
      .from('recall_waitlist')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('status', 'active')
      .order('priority', { ascending: false })
      .order('added_at');

    if (queryError) {
      console.error('Error querying recall_waitlist:', queryError);
      throw queryError;
    }

    console.log(`Found ${recallClients?.length || 0} recall clients for owner ${ownerId}`);

    if (!recallClients || recallClients.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No recall clients active',
          notified: 0,
          debug: { owner_id: ownerId, query_executed: true }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eligibleClients = recallClients.filter((client) => {
      if (!client.current_appointment_date) return true;
      
      const clientAppointmentDate = new Date(client.current_appointment_date);
      const daysDifference = Math.floor(
        (clientAppointmentDate.getTime() - cancelledDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return daysDifference > 0 && daysDifference <= client.willing_to_move_forward_by_days;
    });

    console.log(`Filtered to ${eligibleClients.length} eligible clients`);

    if (eligibleClients.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No eligible recall clients',
          notified: 0,
          debug: {
            total_recall_clients: recallClients.length,
            eligible_clients: 0,
            cancelled_date: body.cancelled_appointment_date
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notifications = [];
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    console.log(`Resend API Key configured: ${resendApiKey ? 'YES' : 'NO'}`);    console.log(`Starting to notify ${eligibleClients.length} clients...`);

    for (const client of eligibleClients) {
      const { data: invitation, error: invError } = await supabase
        .from('waitlist_invitations')
        .insert({
          owner_id: ownerId,
          invitation_type: 'recall_client',
          waitlist_entry_id: client.id,
          recipient_name: client.patient_name,
          recipient_email: client.patient_email,
          recipient_phone: client.patient_phone,
          opportunity_type: 'appointment_cancelled',
          available_slot_date: body.cancelled_appointment_date,
          available_slot_time: body.cancelled_appointment_time,
          service_type_id: body.service_type_id,
          email_sent_successfully: false,
        })
        .select()
        .single();

      if (invError) {
        console.error('Error creating invitation:', invError);
        continue;
      }

      let emailSent = false;
      if (resendApiKey) {
        try {
          const daysSaved = client.current_appointment_date ? 
            Math.floor(
              (new Date(client.current_appointment_date).getTime() - cancelledDate.getTime()) / (1000 * 60 * 60 * 24)
            ) : 0;

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `Clinique Chiropratique Dre Janie Leblanc <info@janiechiro.com>`,
              to: client.patient_email,
              subject: 'Un rendez-vous plus tôt est disponible!',
              html: `
                <h2>Bonjour ${client.patient_name},</h2>
                <p>Bonne nouvelle! Un créneau s'est libéré et vous pourriez devancer votre rendez-vous.</p>
                <p><strong>Date disponible:</strong> ${new Date(body.cancelled_appointment_date).toLocaleDateString('fr-CA')}</p>
                ${body.cancelled_appointment_time ? `<p><strong>Heure:</strong> ${body.cancelled_appointment_time}</p>` : ''}
                ${daysSaved > 0 ? `<p>Vous pourriez avancer votre rendez-vous de <strong>${daysSaved} jour(s)</strong>!</p>` : ''}
                <p>Contactez-nous rapidement si vous souhaitez prendre ce créneau.</p>
                <p><em>Premier arrivé, premier servi!</em></p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
                <p style="font-size: 12px; color: #666;">${clinicSettings?.clinic_name || 'Clinique Chiropratique Dre Janie Leblanc'}</p>
              `,
            }),
          });

          emailSent = emailResponse.ok;
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }
      }

      await supabase
        .from('waitlist_invitations')
        .update({ email_sent_successfully: emailSent })
        .eq('id', invitation.id);

      await supabase
        .from('recall_waitlist')
        .update({ 
          status: 'notified',
          last_notified_at: new Date().toISOString(),
        })
        .eq('id', client.id);

      notifications.push({
        client: client.patient_name,
        email: client.patient_email,
        emailSent,
      });
    }

    return new Response(
      JSON.stringify({ 
        message: `${notifications.length} client(s) notifié(s)`,
        notified: notifications.length,
        details: notifications,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in notify-recall-clients:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});