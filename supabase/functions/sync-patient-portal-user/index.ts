import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer l'utilisateur authentifié depuis le JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire le token
    const token = authHeader.replace('Bearer ', '');
    
    // Vérifier et obtenir l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Utilisateur non trouvé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Chercher un patient avec cet email
    const { data: patient, error: patientError } = await supabase
      .from('patients_full')
      .select('id, email, first_name, last_name')
      .eq('email', user.email)
      .maybeSingle();

    if (patientError) {
      console.error('Erreur lors de la recherche du patient:', patientError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur de recherche patient' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!patient) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun patient trouvé avec cet email',
          needsRegistration: true 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer ou mettre à jour l'entrée dans patient_portal_users
    const { error: upsertError } = await supabase
      .from('patient_portal_users')
      .upsert({
        id: user.id,
        patient_id: patient.id,
        email: user.email,
        is_active: true,
        email_verified: user.email_confirmed_at ? true : false,
        last_login: new Date().toISOString(),
        login_count: 1,
        preferences: {},
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Erreur lors de la synchronisation:', upsertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur de synchronisation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        patient: {
          id: patient.id,
          email: patient.email,
          first_name: patient.first_name,
          last_name: patient.last_name,
        },
        message: 'Synchronisation réussie'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur dans sync-patient-portal-user:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});