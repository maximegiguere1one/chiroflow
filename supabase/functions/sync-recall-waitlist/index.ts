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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, full_name, email, phone')
      .eq('owner_id', profile.id)
      .eq('status', 'active');

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération des contacts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Aucun client actif à synchroniser',
          synced: 0,
          skipped: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('patient_id, appointment_date, id')
      .eq('owner_id', profile.id)
      .gte('appointment_date', new Date().toISOString())
      .order('appointment_date', { ascending: true });

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
    }

    const appointmentMap = new Map();
    if (appointments) {
      for (const apt of appointments) {
        if (!appointmentMap.has(apt.patient_id)) {
          appointmentMap.set(apt.patient_id, {
            id: apt.id,
            date: apt.appointment_date
          });
        }
      }
    }

    let synced = 0;
    let skipped = 0;

    for (const contact of contacts) {
      const { data: existing } = await supabase
        .from('recall_waitlist')
        .select('id, status')
        .eq('owner_id', profile.id)
        .eq('patient_id', contact.id)
        .eq('status', 'active')
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const nextAppointment = appointmentMap.get(contact.id);

      const { error: insertError } = await supabase
        .from('recall_waitlist')
        .insert({
          owner_id: profile.id,
          patient_id: contact.id,
          patient_name: contact.full_name,
          patient_email: contact.email || '',
          patient_phone: contact.phone || '',
          current_appointment_id: nextAppointment?.id || null,
          current_appointment_date: nextAppointment?.date || null,
          status: 'active',
          priority: 0,
          willing_to_move_forward_by_days: 7
        });

      if (insertError) {
        console.error(`Error inserting contact ${contact.id}:`, insertError);
        skipped++;
      } else {
        synced++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synchronisation terminée: ${synced} ajoutés, ${skipped} ignorés`,
        synced,
        skipped,
        total: contacts.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in sync-recall-waitlist:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});