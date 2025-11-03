import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settingsArray, error: settingsError } = await supabase
      .from('clinic_settings')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, clinic_name')
      .limit(1);

    const settings = settingsArray?.[0];

    if (settingsError || !settings) {
      throw new Error('Twilio settings not found');
    }

    if (!settings.twilio_account_sid || !settings.twilio_auth_token || !settings.twilio_phone_number) {
      throw new Error('Twilio configuration incomplete');
    }

    const { to, message } = await req.json();

    if (!to) {
      throw new Error('Missing "to" phone number');
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${settings.twilio_account_sid}/Messages.json`;
    const auth = btoa(`${settings.twilio_account_sid}:${settings.twilio_auth_token}`);

    const formattedTo = to.replace(/\D/g, '').startsWith('1') ? `+${to.replace(/\D/g, '')}` : `+1${to.replace(/\D/g, '')}`;

    const formData = new URLSearchParams();
    formData.append('To', formattedTo);
    formData.append('From', settings.twilio_phone_number);
    formData.append('Body', message || `Test SMS de ${settings.clinic_name} - Système opérationnel!`);

    console.log('Sending SMS:', {
      to: formattedTo,
      from: settings.twilio_phone_number,
      accountSid: settings.twilio_account_sid.substring(0, 10) + '...'
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioData);
      return new Response(
        JSON.stringify({
          success: false,
          error: twilioData.message || 'Twilio API error',
          details: twilioData,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SMS sent successfully!',
        twilioSid: twilioData.sid,
        status: twilioData.status,
        to: formattedTo,
        from: settings.twilio_phone_number,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
