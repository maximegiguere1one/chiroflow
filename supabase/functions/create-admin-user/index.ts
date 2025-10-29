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

    const { email, password, full_name, invite_code } = await req.json();

    const VALID_INVITE_CODE = 'CHIRO2024';

    if (invite_code !== VALID_INVITE_CODE) {
      return new Response(
        JSON.stringify({ success: false, error: 'Code d\'invitation invalide' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tous les champs sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
        role: 'admin',
      },
    });

    if (authError) {
      console.error('Erreur création utilisateur:', authError);
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: full_name,
        role: 'admin',
      });

    if (profileError && profileError.code !== '23505') {
      console.error('Profile error:', profileError);
    }

    const { error: settingsError } = await supabase
      .from('clinic_settings')
      .insert({
        owner_id: authData.user.id,
        clinic_name: 'Clinique Dre Janie Leblanc',
        email: email,
        phone: '418-XXX-XXXX',
      });

    if (settingsError && settingsError.code !== '23505') {
      console.error('Settings error:', settingsError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: full_name,
        },
        message: 'Compte admin créé avec succès. Vous pouvez maintenant vous connecter.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur dans create-admin-user:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});