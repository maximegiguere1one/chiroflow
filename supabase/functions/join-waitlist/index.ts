import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WaitlistSubmission {
  full_name: string;
  email: string;
  phone: string;
  preferred_days?: string[];
  preferred_times?: string[];
  notes?: string;
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

    const body: WaitlistSubmission = await req.json();

    // Validation
    if (!body.full_name || !body.email || !body.phone) {
      return new Response(
        JSON.stringify({ error: 'Nom, email et téléphone sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ error: 'Format d\'email invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the clinic owner (first admin profile)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (profileError || !profiles) {
      console.error('Error finding clinic owner:', profileError);
      return new Response(
        JSON.stringify({ error: 'Configuration incorrecte' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already on waitlist (by email)
    const { data: existing, error: checkError } = await supabase
      .from('new_client_waitlist')
      .select('id, status')
      .eq('owner_id', profiles.id)
      .eq('email', body.email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing:', checkError);
    }

    if (existing) {
      if (existing.status === 'waiting') {
        return new Response(
          JSON.stringify({ 
            message: 'Vous êtes déjà sur notre liste d\'attente!',
            already_registered: true,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (existing.status === 'invited') {
        return new Response(
          JSON.stringify({ 
            message: 'Vous avez déjà reçu une invitation! Vérifiez vos emails.',
            already_invited: true,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Add to waitlist
    const { data: newEntry, error: insertError } = await supabase
      .from('new_client_waitlist')
      .insert({
        owner_id: profiles.id,
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        preferred_days: body.preferred_days || [],
        preferred_times: body.preferred_times || [],
        notes: body.notes || null,
        status: 'waiting',
        priority: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting into waitlist:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'inscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current position in waitlist for notification
    const { count: waitlistPosition } = await supabase
      .from('new_client_waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', profiles.id)
      .eq('status', 'waiting')
      .lte('added_at', newEntry.added_at);

    // Send emails
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      // 1. Send confirmation email to client
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Clinique Janie <noreply@${RESEND_DOMAIN}>`,
            to: body.email,
            subject: 'Inscription à la liste d\'attente confirmée',
            html: `
              <h2>Bonjour ${body.full_name},</h2>
              <p>Merci de votre intérêt pour nos services!</p>
              <p>Vous avez été ajouté(e) avec succès à notre liste d'attente.</p>
              <p>Nous vous contacterons dès qu'une place se libère.</p>
              <p><strong>Vos informations:</strong></p>
              <ul>
                <li>Nom: ${body.full_name}</li>
                <li>Email: ${body.email}</li>
                <li>Téléphone: ${body.phone}</li>
              </ul>
              <p>Merci de votre patience!</p>
            `,
          }),
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      // 2. Send notification email to admin (maxime@giguere-influence.com)
      try {
        const preferredDaysText = body.preferred_days && body.preferred_days.length > 0
          ? body.preferred_days.join(', ')
          : 'Aucune préférence';
        const preferredTimesText = body.preferred_times && body.preferred_times.length > 0
          ? body.preferred_times.join(', ')
          : 'Aucune préférence';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Clinique Janie <notifications@${RESEND_DOMAIN}>`,
            to: 'maxime@giguere-influence.com',
            subject: `Nouvelle inscription à la liste d'attente: ${body.full_name}`,
            html: `
              <h2>Nouvelle inscription à la liste d'attente</h2>
              <p>Un nouveau client s'est inscrit sur la liste d'attente.</p>

              <h3>Informations du client:</h3>
              <ul>
                <li><strong>Nom:</strong> ${body.full_name}</li>
                <li><strong>Email:</strong> ${body.email}</li>
                <li><strong>Téléphone:</strong> ${body.phone}</li>
                <li><strong>Position dans la file:</strong> #${waitlistPosition || 1}</li>
              </ul>

              <h3>Préférences:</h3>
              <ul>
                <li><strong>Jours préférés:</strong> ${preferredDaysText}</li>
                <li><strong>Heures préférées:</strong> ${preferredTimesText}</li>
                ${body.notes ? `<li><strong>Notes:</strong> ${body.notes}</li>` : ''}
              </ul>

              <p>
                <a href="${supabaseUrl.replace('/rest/v1', '')}/admin" style="display:inline-block;padding:12px 24px;background-color:#10b981;color:white;text-decoration:none;border-radius:6px;margin-top:16px;">
                  Voir dans le dashboard
                </a>
              </p>

              <p style="color:#666;font-size:14px;margin-top:24px;">
                Inscrit le: ${new Date(newEntry.created_at).toLocaleString('fr-CA', { timeZone: 'America/Toronto' })}
              </p>
            `,
          }),
        });
      } catch (emailError) {
        console.error('Error sending admin notification email:', emailError);
      }
    }

    // Get current position in waitlist
    const { count } = await supabase
      .from('new_client_waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', profiles.id)
      .eq('status', 'waiting')
      .lte('added_at', newEntry.added_at);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Inscription réussie! Nous vous contacterons bientôt.',
        position: count || 1,
        id: newEntry.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in join-waitlist:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});