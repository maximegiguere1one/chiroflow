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
    const { account_sid, auth_token, phone_number, webhook_url } = await req.json();

    if (!account_sid || !auth_token || !phone_number || !webhook_url) {
      return new Response(
        JSON.stringify({ error: 'All parameters required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = 'Basic ' + btoa(`${account_sid}:${auth_token}`);

    const listUrl = `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phone_number)}`;

    console.log('Finding phone number SID for:', phone_number);

    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('Error finding phone number:', errorText);

      if (listResponse.status === 401) {
        throw new Error('Identifiants Twilio invalides.');
      }
      if (listResponse.status === 404) {
        throw new Error('Numéro non trouvé dans votre compte Twilio.');
      }

      throw new Error(`Impossible de trouver le numéro (${listResponse.status}).`);
    }

    const listData = await listResponse.json();

    if (!listData.incoming_phone_numbers || listData.incoming_phone_numbers.length === 0) {
      throw new Error('Phone number not found in your Twilio account');
    }

    const phoneSid = listData.incoming_phone_numbers[0].sid;
    console.log('Found phone number SID:', phoneSid);

    const updateUrl = `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/IncomingPhoneNumbers/${phoneSid}.json`;

    const formData = new URLSearchParams();
    formData.append('SmsUrl', webhook_url);
    formData.append('SmsMethod', 'POST');

    console.log('Configuring webhook:', webhook_url);

    const updateResponse = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Error configuring webhook:', errorText);

      if (updateResponse.status === 401) {
        throw new Error('Identifiants Twilio invalides.');
      }
      if (updateResponse.status === 400) {
        throw new Error('URL du webhook invalide ou format incorrect.');
      }

      throw new Error(`Impossible de configurer le webhook (${updateResponse.status}).`);
    }

    const data = await updateResponse.json();

    console.log('Webhook configured successfully for:', phone_number);

    return new Response(
      JSON.stringify({
        success: true,
        phone_number: data.phone_number,
        sms_url: data.sms_url,
        message: 'Webhook configured successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error configuring webhook:', error);
    return new Response(
      JSON.stringify({
        error: 'Error configuring webhook',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
