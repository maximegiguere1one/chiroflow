import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email et mot de passe requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer l'utilisateur auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        created_via: 'admin',
      },
    });

    if (authError) {
      console.error('Erreur création utilisateur:', authError);
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier si un patient existe avec cet email
    const { data: patient, error: patientError } = await supabase
      .from('patients_full')
      .select('id, first_name, last_name, email')
      .eq('email', email)
      .maybeSingle();

    if (patientError) {
      console.error('Erreur recherche patient:', patientError);
    }

    // Si patient existe, créer l'entrée patient_portal_users
    if (patient) {
      const { error: portalError } = await supabase
        .from('patient_portal_users')
        .insert({
          id: authData.user.id,
          patient_id: patient.id,
          email: email,
          is_active: true,
          email_verified: true,
          login_count: 0,
          preferences: {},
        });

      if (portalError) {
        console.warn('Erreur création patient_portal_users:', portalError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        patient: patient ? {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`,
        } : null,
        message: 'Utilisateur créé avec succès',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur dans create-patient-user:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});