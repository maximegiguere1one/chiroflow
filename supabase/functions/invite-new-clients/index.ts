import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  available_slot_date?: string;
  available_slot_time?: string;
  service_type_id?: string;
  limit?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const RESEND_DOMAIN = Deno.env.get("RESEND_DOMAIN") || "janiechiro.com";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const limit = body.limit || 5; // Inviter max 5 personnes à la fois

    // Get waiting new clients (highest priority first)
    const { data: waitingClients, error: queryError } = await supabase
      .from('new_client_waitlist')
      .select('*')
      .eq('owner_id', user.id)
      .eq('status', 'waiting')
      .order('priority', { ascending: false })
      .order('added_at')
      .limit(limit);

    if (queryError) throw queryError;

    if (!waitingClients || waitingClients.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No clients waiting', invited: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const invitations = [];
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    for (const client of waitingClients) {
      // Create invitation record
      const { data: invitation, error: invError } = await supabase
        .from('waitlist_invitations')
        .insert({
          owner_id: user.id,
          invitation_type: 'new_client',
          waitlist_entry_id: client.id,
          recipient_name: client.full_name,
          recipient_email: client.email,
          recipient_phone: client.phone,
          opportunity_type: 'client_left',
          available_slot_date: body.available_slot_date,
          available_slot_time: body.available_slot_time,
          service_type_id: body.service_type_id,
          email_sent_successfully: false,
        })
        .select()
        .single();

      if (invError) {
        console.error('Error creating invitation:', invError);
        continue;
      }

      // Send email if Resend is configured
      let emailSent = false;
      if (resendApiKey) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `Clinique Janie <noreply@${RESEND_DOMAIN}>`,
              to: client.email,
              subject: 'Une place est disponible!',
              html: `
                <h2>Bonjour ${client.full_name},</h2>
                <p>Bonne nouvelle! Une place s'est libérée dans notre clinique.</p>
                <p>Nous vous invitons à prendre rendez-vous dès maintenant.</p>
                ${body.available_slot_date ? `<p><strong>Date disponible:</strong> ${body.available_slot_date}</p>` : ''}
                <p>Contactez-nous rapidement pour réserver votre place!</p>
              `,
            }),
          });

          emailSent = emailResponse.ok;
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }
      }

      // Update invitation status
      await supabase
        .from('waitlist_invitations')
        .update({ email_sent_successfully: emailSent })
        .eq('id', invitation.id);

      // Update client status
      await supabase
        .from('new_client_waitlist')
        .update({ 
          status: 'invited',
          invited_at: new Date().toISOString(),
        })
        .eq('id', client.id);

      invitations.push({
        client: client.full_name,
        email: client.email,
        emailSent,
      });
    }

    return new Response(
      JSON.stringify({ 
        message: `${invitations.length} invitation(s) envoyée(s)`,
        invited: invitations.length,
        details: invitations,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in invite-new-clients:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});