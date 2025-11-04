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
    const { account_sid, auth_token, phone_number } = await req.json();

    if (!account_sid || !auth_token || !phone_number) {
      return new Response(
        JSON.stringify({ error: 'Account SID, Auth Token and Phone Number required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = 'Basic ' + btoa(`${account_sid}:${auth_token}`);

    const url = `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/IncomingPhoneNumbers.json`;

    console.log('Purchasing Twilio number:', phone_number);

    const formData = new URLSearchParams();
    formData.append('PhoneNumber', phone_number);
    formData.append('SmsUrl', '');
    formData.append('VoiceUrl', '');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio purchase error:', errorText);

      if (response.status === 401) {
        throw new Error('Identifiants Twilio invalides. Impossible d\'acheter le numéro.');
      }
      if (response.status === 400) {
        throw new Error('Ce numéro n\'est plus disponible. Recherchez un autre numéro.');
      }
      if (response.status === 402) {
        throw new Error('Fonds insuffisants dans votre compte Twilio. Ajoutez du crédit dans la Console Twilio.');
      }
      if (response.status === 403) {
        throw new Error('Votre compte Twilio n\'a pas la permission d\'acheter des numéros. Contactez le support Twilio.');
      }

      throw new Error(`Impossible d\'acheter le numéro (${response.status}). Vérifiez votre compte Twilio.`);
    }

    const data = await response.json();

    console.log('Number purchased successfully:', data.phone_number);

    return new Response(
      JSON.stringify({
        success: true,
        phone_number: data.phone_number,
        sid: data.sid,
        friendly_name: data.friendly_name
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error purchasing Twilio number:', error);
    return new Response(
      JSON.stringify({
        error: 'Error purchasing number',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
