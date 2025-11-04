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
    const { account_sid, auth_token, areaCode, contains, country } = await req.json();

    if (!account_sid || !auth_token) {
      return new Response(
        JSON.stringify({ error: 'Account SID and Auth Token required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = 'Basic ' + btoa(`${account_sid}:${auth_token}`);

    let url = `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/AvailablePhoneNumbers/${country}/Local.json?`;

    if (areaCode) {
      url += `AreaCode=${areaCode}&`;
    }
    if (contains) {
      url += `Contains=${contains}&`;
    }

    url += 'SmsEnabled=true&MmsEnabled=true&VoiceEnabled=true';

    console.log('Searching Twilio numbers:', { country, areaCode, contains });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio API error:', errorText);
      throw new Error(`Twilio API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    console.log(`Found ${data.available_phone_numbers?.length || 0} numbers`);

    return new Response(
      JSON.stringify({
        success: true,
        numbers: data.available_phone_numbers || [],
        count: data.available_phone_numbers?.length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error searching Twilio numbers:', error);
    return new Response(
      JSON.stringify({
        error: 'Error searching numbers',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
