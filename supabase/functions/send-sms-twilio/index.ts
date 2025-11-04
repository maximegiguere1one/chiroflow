import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SendSMSRequest {
  to: string;
  body: string;
  conversationId?: string;
  contactId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: SendSMSRequest = await req.json();
    const { to, body, conversationId, contactId } = requestData;

    if (!to || !body || !contactId) {
      throw new Error('Missing required fields: to, body, contactId');
    }

    console.log('Looking for settings for user:', user.id);

    const { data: settingsArray, error: settingsError } = await supabase
      .from('clinic_settings')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, sms_enabled')
      .eq('owner_id', user.id)
      .limit(1);

    console.log('Settings query result:', { settingsArray, settingsError });

    const settings = settingsArray?.[0];

    if (!settings) {
      throw new Error(`Twilio settings not configured for user ${user.id}. Please configure Twilio in Settings.`);
    }

    if (settings.sms_enabled === false) {
      throw new Error('SMS n\'est pas activé. Activez-le dans Paramètres > Téléphonie SMS.');
    }

    if (!settings.twilio_account_sid || !settings.twilio_auth_token) {
      throw new Error('Twilio credentials not configured');
    }

    const from = settings.twilio_phone_number || Deno.env.get('TWILIO_PHONE_NUMBER');
    if (!from) {
      throw new Error('Twilio phone number not configured');
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${settings.twilio_account_sid}/Messages.json`;
    const auth = btoa(`${settings.twilio_account_sid}:${settings.twilio_auth_token}`);

    const formData = new URLSearchParams();
    formData.append('To', to.replace(/\D/g, '').startsWith('1') ? `+${to.replace(/\D/g, '')}` : `+1${to.replace(/\D/g, '')}`);
    formData.append('From', from);
    formData.append('Body', body);

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
      throw new Error(twilioData.message || 'Failed to send SMS');
    }

    let finalConversationId = conversationId;

    if (!finalConversationId) {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', contactId)
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .eq('channel', 'sms')
        .maybeSingle();

      if (existingConv) {
        finalConversationId = existingConv.id;
      } else {
        const { data: contact } = await supabase
          .from('contacts')
          .select('full_name')
          .eq('id', contactId)
          .single();

        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            contact_id: contactId,
            owner_id: user.id,
            subject: `SMS avec ${contact?.full_name || 'Patient'}`,
            status: 'active',
            channel: 'sms',
            last_message_at: new Date().toISOString(),
            last_message_preview: body.substring(0, 100),
          })
          .select()
          .single();

        if (convError) {
          console.error('Error creating conversation:', convError);
        } else {
          finalConversationId = newConv.id;
        }
      }
    }

    const { data: message, error: messageError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: finalConversationId,
        contact_id: contactId,
        twilio_message_sid: twilioData.sid,
        channel: 'sms',
        direction: 'outbound',
        from_address: from,
        to_address: to,
        body: body,
        status: twilioData.status === 'queued' || twilioData.status === 'sent' ? 'sent' : 'pending',
        sent_at: new Date().toISOString(),
        owner_id: user.id,
        metadata: {
          twilio_sid: twilioData.sid,
          twilio_status: twilioData.status,
          twilio_price: twilioData.price,
          twilio_price_unit: twilioData.price_unit,
        },
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving message:', messageError);
    }

    if (finalConversationId) {
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: body.substring(0, 100),
          updated_at: new Date().toISOString(),
        })
        .eq('id', finalConversationId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SMS sent successfully',
        twilioSid: twilioData.sid,
        conversationId: finalConversationId,
        messageId: message?.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-sms-twilio:', error);
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
